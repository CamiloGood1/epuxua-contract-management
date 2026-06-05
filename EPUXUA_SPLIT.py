"""
EPUXUA — Divide EPUXUA_IMPORT.sql en 8 partes ejecutables
en el SQL Editor de Supabase (cada una < 300 KB).

Uso:
  python3 EPUXUA_SPLIT.py
  → genera clean_data/parte_1_supervisors_contractors.sql
             clean_data/parte_2_contracts.sql
             ...
"""

import uuid
import pandas as pd, math, re
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent / "clean_data"
BATCH = 100

PARENT_REF_OVERRIDES = {
    "286-2024": "140-2024",
    "154-2024": "1395-2024",
    "2257-2025": "02257-2025",
}

def ref_variants(ref: str) -> list[str]:
    ref = re.sub(r"\s+", "-", str(ref).strip())
    out = [ref]
    m = re.match(r"^(\d+)-(\d{4})$", ref)
    if not m:
        return out
    num, yr = m.group(1), m.group(2)
    out.append(f"{int(num)}-{yr}")
    out.append(f"{num.zfill(5)}-{yr}")
    out.append(f"{num.zfill(4)}-{yr}")
    return list(dict.fromkeys(out))

def extract_interadmin_refs_from_text(text: Optional[str]) -> list[str]:
    if not text:
        return []
    return [f"{m.group(1)}-{m.group(2)}" for m in re.finditer(
        r"(\d{3,5})\s*[- ]\s*(\d{4})", str(text), re.I
    )]

def resolve_parent_ref(ref: str, object_text: Optional[str], interadmin_numbers: set[str]) -> str:
    ref = str(ref).strip()
    candidates: list[str] = []
    if ref in PARENT_REF_OVERRIDES:
        candidates.append(PARENT_REF_OVERRIDES[ref])
    candidates.append(ref)
    candidates.extend(ref_variants(ref))
    for extracted in extract_interadmin_refs_from_text(object_text):
        candidates.extend([extracted, *ref_variants(extracted)])
    for c in candidates:
        c = re.sub(r"\s+", "-", c.strip())
        for v in ref_variants(c):
            if v in interadmin_numbers:
                return v
    return PARENT_REF_OVERRIDES.get(ref, ref)

# ── helpers (igual que EPUXUA_IMPORT.py) ─────────────────────

def _clean_sql_text(val) -> Optional[str]:
    """Normaliza texto para literales SQL (sin saltos de línea)."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip()
    if s in ("", "nan", "NaN", "None", "NaT"):
        return None
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = re.sub(r"\s+", " ", s)
    return s or None

def q(val) -> str:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    s = _clean_sql_text(val)
    if s is None:
        return "NULL"
    return f"'{s.replace(chr(39), chr(39)+chr(39))}'"

def doc_q(val) -> str:
    """document_number: quita .0 de Excel, colapsa líneas, cabe en varchar(20)."""
    s = _clean_sql_text(val)
    if s is None:
        return "NULL"
    if re.fullmatch(r"\d+\.0", s):
        s = s[:-2]
    if len(s) > 20:
        s = s[:20]
    return f"'{s.replace(chr(39), chr(39)+chr(39))}'"

def numeric_q(val) -> str:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return "NULL"
    try:
        f = float(val)
        return "NULL" if math.isnan(f) else str(f)
    except (ValueError, TypeError):
        return "NULL"

def bool_q(val) -> str:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return "NULL"
    s = str(val).strip().lower()
    return "TRUE" if s in ("true","1","yes","si","sí") else ("FALSE" if s in ("false","0","no") else "NULL")

def int_q(val, default="NULL") -> str:
    try:
        s = str(val).strip()
        if s in ("","nan","None","NaT"):
            return default
        return str(int(float(s)))
    except:
        return default

def split_presupuesto_tokens(raw, max_len: int = 50) -> list[str]:
    """Varios CDP/CRP o rubros en una celda (saltos de línea o espacios)."""
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return []
    text = str(raw).strip()
    if text in ("", "nan", "NaN", "None"):
        return []
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    tokens: list[str] = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        for part in re.split(r"[\s,;|]+", line):
            p = part.strip()
            if p and p.upper() not in ("N/A", "NA", "NONE"):
                tokens.append(p[:max_len])
    return tokens

def _parse_date_token(val) -> Optional[str]:
    s = _clean_sql_text(val)
    if s is None:
        return None
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    return None

def budget_commitment_date_q(row, contract_dates: dict) -> str:
    """Fecha CDP/CRP: Excel → subscription_date del contrato → start_date."""
    d = _parse_date_token(row.get("date"))
    if d:
        return q(d)
    cid = str(row.get("contract_id", "")).strip()
    meta = contract_dates.get(cid) or {}
    for key in ("subscription_date", "start_date"):
        d = _parse_date_token(meta.get(key))
        if d:
            return q(d)
    yr = meta.get("year")
    if yr and str(yr).strip().isdigit():
        return q(f"{int(float(yr))}-01-01")
    return q("2020-01-01")

def expand_budget_commitments(df: pd.DataFrame) -> pd.DataFrame:
    """Una fila por número CDP/CRP (varchar(50)); valor solo en el primero."""
    rows = []
    for _, r in df.iterrows():
        base = r.to_dict()
        nums = split_presupuesto_tokens(base.get("number"), 50)
        codes = split_presupuesto_tokens(base.get("budget_code"), 120)
        if len(nums) <= 1:
            if nums:
                base["number"] = nums[0]
            if codes:
                base["budget_code"] = codes[0]
            rows.append(base)
            continue
        try:
            val = float(base.get("value") or 0)
        except (TypeError, ValueError):
            val = 0.0
        for i, num in enumerate(nums):
            row = dict(base)
            row["id"] = base["id"] if i == 0 else str(uuid.uuid4())
            row["number"] = num
            row["budget_code"] = codes[i] if i < len(codes) else (codes[0] if codes else None)
            row["value"] = val if i == 0 else 0
            rows.append(row)
    return pd.DataFrame(rows)

def write_batches(out, table, cols, rows, conflict):
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i+BATCH]
        vals = ",\n  ".join(f"({', '.join(r)})" for r in batch)
        out.write(f"INSERT INTO {table} ({', '.join(cols)})\nVALUES\n  {vals}\n{conflict};\n\n")

def header(out, num, title):
    out.write(f"-- {'='*58}\n")
    out.write(f"-- PARTE {num}: {title}\n")
    out.write(f"-- {'='*58}\n\n")
    out.write("BEGIN;\n\n")

def footer(out, validation_sql=""):
    if validation_sql:
        out.write(validation_sql + "\n\n")
    out.write("COMMIT;\n")

# ── Cargar CSVs ───────────────────────────────────────────────

print("Leyendo CSVs…")
df_sup = pd.read_csv(DATA_DIR/"supervisors.csv",  dtype=str)
df_con = pd.read_csv(DATA_DIR/"contractors.csv",  dtype=str)
df_ctr = pd.read_csv(DATA_DIR/"contracts.csv",    dtype=str)
df_amd = pd.read_csv(DATA_DIR/"contract_amendments.csv", dtype=str)
df_ext = pd.read_csv(DATA_DIR/"contract_extensions.csv", dtype=str)
df_bc_raw = pd.read_csv(DATA_DIR/"budget_commitments.csv", dtype=str)
df_bc  = expand_budget_commitments(df_bc_raw)
df_pol = pd.read_csv(DATA_DIR/"contract_policies.csv",   dtype=str)
df_iad = pd.read_csv(DATA_DIR/"interadmin_contract_details.csv", dtype=str)
df_ipd = pd.read_csv(DATA_DIR/"invoice_payment_details.csv",     dtype=str)
df_mip = pd.read_csv(DATA_DIR/"mipymes_stats.csv",  dtype=str)
df_pay = pd.read_csv(DATA_DIR/"payments.csv",       dtype=str)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 1 — Supervisores + Contratistas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

p1 = DATA_DIR / "parte_1_supervisors_contractors.sql"
with open(p1, "w") as out:
    header(out, 1, "SUPERVISORES + CONTRATISTAS")

    # Supervisores — ON CONFLICT (id) para garantizar que el UUID del CSV
    # siempre queda en la BD (norm_name puede colisionar si hay restos de
    # imports anteriores con UUIDs distintos).
    rows = [[q(r["id"]), q(r["full_name"]), "TRUE"] for _, r in df_sup.iterrows()]
    write_batches(out, "supervisors", ["id","full_name","active"], rows,
                  "ON CONFLICT (id) DO NOTHING")

    # Contratistas
    rows = []
    for _, r in df_con.iterrows():
        dn = r.get("document_number","")
        dt = r.get("document_type","")
        rows.append([
            q(r["id"]), q(r["full_name"]),
            q(str(r.get("person_type","NATURAL")).strip() or "NATURAL"),
            doc_q(dn),
            "NULL" if _clean_sql_text(dt) is None else q(dt),
            "TRUE",
        ])
    write_batches(out, "contractors",
                  ["id","full_name","person_type","document_number","document_type","active"],
                  rows, "ON CONFLICT (id) DO NOTHING")

    footer(out, "SELECT 'supervisors' AS t, COUNT(*) FROM supervisors\nUNION ALL\nSELECT 'contractors', COUNT(*) FROM contractors;")

print(f"  Parte 1: {p1.stat().st_size//1024} KB  ({len(df_sup)+len(df_con)} filas)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 2 — Contratos (mitad 1)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLS_CTR = [
    "id","contract_number","selection_process_number","year",
    "contract_type","selection_modality","contract_class","resource_type",
    "contractor_id","supervisor_id","responsible_area_id",
    "object","subscription_date","publication_date",
    "start_date","initial_term_text","initial_term_days","end_date",
    "liquidation_date","file_closure_date","monthly_value",
    "initial_value","total_additions_value","paid_value","future_validity",
    "status","secop_url","technical_file_url","interventor","observations",
]

def contract_row(r):
    area_raw = r.get("supervisor_area","")
    area_expr = (
        f"(SELECT id FROM responsible_areas WHERE norm_name = normalize_text({q(str(area_raw).strip())}) LIMIT 1)"
        if str(area_raw).strip() not in ("","nan","None") else "NULL"
    )
    sup_id = r.get("supervisor_id","")
    sup_q  = q(sup_id) if str(sup_id).strip() not in ("","nan","None") else "NULL"
    td = int_q(r.get("initial_term_days",""))
    return [
        q(r["id"]), q(r["contract_number"]), q(r.get("selection_process_number")),
        int_q(r["year"]),
        q(r["contract_type"])+"::contract_type_enum",
        q(r["selection_modality"])+"::selection_modality_enum",
        q(r["contract_class"]), q(r.get("resource_type")),
        q(r["contractor_id"]), sup_q, area_expr,
        q(r["object"]),
        q(r.get("subscription_date")), q(r.get("publication_date")),
        q(r.get("start_date")), q(r.get("initial_term_text")), td,
        q(r.get("end_date")), q(r.get("liquidation_date")), q(r.get("file_closure_date")),
        numeric_q(r.get("monthly_value")),
        numeric_q(r.get("initial_value","0")),
        numeric_q(r.get("total_additions_value","0")),
        numeric_q(r.get("paid_value","0")),
        numeric_q(r.get("future_validity","0")),
        q(r["status"])+"::contract_status_enum",
        q(r.get("secop_url")), q(r.get("technical_file_url")),
        q(r.get("interventor")), q(r.get("observations")),
    ]

mid = len(df_ctr) // 2
for part_num, slice_df, label in [
    (2, df_ctr.iloc[:mid],  f"CONTRATOS filas 1–{mid}"),
    (3, df_ctr.iloc[mid:],  f"CONTRATOS filas {mid+1}–{len(df_ctr)}"),
]:
    fname = DATA_DIR / f"parte_{part_num}_contracts_{part_num-1}.sql"
    with open(fname, "w") as out:
        header(out, part_num, label)
        # Contratos tienen subquery → INSERT individual (no batch)
        for _, r in slice_df.iterrows():
            row = contract_row(r)
            vals = ", ".join(row)
            out.write(
                f"INSERT INTO contracts ({', '.join(COLS_CTR)})\n"
                f"VALUES ({vals})\nON CONFLICT (id) DO NOTHING;\n\n"
            )
        footer(out, f"SELECT COUNT(*) AS contratos_importados FROM contracts;")
    print(f"  Parte {part_num}: {fname.stat().st_size//1024} KB  ({len(slice_df)} contratos)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 4 — Resolver parent_contract_id + Interadmin + PCF
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

p4 = DATA_DIR / "parte_4_parents_interadmin_pcf.sql"
with open(p4, "w") as out:
    header(out, 4, "PARENT REFS + INTERADMIN + PCF DETAILS")

    # parent_contract_id (resuelve alias, ceros a la izquierda y número en objeto)
    interadmin_numbers = set(
        df_ctr.loc[df_ctr["contract_type"] == "INTERADMINISTRATIVO", "contract_number"]
        .astype(str).str.strip()
    )
    has_parent = df_ctr[
        df_ctr["parent_contract_ref"].notna() &
        ~df_ctr["parent_contract_ref"].isin(["","nan","None"])
    ]
    for _, r in has_parent.iterrows():
        raw_ref = str(r["parent_contract_ref"]).strip()
        parent_num = resolve_parent_ref(
            raw_ref, r.get("object"), interadmin_numbers
        )
        if parent_num not in interadmin_numbers:
            continue
        out.write(
            f"UPDATE contracts SET parent_contract_id = "
            f"(SELECT id FROM contracts WHERE contract_number = {q(parent_num)} "
            f"AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) "
            f"WHERE id = {q(str(r['id']).strip())};\n"
        )
    out.write("\n")

    # interadmin details
    cols = ["id","contract_id","secretaria","admin_fee_initial","admin_fee_additions",
            "mandate_pool_initial","mandate_pool_additions","pending_collection"]
    rows = [[q(r["id"]),q(r["contract_id"]),q(r["secretaria"]),
             numeric_q(r.get("admin_fee_initial","0")), numeric_q(r.get("admin_fee_additions","0")),
             numeric_q(r.get("mandate_pool_initial","0")), numeric_q(r.get("mandate_pool_additions","0")),
             numeric_q(r.get("pending_collection","0"))] for _, r in df_iad.iterrows()]
    write_batches(out, "interadmin_contract_details", cols, rows, "ON CONFLICT (contract_id) DO NOTHING")

    # invoice payment details
    cols = ["id","contract_id","committee_number","committee_act_info","invoice_date","requesting_officer"]
    rows = [[q(r["id"]),q(r["contract_id"]),q(r.get("committee_number")),
             q(r.get("committee_act_info")),q(r.get("invoice_date")),q(r.get("requesting_officer"))]
            for _, r in df_ipd.iterrows()]
    write_batches(out, "invoice_payment_details", cols, rows, "ON CONFLICT (contract_id) DO NOTHING")

    footer(out, "SELECT COUNT(*) AS parent_refs FROM contracts WHERE parent_contract_id IS NOT NULL;")

print(f"  Parte 4: {p4.stat().st_size//1024} KB  ({len(has_parent)} updates + {len(df_iad)+len(df_ipd)} detalles)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 5 — CDP/CRP (1215 filas — archivo más grande)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contract_dates = {
    str(r["id"]).strip(): {
        "subscription_date": r.get("subscription_date"),
        "start_date": r.get("start_date"),
        "year": r.get("year"),
    }
    for _, r in df_ctr.iterrows()
}

p5 = DATA_DIR / "parte_5_budget_commitments.sql"
with open(p5, "w") as out:
    header(out, 5, "BUDGET COMMITMENTS (CDP / CRP)")
    cols = ["id","contract_id","commitment_type","number","value","budget_code","date","is_addition"]
    rows = []
    for _, r in df_bc.iterrows():
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            q(r["commitment_type"])+"::commitment_type_enum",
            q(r["number"]),
            numeric_q(r.get("value","0")),
            q(r.get("budget_code")),
            budget_commitment_date_q(r, contract_dates),
            "FALSE",
        ])
    write_batches(out, "budget_commitments", cols, rows,
                  "ON CONFLICT (contract_id, commitment_type, number) DO NOTHING")
    footer(out, "SELECT COUNT(*) AS budget_commitments FROM budget_commitments;")

print(f"  Parte 5: {p5.stat().st_size//1024} KB  ({len(df_bc)} filas)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 6 — Adiciones + Prórrogas + Pólizas + MiPymes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

p6 = DATA_DIR / "parte_6_amendments_extensions_policies_mipymes.sql"
with open(p6, "w") as out:
    header(out, 6, "ADICIONES + PRÓRROGAS + PÓLIZAS + MIPYMES")

    # amendments
    cols = ["id","contract_id","amendment_number","modification_type","amendment_value",
            "amendment_date","cdp_number","cdp_value","cdp_date","cdp_budget_code",
            "crp_number","crp_value","crp_date","crp_budget_code"]
    rows = [[q(r["id"]),q(r["contract_id"]),int_q(r.get("amendment_number","1"),"1"),
             q(str(r.get("modification_type","ADICION")).strip() or "ADICION"),
             numeric_q(r.get("amendment_value","0")), q(r.get("amendment_date")),
             q(r.get("cdp_number")), numeric_q(r.get("cdp_value")), q(r.get("cdp_date")),
             q(r.get("cdp_budget_code")), q(r.get("crp_number")), numeric_q(r.get("crp_value")),
             q(r.get("crp_date")), q(r.get("crp_budget_code"))]
            for _, r in df_amd.iterrows()]
    write_batches(out, "contract_amendments", cols, rows,
                  "ON CONFLICT (contract_id, amendment_number) DO NOTHING")

    # extensions
    cols = ["id","contract_id","extension_number","extension_term_text",
            "extension_term_days","extension_date","new_end_date"]
    rows = [[q(r["id"]),q(r["contract_id"]),int_q(r.get("extension_number","1"),"1"),
             q(r.get("extension_term_text")), int_q(r.get("extension_term_days","")),
             q(r.get("extension_date")), q(r.get("new_end_date"))]
            for _, r in df_ext.iterrows()]
    write_batches(out, "contract_extensions", cols, rows,
                  "ON CONFLICT (contract_id, extension_number) DO NOTHING")

    # policies
    cols = ["id","contract_id","policy_number","issuing_entity",
            "issue_date","start_date","end_date","approval_date"]
    rows = [[q(r["id"]),q(r["contract_id"]),q(r.get("policy_number")),q(r.get("issuing_entity")),
             q(r.get("issue_date")),q(r.get("start_date")),q(r.get("end_date")),q(r.get("approval_date"))]
            for _, r in df_pol.iterrows()]
    write_batches(out, "contract_policies", cols, rows, "ON CONFLICT (contract_id) DO NOTHING")

    # mipymes
    cols = ["id","contract_id","providers_consulted","mipymes_consulted","providers_presented",
            "mipymes_presented","mipymes_benefited","mipymes_participated","limited_to_mipymes","awarded_to_mipymes"]
    rows = [[q(r["id"]),q(r["contract_id"]),
             int_q(r.get("providers_consulted","")), int_q(r.get("mipymes_consulted","")),
             int_q(r.get("providers_presented","")), int_q(r.get("mipymes_presented","")),
             int_q(r.get("mipymes_benefited","")),
             bool_q(r.get("mipymes_participated")), bool_q(r.get("limited_to_mipymes")), bool_q(r.get("awarded_to_mipymes"))]
            for _, r in df_mip.iterrows()]
    write_batches(out, "mipymes_stats", cols, rows, "ON CONFLICT (contract_id) DO NOTHING")

    footer(out)

print(f"  Parte 6: {p6.stat().st_size//1024} KB  ({len(df_amd)+len(df_ext)+len(df_pol)+len(df_mip)} filas)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 7 — Pagos (1149 filas)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

p7 = DATA_DIR / "parte_7_payments.sql"
with open(p7, "w") as out:
    header(out, 7, "PAGOS INDIVIDUALES")
    cols = ["id","contract_id","payment_number","payment_date",
            "gross_value","deductions","cumulative_percentage","drive_url"]
    rows = [[q(r["id"]),q(r["contract_id"]),int_q(r.get("payment_number","0"),"0"),
             q(r.get("payment_date")), numeric_q(r.get("gross_value","0")),
             numeric_q(r.get("deductions","0")), numeric_q(r.get("cumulative_percentage")),
             q(r.get("drive_url"))]
            for _, r in df_pay.iterrows()]
    write_batches(out, "payments", cols, rows,
                  "ON CONFLICT (contract_id, payment_number) DO NOTHING")
    footer(out, "SELECT COUNT(*) AS pagos FROM payments;")

print(f"  Parte 7: {p7.stat().st_size//1024} KB  ({len(df_pay)} filas)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 8 — Recalcular totales + Validación final
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

p8 = DATA_DIR / "parte_8_recalculate_validate.sql"
exp_parents = sum(
    1 for _, r in df_ctr[
        df_ctr["parent_contract_ref"].notna() &
        ~df_ctr["parent_contract_ref"].isin(["", "nan", "None"])
    ].iterrows()
    if resolve_parent_ref(
        str(r["parent_contract_ref"]).strip(),
        r.get("object"),
        interadmin_numbers,
    ) in interadmin_numbers
)
with open(p8, "w") as out:
    header(out, 8, "RECALCULAR TOTALES + VALIDACIÓN FINAL")
    out.write(f"""
-- Recalcular paid_value
UPDATE contracts c
SET paid_value = COALESCE((
  SELECT SUM(gross_value - deductions) FROM payments WHERE contract_id = c.id
), 0)
WHERE EXISTS (SELECT 1 FROM payments WHERE contract_id = c.id);

-- Recalcular total_additions_value
UPDATE contracts c
SET total_additions_value = COALESCE((
  SELECT SUM(amendment_value) FROM contract_amendments WHERE contract_id = c.id
), 0)
WHERE EXISTS (SELECT 1 FROM contract_amendments WHERE contract_id = c.id);

-- Actualizar end_date con la última prórroga
UPDATE contracts c
SET end_date = sub.new_end_date
FROM (
  SELECT DISTINCT ON (contract_id) contract_id, new_end_date
  FROM contract_extensions
  WHERE new_end_date IS NOT NULL
  ORDER BY contract_id, extension_number DESC
) sub
WHERE c.id = sub.contract_id;

COMMIT;

-- ── VALIDACIÓN FINAL ───────────────────────────────────────────
SELECT tabla, total, esperado,
  CASE WHEN total = esperado THEN '✅ OK' ELSE '❌ REVISAR' END AS estado
FROM (VALUES
  ('supervisors',              (SELECT COUNT(*) FROM supervisors)::int,              {len(df_sup)}),
  ('contractors',              (SELECT COUNT(*) FROM contractors)::int,             {len(df_con)}),
  ('contracts',                (SELECT COUNT(*) FROM contracts)::int,               793),
  ('contratos DIRECTO',        (SELECT COUNT(*) FROM contracts WHERE contract_type = 'DIRECTO')::int,              {(df_ctr.contract_type == 'DIRECTO').sum()}),
  ('contratos DERIVADO',       (SELECT COUNT(*) FROM contracts WHERE contract_type = 'DERIVADO')::int,             {(df_ctr.contract_type == 'DERIVADO').sum()}),
  ('contratos INTERADMIN',     (SELECT COUNT(*) FROM contracts WHERE contract_type = 'INTERADMINISTRATIVO')::int,   {(df_ctr.contract_type == 'INTERADMINISTRATIVO').sum()}),
  ('contratos TIENDA_VIRTUAL', (SELECT COUNT(*) FROM contracts WHERE contract_type = 'TIENDA_VIRTUAL')::int,        35),
  ('contratos PAGO_FACTURA',   (SELECT COUNT(*) FROM contracts WHERE contract_type = 'PAGO_FACTURA')::int,          76),
  ('contratos con padre',      (SELECT COUNT(*) FROM contracts WHERE parent_contract_id IS NOT NULL)::int,         {exp_parents}),
  ('interadmin_details',       (SELECT COUNT(*) FROM interadmin_contract_details)::int,                             65),
  ('invoice_details',          (SELECT COUNT(*) FROM invoice_payment_details)::int,                                 76),
  ('budget_commitments',       (SELECT COUNT(*) FROM budget_commitments)::int,                                    1239),
  ('amendments',               (SELECT COUNT(*) FROM contract_amendments)::int,                                    158),
  ('extensions',               (SELECT COUNT(*) FROM contract_extensions)::int,                                    224),
  ('policies',                 (SELECT COUNT(*) FROM contract_policies)::int,                                       75),
  ('mipymes_stats',            (SELECT COUNT(*) FROM mipymes_stats)::int,                                          100),
  ('payments',                 (SELECT COUNT(*) FROM payments)::int,                                              1148)
) AS t(tabla, total, esperado)
ORDER BY tabla;
""")

print(f"  Parte 8: {p8.stat().st_size//1024} KB")

# ── Resumen ───────────────────────────────────────────────────
print("\n✅ 8 archivos generados en clean_data/:")
for i, f in enumerate(sorted(DATA_DIR.glob("parte_*.sql")), 1):
    print(f"  {f.name}  ({f.stat().st_size//1024} KB)")
print("\nORDEN DE EJECUCIÓN EN SUPABASE SQL EDITOR:")
print("  1. EPUXUA_FIX_CONSTRAINT.sql  (limpieza + fix constraint)")
print("  2. parte_1_supervisors_contractors.sql")
print("  3. parte_2_contracts_1.sql")
print("  4. parte_3_contracts_2.sql")
print("  5. parte_4_parents_interadmin_pcf.sql")
print("  6. parte_5_budget_commitments.sql")
print("  7. parte_6_amendments_extensions_policies_mipymes.sql")
print("  8. parte_7_payments.sql")
print("  9. parte_8_recalculate_validate.sql")
