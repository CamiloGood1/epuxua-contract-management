"use client"

import { X, AlertTriangle, Info } from "lucide-react"
import { ConfidenceBadge } from "./ConfidenceBadge"
import type { DocumentAnalyzerSchema, ExtractionField, ValidationWarning } from "@/lib/document-analyzer/types"

interface ExtractionReviewModalProps {
  schema: DocumentAnalyzerSchema
  extraction: Record<string, ExtractionField>
  warnings: ValidationWarning[]
  fieldsFound: number
  tipoDocumento: string | null
  onConfirm: () => void
  onCancel: () => void
}

// ─── Value formatters ────────────────────────────────────────────────────────

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatValue(value: unknown, type: DocumentAnalyzerSchema["fields"][number]["type"]): string {
  if (value == null) return ""

  if (type === "currency") {
    const n = Number(value)
    return isNaN(n) ? String(value) : COP.format(n)
  }

  if (type === "date") {
    try {
      const d = new Date(String(value) + "T12:00:00")
      return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    } catch {
      return String(value)
    }
  }

  return String(value)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExtractionReviewModal({
  schema,
  extraction,
  warnings,
  fieldsFound,
  tipoDocumento,
  onConfirm,
  onCancel,
}: ExtractionReviewModalProps) {
  const totalFields = schema.fields.length
  const hasWarnings = warnings.length > 0

  return (
    // Fixed overlay — z-[60] so it sits above AdicionModal (z-50)
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-base">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Datos encontrados en el documento</h2>
            {tipoDocumento ? (
              <p className="text-[11px] text-[#0B3D91] mt-0.5 font-medium">{tipoDocumento}</p>
            ) : null}
            <p className="text-[11px] text-gray-500 mt-0.5">
              {fieldsFound} de {totalFields} campos detectados automáticamente
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-2">
          {schema.fields.map((field, i) => {
            const exField = extraction[field.key] as ExtractionField | undefined
            const value = exField?.value ?? null
            const confidence = exField?.confidence ?? 0
            const found = value !== null && confidence >= 0.3

            return (
              <div
                key={field.key}
                className={`py-3 ${i < schema.fields.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5">{field.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {field.label}
                    </p>
                    {found ? (
                      <p
                        className={`text-sm font-medium mt-0.5 break-words ${
                          confidence >= 0.7 ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {formatValue(value, field.type)}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400 mt-0.5">No se encontró este dato</p>
                    )}
                  </div>
                  {found && (
                    <div className="shrink-0 mt-0.5">
                      <ConfidenceBadge confidence={confidence} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Validation warnings */}
          {hasWarnings && (
            <div className="mt-3 mb-1 space-y-2">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-[11px] leading-relaxed ${
                    w.severity === "warning"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}
                >
                  {w.severity === "warning" ? (
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  ) : (
                    <Info size={12} className="shrink-0 mt-0.5" />
                  )}
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Threshold note */}
          <p className="text-[10px] text-gray-400 mt-3 mb-2 leading-relaxed">
            Solo se aplicarán campos con confianza{" "}
            <span className="font-semibold text-amber-600">🟡 70%</span> o superior.
            Los campos en 🔴 rojo deben diligenciarse manualmente.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-5 border-t border-gray-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={fieldsFound === 0}
            className="flex-[2] py-2.5 rounded-xl bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#0a3580] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Aceptar y completar formulario
          </button>
        </div>
      </div>
    </div>
  )
}
