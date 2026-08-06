import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { checkAndLogAiUsage } from "@/lib/ai-rate-limiter"
import { readDocument } from "@/lib/document-analyzer/document-reader"
import { cleanDocumentText } from "@/lib/document-analyzer/content-cleaner"
import { analyzeWithOpenAI } from "@/lib/document-analyzer/openai-analyzer"
import { normalizeUnifiedResult } from "@/lib/document-analyzer/result-normalizer"
import { UNIFIED_MODIFICATIONS_PROMPT } from "@/lib/document-analyzer/schemas/unified-modifications"

// 45s: requerido por Vercel Pro/Enterprise (Hobby limita a 10s). Reducir si se migra a streaming.
export const maxDuration = 45

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rateLimit = await checkAndLogAiUsage(profile.id, profile.email, "unified")
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error, code: "RATE_LIMIT" }, { status: 429 })
  }

  // ── File ─────────────────────────────────────────────────────────────────
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

  const startTime = Date.now()

  // ── Step 1: Read ──────────────────────────────────────────────────────────
  let readResult
  try {
    readResult = await readDocument(file)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error leyendo el documento.", code: "EXTRACTION_FAILED" },
      { status: 422 },
    )
  }

  // ── Step 2: Clean ─────────────────────────────────────────────────────────
  const cleaned = cleanDocumentText(readResult.rawText)

  // ── Step 3: Analyze (single OpenAI call) ─────────────────────────────────
  let analyzerOutput
  try {
    analyzerOutput = await analyzeWithOpenAI(UNIFIED_MODIFICATIONS_PROMPT, cleaned.text, 2000)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en el análisis con IA."
    const code = msg.includes("OPENAI_API_KEY") ? "NO_API_KEY" : "ANALYSIS_FAILED"
    return NextResponse.json({ error: msg, code }, { status: code === "NO_API_KEY" ? 503 : 502 })
  }

  // ── Step 4: Normalize ─────────────────────────────────────────────────────
  const result = normalizeUnifiedResult(analyzerOutput.extraction)

  return NextResponse.json({
    result,
    metadata: {
      pagesProcessed: readResult.pageCount,
      analysisTimeMs: Date.now() - startTime,
      modelUsed: analyzerOutput.modelUsed,
      fileType: readResult.fileType,
      cleanedChars: cleaned.charCount,
      detected_types: result.detected_types,
    },
  })
}
