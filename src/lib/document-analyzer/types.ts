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
