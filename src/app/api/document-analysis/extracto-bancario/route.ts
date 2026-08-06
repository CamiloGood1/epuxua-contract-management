import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { checkAndLogAiUsage } from "@/lib/ai-rate-limiter"
import { readDocument } from "@/lib/document-analyzer/document-reader"
import { cleanDocumentText } from "@/lib/document-analyzer/content-cleaner"
import { analyzeWithOpenAI } from "@/lib/document-analyzer/openai-analyzer"
import { EXTRACTO_BANCARIO_SYSTEM_PROMPT } from "@/lib/document-analyzer/schemas/extracto-bancario"

export async function POST(req: NextRequest) {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const rateLimit = await checkAndLogAiUsage(profile.id, profile.email, "extracto-bancario")
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error, code: "RATE_LIMIT" }, { status: 429 })
  }

  try {
    const form = await req.formData()
    const file = form.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió archivo PDF." }, { status: 400 })
    }

    const { rawText } = await readDocument(file)
    const { text } = cleanDocumentText(rawText)

    const { extraction, modelUsed } = await analyzeWithOpenAI(
      EXTRACTO_BANCARIO_SYSTEM_PROMPT,
      text,
      600,
    )

    return NextResponse.json({ extraction, modelUsed })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido al analizar el extracto."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
