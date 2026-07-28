import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { readDocument } from "@/lib/document-analyzer/document-reader"
import { cleanDocumentText } from "@/lib/document-analyzer/content-cleaner"
import { analyzeWithOpenAI } from "@/lib/document-analyzer/openai-analyzer"
import { countFoundFields } from "@/lib/document-analyzer/result-normalizer"
import { getSchemaEntry, isSupportedType } from "@/lib/document-analyzer/schemas/index"

// Allow up to 30s for PDF read + OpenAI round-trip
export const maxDuration = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentType: string }> },
) {
  const { documentType } = await params

  // ── Auth ─────────────────────────────────────────────────────────────────
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // ── Validate document type ───────────────────────────────────────────────
  if (!isSupportedType(documentType)) {
    return NextResponse.json(
      { error: `Tipo "${documentType}" no soportado.`, code: "UNSUPPORTED_FORMAT" },
      { status: 400 },
    )
  }

  // ── Read file from FormData (never persisted) ────────────────────────────
  let file: File
  try {
    const formData = await req.formData()
    const maybeFile = formData.get("file")
    if (!maybeFile || !(maybeFile instanceof File)) {
      return NextResponse.json(
        { error: 'Campo "file" requerido (multipart/form-data).', code: "UNSUPPORTED_FORMAT" },
        { status: 400 },
      )
    }
    file = maybeFile
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el cuerpo de la solicitud.", code: "UNSUPPORTED_FORMAT" },
      { status: 400 },
    )
  }

  const schema = getSchemaEntry(documentType)
  const startTime = Date.now()

  // ── Step 1: Read document ────────────────────────────────────────────────
  let readResult
  try {
    readResult = await readDocument(file)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error leyendo el documento.", code: "EXTRACTION_FAILED" },
      { status: 422 },
    )
  }

  // ── Step 2: Clean text ───────────────────────────────────────────────────
  const cleaned = cleanDocumentText(readResult.rawText)

  // ── Step 3: Analyze with OpenAI ──────────────────────────────────────────
  let analyzerOutput
  try {
    analyzerOutput = await analyzeWithOpenAI(schema.systemPrompt, cleaned.text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en el análisis con IA."
    const code = msg.includes("OPENAI_API_KEY") ? "NO_API_KEY" : "ANALYSIS_FAILED"
    return NextResponse.json({ error: msg, code }, { status: code === "NO_API_KEY" ? 503 : 502 })
  }

  // ── Step 4: Normalize ────────────────────────────────────────────────────
  const extraction = schema.normalize(analyzerOutput.extraction)

  // ── Step 5: Validate ─────────────────────────────────────────────────────
  const warnings = schema.validate(extraction)

  const fieldsFound = countFoundFields(extraction)

  return NextResponse.json({
    documentType,
    extraction,
    warnings,
    metadata: {
      pagesProcessed: readResult.pageCount,
      analysisTimeMs: Date.now() - startTime,
      modelUsed: analyzerOutput.modelUsed,
      fileType: readResult.fileType,
      cleanedChars: cleaned.charCount,
      fieldsFound,
    },
  })
}
