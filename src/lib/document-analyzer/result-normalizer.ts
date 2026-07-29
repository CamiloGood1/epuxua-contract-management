import type {
  AdicionExtraction, ExtractionField,
  AdicionFields, ProrrogaFields, SuspensionFields, ReinicioFields, AclaratorioFields,
  UnifiedModificationResult, ModificationDocType,
} from "./types"

function normalizeField<T>(raw: unknown, valueType: "string" | "number"): ExtractionField<T> {
  const empty: ExtractionField<T> = { value: null, confidence: 0 }
  if (!raw || typeof raw !== "object") return empty

  const obj = raw as Record<string, unknown>

  // Accept numeric 0-1 (ideal), numeric 0-100 (normalize), or legacy strings
  let confidence = 0
  const rawConf = obj.confidence
  if (typeof rawConf === "number") {
    confidence = rawConf > 1 ? rawConf / 100 : rawConf
    confidence = Math.max(0, Math.min(1, confidence))
  } else if (rawConf === "high") confidence = 0.9
  else if (rawConf === "medium") confidence = 0.7
  else if (rawConf === "low") confidence = 0.3

  let value: T | null = null
  if (obj.value != null && confidence >= 0.3) {
    if (valueType === "number") {
      const n = Number(obj.value)
      value = !isNaN(n) && n > 0 ? (n as T) : null
    } else {
      const s = String(obj.value).trim()
      value = s.length > 0 ? (s as T) : null
    }
  }

  // A null value means nothing was found; force confidence to 0
  if (value === null) confidence = 0

  return { value, confidence }
}

export function normalizeAdicionExtraction(raw: Record<string, unknown>): AdicionExtraction {
  return {
    fecha_adicion:          normalizeField<string>(raw.fecha_adicion, "string"),
    valor_total:            normalizeField<number>(raw.valor_total, "number"),
    valor_bienes_servicios: normalizeField<number>(raw.valor_bienes_servicios, "number"),
    valor_cuota_gerencia:   normalizeField<number>(raw.valor_cuota_gerencia, "number"),
    numero_rp:              normalizeField<string>(raw.numero_rp, "string"),
    motivo:                 normalizeField<string>(raw.motivo, "string"),
    tipo_documento:         normalizeField<string>(raw.tipo_documento, "string"),
  }
}

export function countFoundFields(extraction: Record<string, ExtractionField>): number {
  return Object.values(extraction).filter((f) => f.value !== null && f.confidence >= 0.5).length
}

// ─── Per-type normalizers ─────────────────────────────────────────────────────

export function normalizeProrrogaFields(raw: Record<string, unknown>): ProrrogaFields {
  return {
    fecha_suscripcion:       normalizeField<string>(raw.fecha_suscripcion,       "string"),
    nueva_fecha_terminacion: normalizeField<string>(raw.nueva_fecha_terminacion, "string"),
    plazo_prorroga:          normalizeField<string>(raw.plazo_prorroga,          "string"),
    justificacion:           normalizeField<string>(raw.justificacion,           "string"),
  }
}

export function normalizeSuspensionFields(raw: Record<string, unknown>): SuspensionFields {
  return {
    fecha_suscripcion: normalizeField<string>(raw.fecha_suscripcion, "string"),
    inicio_suspension: normalizeField<string>(raw.inicio_suspension, "string"),
    fin_suspension:    normalizeField<string>(raw.fin_suspension,    "string"),
    plazo_suspension:  normalizeField<string>(raw.plazo_suspension,  "string"),
    motivo:            normalizeField<string>(raw.motivo,            "string"),
  }
}

export function normalizeReinicioFields(raw: Record<string, unknown>): ReinicioFields {
  return {
    fecha_reinicio:    normalizeField<string>(raw.fecha_reinicio,    "string"),
    fecha_suscripcion: normalizeField<string>(raw.fecha_suscripcion, "string"),
    motivo:            normalizeField<string>(raw.motivo,            "string"),
    observaciones:     normalizeField<string>(raw.observaciones,     "string"),
  }
}

export function normalizeAclaratorioFields(raw: Record<string, unknown>): AclaratorioFields {
  return {
    fecha_suscripcion: normalizeField<string>(raw.fecha_suscripcion, "string"),
    motivo:            normalizeField<string>(raw.motivo,            "string"),
    descripcion:       normalizeField<string>(raw.descripcion,       "string"),
  }
}

function normalizeAdicionFields(raw: Record<string, unknown>): AdicionFields {
  return {
    fecha_adicion:          normalizeField<string>(raw.fecha_adicion,          "string"),
    valor_total:            normalizeField<number>(raw.valor_total,            "number"),
    valor_bienes_servicios: normalizeField<number>(raw.valor_bienes_servicios, "number"),
    valor_cuota_gerencia:   normalizeField<number>(raw.valor_cuota_gerencia,   "number"),
    numero_rp:              normalizeField<string>(raw.numero_rp,              "string"),
    motivo:                 normalizeField<string>(raw.motivo,                 "string"),
  }
}

export function normalizeUnifiedResult(raw: Record<string, unknown>): UnifiedModificationResult {
  const rawTypes = Array.isArray(raw.detected_types) ? (raw.detected_types as string[]) : []
  const detected_types = rawTypes.filter((t): t is ModificationDocType =>
    ["ADICION", "PRORROGA", "SUSPENSION", "REINICIO", "ACLARATORIO"].includes(t)
  )

  return {
    detected_types,
    adicion:     raw.adicion    && typeof raw.adicion    === "object" ? normalizeAdicionFields(raw.adicion       as Record<string, unknown>) : null,
    prorroga:    raw.prorroga   && typeof raw.prorroga   === "object" ? normalizeProrrogaFields(raw.prorroga     as Record<string, unknown>) : null,
    suspension:  raw.suspension && typeof raw.suspension === "object" ? normalizeSuspensionFields(raw.suspension  as Record<string, unknown>) : null,
    reinicio:    raw.reinicio   && typeof raw.reinicio   === "object" ? normalizeReinicioFields(raw.reinicio     as Record<string, unknown>) : null,
    aclaratorio: raw.aclaratorio && typeof raw.aclaratorio === "object" ? normalizeAclaratorioFields(raw.aclaratorio as Record<string, unknown>) : null,
  }
}
