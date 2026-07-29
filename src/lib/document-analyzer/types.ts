// ─── Core field type ─────────────────────────────────────────────────────────
// confidence: 0.0 = no encontrado / 1.0 = certeza absoluta
export interface ExtractionField<T = unknown> {
  value: T | null
  confidence: number  // 0.0 – 1.0
}

// ─── Document types ───────────────────────────────────────────────────────────
export type DocumentType =
  | "adicion"
  | "prorroga"
  | "suspension"
  | "reinicio"
  | "aclaratorio"
  | "contrato"
  | "acta"
  | "rp"
  | "cdp"
  | "factura"

// ─── Per-document extraction shapes ─────────────────────────────────────────
export interface AdicionExtraction {
  fecha_adicion:          ExtractionField<string>   // ISO YYYY-MM-DD
  valor_total:            ExtractionField<number>   // COP integer
  valor_bienes_servicios: ExtractionField<number>   // COP integer
  valor_cuota_gerencia:   ExtractionField<number>   // COP integer
  numero_rp:              ExtractionField<string>
  motivo:                 ExtractionField<string>
  tipo_documento:         ExtractionField<string>   // metadata — no es un campo del formulario
}

// ─── UI schema (client-safe — nunca contiene systemPrompts ni secretos) ───────
export type FieldType = "date" | "currency" | "text" | "identifier"

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  icon: string        // emoji
}

export interface DocumentAnalyzerSchema {
  displayName: string
  fields: FieldDefinition[]
}

// ─── Análisis result ─────────────────────────────────────────────────────────
export interface ValidationWarning {
  type: string
  message: string
  severity: "info" | "warning" | "error"
}

export interface DocumentReadResult {
  rawText: string
  fileType: "pdf" | "docx" | "image" | "unknown"
  pageCount: number
}

export interface CleanResult {
  text: string
  charCount: number
}

export interface AnalysisMetadata {
  pagesProcessed: number
  analysisTimeMs: number
  modelUsed: string
  fileType: string
  cleanedChars: number
  fieldsFound: number
}

export interface DocumentAnalysisResult {
  documentType: DocumentType
  extraction: Record<string, ExtractionField>
  metadata: AnalysisMetadata
  warnings: ValidationWarning[]
}

export interface DocumentAnalysisError {
  error: string
  code?: "UNSUPPORTED_FORMAT" | "EXTRACTION_FAILED" | "ANALYSIS_FAILED" | "NO_API_KEY" | "EMPTY_DOCUMENT" | "FILE_TOO_LARGE"
}

// ─── Unified modifications analysis ──────────────────────────────────────────
export type ModificationDocType = "ADICION" | "PRORROGA" | "SUSPENSION" | "REINICIO" | "ACLARATORIO"

export interface AdicionFields {
  fecha_adicion:          ExtractionField<string>
  valor_total:            ExtractionField<number>
  valor_bienes_servicios: ExtractionField<number>
  valor_cuota_gerencia:   ExtractionField<number>
  numero_rp:              ExtractionField<string>
  motivo:                 ExtractionField<string>
}

export interface ProrrogaFields {
  fecha_suscripcion:       ExtractionField<string>
  nueva_fecha_terminacion: ExtractionField<string>
  plazo_prorroga:          ExtractionField<string>
  justificacion:           ExtractionField<string>
}

export interface SuspensionFields {
  fecha_suscripcion: ExtractionField<string>
  inicio_suspension: ExtractionField<string>
  fin_suspension:    ExtractionField<string>
  plazo_suspension:  ExtractionField<string>
  motivo:            ExtractionField<string>
}

export interface ReinicioFields {
  fecha_reinicio:    ExtractionField<string>
  fecha_suscripcion: ExtractionField<string>
  motivo:            ExtractionField<string>
  observaciones:     ExtractionField<string>
}

export interface AclaratorioFields {
  fecha_suscripcion: ExtractionField<string>
  motivo:            ExtractionField<string>
  descripcion:       ExtractionField<string>
}

export interface UnifiedModificationResult {
  detected_types: ModificationDocType[]
  adicion:        AdicionFields | null
  prorroga:       ProrrogaFields | null
  suspension:     SuspensionFields | null
  reinicio:       ReinicioFields | null
  aclaratorio:    AclaratorioFields | null
}

export interface UnifiedAnalysisResponse {
  result:   UnifiedModificationResult
  metadata: AnalysisMetadata
}
