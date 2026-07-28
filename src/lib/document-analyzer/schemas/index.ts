// Registry centralizado: agrega un entry aquí para habilitar un nuevo tipo documental.
// El motor (openai-analyzer, route) es completamente tipo-agnóstico gracias a este registry.
import type { DocumentType, ExtractionField, ValidationWarning } from "../types"
import { ADICION_SYSTEM_PROMPT } from "./adicion"
import { normalizeAdicionExtraction } from "../result-normalizer"
import { validateAdicionExtraction } from "../result-validator"
import type { AdicionExtraction } from "../types"

type NormalizeFn = (raw: Record<string, unknown>) => Record<string, ExtractionField>
type ValidateFn = (ext: Record<string, ExtractionField>) => ValidationWarning[]

export interface SchemaEntry {
  systemPrompt: string
  normalize: NormalizeFn
  validate: ValidateFn
}

const REGISTRY: Partial<Record<DocumentType, SchemaEntry>> = {
  adicion: {
    systemPrompt: ADICION_SYSTEM_PROMPT,
    normalize: (raw) => normalizeAdicionExtraction(raw) as unknown as Record<string, ExtractionField>,
    validate: (ext) => validateAdicionExtraction(ext as unknown as AdicionExtraction),
  },
  // Para agregar Prórroga:
  // prorroga: {
  //   systemPrompt: PRORROGA_SYSTEM_PROMPT,
  //   normalize: (raw) => normalizeProrrogaExtraction(raw) as unknown as Record<string, ExtractionField>,
  //   validate: (ext) => validateProrrogaExtraction(ext as unknown as ProrrogaExtraction),
  // },
}

export function getSchemaEntry(documentType: DocumentType): SchemaEntry {
  const entry = REGISTRY[documentType]
  if (!entry) {
    throw new Error(
      `Tipo "${documentType}" no tiene esquema registrado. ` +
        `Tipos disponibles: ${Object.keys(REGISTRY).join(", ")}`,
    )
  }
  return entry
}

export function isSupportedType(documentType: string): documentType is DocumentType {
  return documentType in REGISTRY
}
