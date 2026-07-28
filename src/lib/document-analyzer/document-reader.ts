// pdf-parse v2.x — clase PDFParse (API completamente diferente a v1.x)
import type { DocumentReadResult } from "./types"

const MAX_PAGES = 40
const MAX_FILE_BYTES = 10 * 1024 * 1024  // 10 MB

export async function readDocument(file: File): Promise<DocumentReadResult> {
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    throw new Error(`Archivo demasiado grande (${mb} MB). Máximo permitido: 10 MB.`)
  }

  const name = file.name.toLowerCase()

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return readPDF(file)
  }

  if (name.endsWith(".docx")) {
    throw new Error(
      "El formato Word (.docx) estará soportado próximamente. Por ahora, convierte el documento a PDF.",
    )
  }

  if (/\.(jpg|jpeg|png|webp|tiff?)$/.test(name)) {
    throw new Error(
      "El análisis de imágenes escaneadas estará disponible próximamente. Por ahora, usa un PDF con texto seleccionable.",
    )
  }

  throw new Error(
    `Formato no soportado: "${file.name}". Sube un archivo PDF (.pdf) con texto seleccionable.`,
  )
}

async function readPDF(file: File): Promise<DocumentReadResult> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // pdf-parse v2.x: exporta una clase PDFParse, NO una función.
  // API: new PDFParse({ data: buffer }).getText({ first: N })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await import("pdf-parse")) as any
  const PDFParse = (mod.PDFParse ?? mod.default?.PDFParse) as (new (opts: { data: Buffer }) => {
    getText(params?: { first?: number; partial?: number[] }): Promise<{
      text: string
      pages: Array<{ num: number; text: string }>
      total: number
    }>
  }) | undefined

  if (!PDFParse || typeof PDFParse !== "function") {
    throw new Error(
      "No se pudo inicializar el lector de PDF. Contacta al administrador del sistema.",
    )
  }

  const parser = new PDFParse({ data: buffer })

  let result: { text: string; pages: Array<{ num: number; text: string }>; total: number }
  try {
    result = await parser.getText({ first: MAX_PAGES })
  } catch (e) {
    console.error("[document-reader] ERROR en pdf-parse.getText():", e)
    const realMessage = e instanceof Error ? e.message : String(e)
    throw new Error(
      `No se pudo leer el PDF (${realMessage}). Verifica que el archivo no esté dañado ni protegido con contraseña.`,
    )
  }

  const rawText = result.text?.trim() ?? ""
  const pageCount = result.pages?.length ?? result.total ?? 1

  // Un PDF escaneado produce texto vacío o casi vacío
  if (rawText.length < 80) {
    throw new Error(
      "El PDF no contiene texto extraíble. Es posible que sea un documento escaneado. " +
        "Usa un PDF digital con texto seleccionable.",
    )
  }

  return { rawText, fileType: "pdf", pageCount }
}
