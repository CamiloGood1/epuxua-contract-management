"""
EPUXUA — Script de importación a Supabase
Lee los CSVs de clean_data/ y genera EPUXUA_IMPORT.sql
listo para ejecutar en el SQL Editor de Supabase.

Orden de importación (respeta FKs):
  1. supervisors
  2. contractors
  3. contracts (sin parent_contract_id todavía)
  4. UPDATE parent_contract_id (resolución FK post-insert)
  5. UPDATE responsible_area_id (resolución por nombre)
  6. interadmin_contract_details
  7. invoice_payment_details
  8. budget_commitments
  9. contract_amendments
 10. contract_extensions
 11. contract_policies
 12. mipymes_stats
 13. payments

Uso:
  python3 EPUXUA_IMPORT.py
  → genera clean_data/EPUXUA_IMPORT.sql
"""

import math
import re
import uuid
import pandas as pd
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent / "clean_data"
OUT_FILE = DATA_DIR / "EPUXUA_IMPORT.sql"

BATCH_SIZE = 100   # filas por INSERT (Supabase SQL editor soporta hasta ~500 KB por statement)

# ── Helpers ────────────────────────────────────────────────────

def _clean_sql_text(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip()
    if s in ("", "nan", "NaN", "None", "NaT"):
        return None
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = re.sub(r"\s+", " ", s)
    return s or None

def q(val) -> str:
    """Convierte un valor Python a literal SQL seguro."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    s = _clean_sql_text(val)
    if s is None:
        return "NULL"
    s = s.replace("'", "''")
    return f"'{s}'"

def doc_q(val) -> str:
    s = _clean_sql_text(val)
    if s is None:
        return "NULL"
    if re.fullmatch(r"\d+\.0", s):
        s = s[:-2]
    if len(s) > 20:
        s = s[:20]
    return f"'{s.replace(chr(39), chr(39)+chr(39))}'"

def bool_q(val) -> str:
    """Convierte True/False/nan → TRUE/FALSE/NULL."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    s = str(val).strip().lower()
    if s in ("true", "1", "yes", "si", "sí"):
        return "TRUE"
    if s in ("false", "0", "no"):
        return "FALSE"
    return "NULL"

def numeric_q(val) -> str:
    """Convierte valor a numeric SQL o NULL."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return "NULL"
    try:
        f = float(val)
        return str(f) if not math.isnan(f) else "NULL"
    except (ValueError, TypeError):
        return "NULL"

def split_presupuesto_tokens(raw, max_len: int = 50) -> list[str]:
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

def write_insert(
    out,
    table: str,
    columns: list[str],
    rows: list[list],
    on_conflict: str = "",
) -> int:
    """
    Escribe INSERTs en batches de BATCH_SIZE.
    Retorna el número de filas escritas.
    """
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        vals = ",\n  ".join(
            f"({', '.join(r)})" for r in batch
        )
        stmt = (
            f"INSERT INTO {table} ({', '.join(columns)})\nVALUES\n  {vals}"
        )
        if on_conflict:
            stmt += f"\n{on_conflict}"
        out.write(stmt + ";\n\n")
        total += len(batch)
    return total

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print("Leyendo CSVs…")

df_sup  = pd.read_csv(DATA_DIR / "supervisors.csv", dtype=str)
df_con  = pd.read_csv(DATA_DIR / "contractors.csv", dtype=str)
df_ctr  = pd.read_csv(DATA_DIR / "contracts.csv", dtype=str)
df_amd  = pd.read_csv(DATA_DIR / "contract_amendments.csv", dtype=str)
df_ext  = pd.read_csv(DATA_DIR / "contract_extensions.csv", dtype=str)
df_bc   = expand_budget_commitments(
    pd.read_csv(DATA_DIR / "budget_commitments.csv", dtype=str)
)
df_pol  = pd.read_csv(DATA_DIR / "contract_policies.csv", dtype=str)
df_iad  = pd.read_csv(DATA_DIR / "interadmin_contract_details.csv", dtype=str)
df_ipd  = pd.read_csv(DATA_DIR / "invoice_payment_details.csv", dtype=str)
df_mip  = pd.read_csv(DATA_DIR / "mipymes_stats.csv", dtype=str)
df_pay  = pd.read_csv(DATA_DIR / "payments.csv", dtype=str)

# Lookup: contract_number → contract_id (para resolver parent_contract_ref)
# Un mismo número puede aparecer en distintos años; la ref siempre apunta al interadmin
contract_lookup: dict[str, str] = {}
for _, row in df_ctr.iterrows():
    cn = str(row["contract_number"]).strip()
    ctype = str(row.get("contract_type", "")).strip()
    # Preferir los interadministrativos como padres
    if ctype == "INTERADMINISTRATIVO" or cn not in contract_lookup:
        contract_lookup[cn] = str(row["id"]).strip()

# Lookup: norm_name → supervisor_id (para validar)
sup_lookup = {
    str(r["id"]).strip(): str(r["full_name"]).strip()
    for _, r in df_sup.iterrows()
}

# Lookup: área norm → responsible_area UUID (se resolverá en SQL via subquery)
# Los UUIDs de áreas son generados por gen_random_uuid() en la BD,
# así que usamos subquery en el INSERT de contracts.

with open(OUT_FILE, "w", encoding="utf-8") as out:

    out.write("""-- ============================================================
-- EPUXUA — Script de Importación de Datos
-- Generado automáticamente por EPUXUA_IMPORT.py
-- Ejecutar DESPUÉS de EPUXUA_DDL.sql
-- ============================================================
-- INSTRUCCIONES:
--   1. Abrir Supabase → SQL Editor
--   2. Pegar y ejecutar este script
--   3. Los INSERTs usan ON CONFLICT DO NOTHING (idempotentes)
--   4. Verificar conteos al final con las queries de validación
-- ============================================================

BEGIN; -- Transacción única: si algo falla, todo se revierte

SET session_replication_role = 'replica';
-- Deshabilita temporalmente los triggers de sincronización
-- (paid_value, total_additions_value, end_date) durante la carga masiva.
-- Los valores correctos ya vienen del Excel limpiado.
-- Se rehabilita al hacer COMMIT.

""")

    # ── 1. SUPERVISORES ─────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 1. SUPERVISORES\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = ["id", "full_name", "active"]
    rows = []
    for _, r in df_sup.iterrows():
        rows.append([
            q(r["id"]),
            q(r["full_name"]),
            "TRUE",
        ])

    n = write_insert(out, "supervisors", cols, rows,
                     "ON CONFLICT (id) DO NOTHING")
    print(f"  supervisors:  {n} filas")

    # ── 2. CONTRATISTAS ─────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 2. CONTRATISTAS\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = ["id", "full_name", "person_type", "document_number", "document_type", "active"]
    rows = []
    for _, r in df_con.iterrows():
        doc_num = r.get("document_number")
        doc_type = r.get("document_type")
        doc_num_q  = doc_q(doc_num)
        doc_type_q = q(doc_type) if _clean_sql_text(doc_type) is not None else "NULL"
        rows.append([
            q(r["id"]),
            q(r["full_name"]),
            q(str(r.get("person_type", "NATURAL")).strip() or "NATURAL"),
            doc_num_q,
            doc_type_q,
            "TRUE",
        ])

    # ON CONFLICT en id (PK): idempotente por UUID.
    # NO usar document_number aquí: 385 de 485 contratistas no tienen
    # documento → colisionarían entre sí y se perderían sus UUIDs,
    # rompiendo la FK en contracts.
    # La unicidad por documento se garantiza con el índice parcial
    # (uq_contractors_document WHERE document_number IS NOT NULL).
    n = write_insert(out, "contractors", cols, rows,
                     "ON CONFLICT (id) DO NOTHING")
    print(f"  contractors:  {n} filas")

    # ── 3. CONTRATOS ────────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 3. CONTRATOS (sin parent_contract_id — se resuelve en paso 4)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_number", "selection_process_number", "year",
        "contract_type", "selection_modality", "contract_class", "resource_type",
        "contractor_id", "supervisor_id", "responsible_area_id",
        "object", "subscription_date", "publication_date",
        "start_date", "initial_term_text", "initial_term_days", "end_date",
        "liquidation_date", "file_closure_date", "monthly_value",
        "initial_value", "total_additions_value", "paid_value", "future_validity",
        "status", "secop_url", "technical_file_url", "interventor", "observations",
    ]

    rows = []
    for _, r in df_ctr.iterrows():
        # responsible_area_id: subquery por nombre normalizado
        area_raw = r.get("supervisor_area")
        if area_raw and str(area_raw).strip() not in ("nan", "", "None"):
            area_expr = (
                f"(SELECT id FROM responsible_areas "
                f"WHERE norm_name = normalize_text({q(str(area_raw).strip())}) LIMIT 1)"
            )
        else:
            area_expr = "NULL"

        # supervisor_id viene del CSV como UUID directo
        sup_id = r.get("supervisor_id")
        sup_id_q = q(sup_id) if (sup_id and str(sup_id) not in ("nan","","None")) else "NULL"

        # initial_term_days: puede ser NaN
        term_days = r.get("initial_term_days")
        term_days_q = numeric_q(term_days)
        # Si es float decimal tipo "120.0" normalizamos a entero
        if term_days_q not in ("NULL",) and "." in term_days_q:
            term_days_q = str(int(float(term_days_q)))

        rows.append([
            q(r["id"]),
            q(r["contract_number"]),
            q(r.get("selection_process_number")),
            numeric_q(r["year"]).split(".")[0],           # sin decimales
            q(r["contract_type"]) + "::contract_type_enum",
            q(r["selection_modality"]) + "::selection_modality_enum",
            q(r["contract_class"]),
            q(r.get("resource_type")),
            q(r["contractor_id"]),
            sup_id_q,
            area_expr,
            q(r["object"]),
            q(r.get("subscription_date")),
            q(r.get("publication_date")),
            q(r.get("start_date")),
            q(r.get("initial_term_text")),
            term_days_q,
            q(r.get("end_date")),
            q(r.get("liquidation_date")),
            q(r.get("file_closure_date")),
            numeric_q(r.get("monthly_value")),
            numeric_q(r.get("initial_value", "0")),
            numeric_q(r.get("total_additions_value", "0")),
            numeric_q(r.get("paid_value", "0")),
            numeric_q(r.get("future_validity", "0")),
            q(r["status"]) + "::contract_status_enum",
            q(r.get("secop_url")),
            q(r.get("technical_file_url")),
            q(r.get("interventor")),
            q(r.get("observations")),
        ])

    # Los contratos tienen subqueries → no podemos usar write_insert genérico,
    # hay que escribir uno a uno (Supabase no acepta VALUES con subqueries en batch)
    total_ctr = 0
    for row in rows:
        vals = ", ".join(row)
        stmt = (
            f"INSERT INTO contracts ({', '.join(cols)})\n"
            f"VALUES ({vals})\n"
            f"ON CONFLICT (id) DO NOTHING;\n\n"
        )
        out.write(stmt)
        total_ctr += 1

    print(f"  contracts:    {total_ctr} filas")

    # ── 4. RESOLVER parent_contract_id ──────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 4. RESOLVER parent_contract_id (contratos derivados)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    has_parent = df_ctr[
        df_ctr["parent_contract_ref"].notna() &
        (df_ctr["parent_contract_ref"].str.strip() != "") &
        (df_ctr["parent_contract_ref"].str.strip() != "nan")
    ]

    for _, r in has_parent.iterrows():
        child_id  = str(r["id"]).strip()
        parent_ref = str(r["parent_contract_ref"]).strip()
        out.write(
            f"UPDATE contracts\n"
            f"SET    parent_contract_id = (\n"
            f"         SELECT id FROM contracts\n"
            f"         WHERE  contract_number = {q(parent_ref)}\n"
            f"         AND    contract_type = 'INTERADMINISTRATIVO'\n"
            f"         LIMIT  1\n"
            f"       )\n"
            f"WHERE  id = {q(child_id)};\n\n"
        )

    print(f"  parent refs:  {len(has_parent)} UPDATEs")

    # ── 5. INTERADMIN DETAILS ────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 5. INTERADMIN CONTRACT DETAILS\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_id", "secretaria",
        "admin_fee_initial", "admin_fee_additions",
        "mandate_pool_initial", "mandate_pool_additions",
        "pending_collection",
    ]
    rows = []
    for _, r in df_iad.iterrows():
        rows.append([
            q(r["id"]), q(r["contract_id"]), q(r["secretaria"]),
            numeric_q(r.get("admin_fee_initial", "0")),
            numeric_q(r.get("admin_fee_additions", "0")),
            numeric_q(r.get("mandate_pool_initial", "0")),
            numeric_q(r.get("mandate_pool_additions", "0")),
            numeric_q(r.get("pending_collection", "0")),
        ])

    n = write_insert(out, "interadmin_contract_details", cols, rows,
                     "ON CONFLICT (contract_id) DO NOTHING")
    print(f"  interadmin:   {n} filas")

    # ── 6. INVOICE PAYMENT DETAILS ───────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 6. INVOICE PAYMENT DETAILS (Pago contra Factura)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = ["id", "contract_id", "committee_number", "committee_act_info",
            "invoice_date", "requesting_officer"]
    rows = []
    for _, r in df_ipd.iterrows():
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            q(r.get("committee_number")),
            q(r.get("committee_act_info")),
            q(r.get("invoice_date")),
            q(r.get("requesting_officer")),
        ])

    n = write_insert(out, "invoice_payment_details", cols, rows,
                     "ON CONFLICT (contract_id) DO NOTHING")
    print(f"  invoice_det:  {n} filas")

    # ── 7. COMPROMISOS PRESUPUESTALES (CDP/CRP) ──────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 7. BUDGET COMMITMENTS (CDP / CRP)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = ["id", "contract_id", "commitment_type", "number",
            "value", "budget_code", "date", "is_addition"]
    contract_dates = {
        str(r["id"]).strip(): {
            "subscription_date": r.get("subscription_date"),
            "start_date": r.get("start_date"),
            "year": r.get("year"),
        }
        for _, r in df_ctr.iterrows()
    }
    rows = []
    for _, r in df_bc.iterrows():
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            q(r["commitment_type"]) + "::commitment_type_enum",
            q(r["number"]),
            numeric_q(r.get("value", "0")),
            q(r.get("budget_code")),
            budget_commitment_date_q(r, contract_dates),
            "FALSE",
        ])

    n = write_insert(out, "budget_commitments", cols, rows,
                     "ON CONFLICT (contract_id, commitment_type, number) DO NOTHING")
    print(f"  budget_comm:  {n} filas")

    # ── 8. ADICIONES ─────────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 8. CONTRACT AMENDMENTS (Adiciones)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_id", "amendment_number", "modification_type",
        "amendment_value", "amendment_date",
        "cdp_number", "cdp_value", "cdp_date", "cdp_budget_code",
        "crp_number", "crp_value", "crp_date", "crp_budget_code",
    ]
    rows = []
    for _, r in df_amd.iterrows():
        amp_num = r.get("amendment_number", "1")
        try:
            amp_num_q = str(int(float(str(amp_num)))) if str(amp_num) not in ("nan","","None") else "1"
        except:
            amp_num_q = "1"
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            amp_num_q,
            q(str(r.get("modification_type","ADICION")).strip() or "ADICION"),
            numeric_q(r.get("amendment_value", "0")),
            q(r.get("amendment_date")),
            q(r.get("cdp_number")),
            numeric_q(r.get("cdp_value")),
            q(r.get("cdp_date")),
            q(r.get("cdp_budget_code")),
            q(r.get("crp_number")),
            numeric_q(r.get("crp_value")),
            q(r.get("crp_date")),
            q(r.get("crp_budget_code")),
        ])

    n = write_insert(out, "contract_amendments", cols, rows,
                     "ON CONFLICT (contract_id, amendment_number) DO NOTHING")
    print(f"  amendments:   {n} filas")

    # ── 9. PRÓRROGAS ─────────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 9. CONTRACT EXTENSIONS (Prórrogas)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_id", "extension_number",
        "extension_term_text", "extension_term_days",
        "extension_date", "new_end_date",
    ]
    rows = []
    for _, r in df_ext.iterrows():
        ext_num = r.get("extension_number", "1")
        try:
            ext_num_q = str(int(float(str(ext_num)))) if str(ext_num) not in ("nan","","None") else "1"
        except:
            ext_num_q = "1"
        ext_days = r.get("extension_term_days")
        try:
            ext_days_q = str(int(float(str(ext_days)))) if str(ext_days) not in ("nan","","None") else "NULL"
        except:
            ext_days_q = "NULL"
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            ext_num_q,
            q(r.get("extension_term_text")),
            ext_days_q,
            q(r.get("extension_date")),
            q(r.get("new_end_date")),
        ])

    n = write_insert(out, "contract_extensions", cols, rows,
                     "ON CONFLICT (contract_id, extension_number) DO NOTHING")
    print(f"  extensions:   {n} filas")

    # ── 10. PÓLIZAS ──────────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 10. CONTRACT POLICIES (Pólizas)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_id", "policy_number", "issuing_entity",
        "issue_date", "start_date", "end_date", "approval_date",
    ]
    rows = []
    for _, r in df_pol.iterrows():
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            q(r.get("policy_number")),
            q(r.get("issuing_entity")),
            q(r.get("issue_date")),
            q(r.get("start_date")),
            q(r.get("end_date")),
            q(r.get("approval_date")),
        ])

    n = write_insert(out, "contract_policies", cols, rows,
                     "ON CONFLICT (contract_id) DO NOTHING")
    print(f"  policies:     {n} filas")

    # ── 11. MIPYMES ──────────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 11. MIPYMES STATS\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_id",
        "providers_consulted", "mipymes_consulted",
        "providers_presented", "mipymes_presented", "mipymes_benefited",
        "mipymes_participated", "limited_to_mipymes", "awarded_to_mipymes",
    ]
    rows = []
    for _, r in df_mip.iterrows():
        def small_int(v):
            try:
                return str(int(float(str(v)))) if str(v) not in ("nan","","None") else "NULL"
            except:
                return "NULL"
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            small_int(r.get("providers_consulted")),
            small_int(r.get("mipymes_consulted")),
            small_int(r.get("providers_presented")),
            small_int(r.get("mipymes_presented")),
            small_int(r.get("mipymes_benefited")),
            bool_q(r.get("mipymes_participated")),
            bool_q(r.get("limited_to_mipymes")),
            bool_q(r.get("awarded_to_mipymes")),
        ])

    n = write_insert(out, "mipymes_stats", cols, rows,
                     "ON CONFLICT (contract_id) DO NOTHING")
    print(f"  mipymes:      {n} filas")

    # ── 12. PAGOS ────────────────────────────────────────────────

    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    out.write("-- 12. PAYMENTS (Pagos individuales)\n")
    out.write("-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

    cols = [
        "id", "contract_id", "payment_number", "payment_date",
        "gross_value", "deductions", "cumulative_percentage", "drive_url",
    ]
    rows = []
    for _, r in df_pay.iterrows():
        pay_num = r.get("payment_number", "0")
        try:
            pay_num_q = str(int(float(str(pay_num)))) if str(pay_num) not in ("nan","","None") else "0"
        except:
            pay_num_q = "0"
        rows.append([
            q(r["id"]), q(r["contract_id"]),
            pay_num_q,
            q(r.get("payment_date")),
            numeric_q(r.get("gross_value", "0")),
            numeric_q(r.get("deductions", "0")),
            numeric_q(r.get("cumulative_percentage")),
            q(r.get("drive_url")),
        ])

    n = write_insert(out, "payments", cols, rows,
                     "ON CONFLICT (contract_id, payment_number) DO NOTHING")
    print(f"  payments:     {n} filas")

    # ── 13. REHABILITAR TRIGGERS Y RECALCULAR ────────────────────

    out.write("""-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 13. REHABILITAR TRIGGERS Y RECALCULAR TOTALES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SET session_replication_role = 'origin'; -- Rehabilitar triggers

-- Recalcular paid_value desde payments (trigger ya sincroniza en adelante,
-- pero los datos migrados los cargamos con session_replication_role = replica).
UPDATE contracts c
SET paid_value = COALESCE((
  SELECT SUM(gross_value - deductions)
  FROM   payments
  WHERE  contract_id = c.id
), 0)
WHERE EXISTS (SELECT 1 FROM payments WHERE contract_id = c.id);

-- Recalcular total_additions_value desde contract_amendments.
UPDATE contracts c
SET total_additions_value = COALESCE((
  SELECT SUM(amendment_value)
  FROM   contract_amendments
  WHERE  contract_id = c.id
), 0)
WHERE EXISTS (SELECT 1 FROM contract_amendments WHERE contract_id = c.id);

-- Actualizar end_date de contratos con prórroga que tenga new_end_date.
UPDATE contracts c
SET end_date = sub.new_end_date
FROM (
  SELECT DISTINCT ON (contract_id)
    contract_id,
    new_end_date
  FROM   contract_extensions
  WHERE  new_end_date IS NOT NULL
  ORDER  BY contract_id, extension_number DESC
) sub
WHERE c.id = sub.contract_id;

""")

    # ── 14. VALIDACIÓN ───────────────────────────────────────────

    out.write("""-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 14. VALIDACIÓN — ejecutar para verificar la importación
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 'supervisors'             AS tabla, COUNT(*) AS total FROM supervisors
UNION ALL
SELECT 'contractors',                      COUNT(*) FROM contractors
UNION ALL
SELECT 'contracts',                        COUNT(*) FROM contracts
UNION ALL
SELECT 'contracts DIRECTO',                COUNT(*) FROM contracts WHERE contract_type = 'DIRECTO'
UNION ALL
SELECT 'contracts INTERADMIN',             COUNT(*) FROM contracts WHERE contract_type = 'INTERADMINISTRATIVO'
UNION ALL
SELECT 'contracts TIENDA_VIRTUAL',         COUNT(*) FROM contracts WHERE contract_type = 'TIENDA_VIRTUAL'
UNION ALL
SELECT 'contracts PAGO_FACTURA',           COUNT(*) FROM contracts WHERE contract_type = 'PAGO_FACTURA'
UNION ALL
SELECT 'contracts con padre',              COUNT(*) FROM contracts WHERE parent_contract_id IS NOT NULL
UNION ALL
SELECT 'interadmin_details',               COUNT(*) FROM interadmin_contract_details
UNION ALL
SELECT 'invoice_payment_details',          COUNT(*) FROM invoice_payment_details
UNION ALL
SELECT 'budget_commitments',               COUNT(*) FROM budget_commitments
UNION ALL
SELECT 'contract_amendments',              COUNT(*) FROM contract_amendments
UNION ALL
SELECT 'contract_extensions',              COUNT(*) FROM contract_extensions
UNION ALL
SELECT 'contract_policies',               COUNT(*) FROM contract_policies
UNION ALL
SELECT 'mipymes_stats',                    COUNT(*) FROM mipymes_stats
UNION ALL
SELECT 'payments',                         COUNT(*) FROM payments
ORDER BY tabla;

-- Valores esperados:
--   supervisors             59
--   contractors            485
--   contracts              793
--   contracts DIRECTO      617
--   contracts INTERADMIN    65
--   contracts TIENDA_VIRTUAL 35
--   contracts PAGO_FACTURA  76
--   contracts con padre    171
--   interadmin_details      65
--   invoice_payment_details 76
--   budget_commitments    1215
--   contract_amendments    158
--   contract_extensions    224
--   contract_policies       75
--   mipymes_stats          100
--   payments              1149

-- Verificar KPIs del dashboard
SELECT * FROM v_dashboard_kpis;

-- Verificar que las áreas se resolvieron
SELECT COUNT(*) AS contratos_sin_area
FROM contracts
WHERE responsible_area_id IS NULL;

-- Contratos activos con días restantes
SELECT contract_number, year, status, end_date, days_remaining, alert_level
FROM v_contract_alerts
ORDER BY days_remaining
LIMIT 20;

COMMIT;
""")

    out.write("-- ============================================================\n")
    out.write("-- FIN DEL SCRIPT DE IMPORTACIÓN\n")
    out.write("-- ============================================================\n")

# ── Tamaño del archivo generado ─────────────────────────────────────

size_kb = OUT_FILE.stat().st_size / 1024
size_mb = size_kb / 1024

print(f"\n✅ Script generado: {OUT_FILE}")
print(f"   Tamaño: {size_kb:.0f} KB ({size_mb:.2f} MB)")

if size_mb > 2:
    print(f"\n⚠️  El archivo supera 2 MB.")
    print("   El SQL Editor de Supabase tiene límite de ~2 MB por request.")
    print("   Usa el script EPUXUA_IMPORT_SPLIT.py para dividirlo en partes.")
else:
    print(f"\n✅ Tamaño dentro del límite del SQL Editor de Supabase (< 2 MB).")

print("\nPASOS PARA EJECUTAR:")
print("1. Abre Supabase → SQL Editor")
print("2. Pega el contenido de clean_data/EPUXUA_IMPORT.sql")
print("3. Ejecuta — toma ~30 segundos para 4,000+ registros")
print("4. Verifica con las queries de validación al final del script")
