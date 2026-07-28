import type { AdicionExtraction, ExtractionField } from "./types"

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
