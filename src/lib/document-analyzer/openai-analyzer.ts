const DEFAULT_MODEL = "gpt-4o-mini"

export interface AnalyzerOutput {
  extraction: Record<string, unknown>
  modelUsed: string
}

export async function analyzeWithOpenAI(
  systemPrompt: string,
  cleanedText: string,
  maxTokens = 1400,
): Promise<AnalyzerOutput> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error("OPENAI_API_KEY no está configurada. Contacta al administrador del sistema.")
  }

  const model = process.env.OPENAI_ANALYSIS_MODEL ?? DEFAULT_MODEL

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analiza el siguiente documento contractual y extrae la información.\n\nCONTENIDO DEL DOCUMENTO:\n\n${cleanedText}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401) throw new Error("La clave de OpenAI no es válida. Contacta al administrador.")
    if (status === 429) throw new Error("Límite de solicitudes a OpenAI alcanzado. Intenta en unos minutos.")
    if (status >= 500) throw new Error("Servicio de OpenAI temporalmente no disponible. Intenta más tarde.")
    throw new Error(`Error al contactar OpenAI (código ${status}).`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    model?: string
  }

  const rawContent = data.choices?.[0]?.message?.content
  if (!rawContent) throw new Error("OpenAI no devolvió contenido. Intenta de nuevo.")

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    throw new Error("La respuesta de OpenAI no es JSON válido. Intenta de nuevo.")
  }

  return { extraction: parsed, modelUsed: data.model ?? model }
}
