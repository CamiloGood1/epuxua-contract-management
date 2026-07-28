"use client"

import { useRef, useState, useEffect } from "react"
import { FileText, Sparkles, CheckCircle, AlertCircle, X } from "lucide-react"
import { ExtractionReviewModal } from "./ExtractionReviewModal"
import type {
  DocumentType,
  DocumentAnalyzerSchema,
  ExtractionField,
  ValidationWarning,
  AnalysisMetadata,
} from "@/lib/document-analyzer/types"

interface DocumentAnalyzerButtonProps {
  documentType: DocumentType
  schema: DocumentAnalyzerSchema
  onComplete: (extraction: Record<string, ExtractionField>) => void
  disabled?: boolean
}

// ── State machine ─────────────────────────────────────────────────────────────
type AnalyzerState =
  | { status: "idle" }
  | { status: "analyzing"; stepIndex: number }
  | {
      status: "reviewing"
      extraction: Record<string, ExtractionField>
      warnings: ValidationWarning[]
      metadata: AnalysisMetadata
    }
  | { status: "done"; fieldsApplied: number; tipoDocumento: string | null }
  | { status: "error"; message: string }

const STEPS = [
  "1️⃣ Cargando documento…",
  "2️⃣ Leyendo contenido…",
  "3️⃣ Analizando con IA…",
  "4️⃣ Validando información…",
  "5️⃣ Preparando formulario…",
]

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentAnalyzerButton({
  documentType,
  schema,
  onComplete,
  disabled,
}: DocumentAnalyzerButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<AnalyzerState>({ status: "idle" })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state.status === "analyzing") {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.status !== "analyzing") return prev
          return { ...prev, stepIndex: Math.min(prev.stepIndex + 1, STEPS.length - 1) }
        })
      }, 1400)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.status])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ""

    setState({ status: "analyzing", stepIndex: 0 })

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/document-analysis/${documentType}`, {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Error al analizar el documento." })
        return
      }

      setState({
        status: "reviewing",
        extraction: json.extraction as Record<string, ExtractionField>,
        warnings: (json.warnings ?? []) as ValidationWarning[],
        metadata: json.metadata as AnalysisMetadata,
      })
    } catch {
      setState({
        status: "error",
        message: "No se pudo conectar con el servidor de análisis. Verifica tu conexión.",
      })
    }
  }

  function handleConfirm() {
    if (state.status !== "reviewing") return
    const { extraction, metadata } = state

    const tipoDocumento =
      (extraction["tipo_documento"]?.value as string | null | undefined) ?? null

    onComplete(extraction)

    setState({
      status: "done",
      fieldsApplied: metadata.fieldsFound,
      tipoDocumento,
    })
  }

  function handleCancel() {
    setState({ status: "idle" })
  }

  return (
    <div className="mb-1">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || state.status === "analyzing"}
        aria-hidden
      />

      {/* ── Idle ─────────────────────────────────────────────────────────── */}
      {state.status === "idle" && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[#0B3D91]/30 bg-[#f0f4ff] hover:bg-[#e8eeff] hover:border-[#0B3D91]/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center group-hover:bg-[#0B3D91]/20 transition-colors shrink-0">
            <Sparkles size={14} className="text-[#0B3D91]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[#0B3D91] uppercase tracking-wide">
              Asistente IA · Análisis documental
            </p>
            <p className="text-[10px] text-[#747783] mt-0.5">
              Sube un PDF para completar el formulario automáticamente
            </p>
          </div>
          <FileText size={14} className="text-[#0B3D91]/40 shrink-0" />
        </button>
      )}

      {/* ── Analyzing ────────────────────────────────────────────────────── */}
      {state.status === "analyzing" && (
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#0B3D91]/20 bg-[#f0f4ff]">
          <span className="w-5 h-5 border-2 border-[#0B3D91]/20 border-t-[#0B3D91] rounded-full animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#0B3D91]">{STEPS[state.stepIndex]}</p>
            <div className="mt-1.5 h-1 bg-[#0B3D91]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0B3D91] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((state.stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────────────────── */}
      {state.status === "done" && (
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
          <CheckCircle size={15} className="text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-emerald-700">
              {state.fieldsApplied > 0
                ? `${state.fieldsApplied} ${state.fieldsApplied === 1 ? "campo completado" : "campos completados"} automáticamente`
                : "Análisis completado — ningún dato pudo extraerse con suficiente certeza"}
            </p>
            {state.tipoDocumento && (
              <p className="text-[10px] text-emerald-600 mt-0.5 truncate">
                {state.tipoDocumento}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="text-emerald-400 hover:text-emerald-600 shrink-0 transition-colors"
            title="Analizar otro documento"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {state.status === "error" && (
        <div className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-px" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-red-700">No se pudo analizar el documento</p>
            <p className="text-[10px] text-red-600 mt-0.5 leading-relaxed">{state.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="text-red-400 hover:text-red-600 shrink-0 transition-colors"
            title="Intentar de nuevo"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Review modal (rendered on top of everything) ──────────────────── */}
      {state.status === "reviewing" && (
        <ExtractionReviewModal
          schema={schema}
          extraction={state.extraction}
          warnings={state.warnings}
          fieldsFound={state.metadata.fieldsFound}
          tipoDocumento={
            (state.extraction["tipo_documento"]?.value as string | null | undefined) ?? null
          }
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
