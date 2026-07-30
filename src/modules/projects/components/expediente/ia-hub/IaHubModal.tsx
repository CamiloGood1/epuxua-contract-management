"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Upload, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { createFinancialReturn } from "@/services/financial-returns.actions"
import { MONTH_NAMES } from "@/types/financial-returns"
import type { FundingGroup } from "@/types/funding"
import type { ExtractoBancarioResult } from "@/lib/document-analyzer/schemas/extracto-bancario"

// ── Registro de capacidades ───────────────────────────────────────────────────

interface Capability {
  id: string
  icon: string
  title: string
  description: string
  available: boolean
}

const CAPABILITIES: Capability[] = [
  {
    id: "modificacion",
    icon: "📄",
    title: "Analizar Modificación Contractual",
    description: "Detecta y extrae automáticamente adiciones, prórrogas, suspensiones, reinicios y aclaratorios.",
    available: true,
  },
  {
    id: "extracto",
    icon: "🏦",
    title: "Analizar Extracto Bancario",
    description: "Extrae rendimientos financieros, banco, período y movimientos de intereses del extracto.",
    available: true,
  },
  {
    id: "contrato",
    icon: "📑",
    title: "Analizar Contrato Interadministrativo",
    description: "Extrae objeto, partes contratantes, valor, plazo y condiciones del contrato.",
    available: false,
  },
  {
    id: "acta_inicio",
    icon: "📋",
    title: "Analizar Acta de Inicio",
    description: "Identifica fecha de inicio, responsables y compromisos pactados.",
    available: false,
  },
  {
    id: "rp",
    icon: "💰",
    title: "Analizar RP",
    description: "Extrae número, valor, vigencia y descripción del Registro Presupuestal.",
    available: false,
  },
  {
    id: "cdp",
    icon: "📄",
    title: "Analizar CDP",
    description: "Extrae número, valor, concepto y expedidor del Certificado de Disponibilidad.",
    available: false,
  },
  {
    id: "factura",
    icon: "🧾",
    title: "Analizar Factura",
    description: "Lee número de factura, proveedor, valor, impuestos e ítems.",
    available: false,
  },
  {
    id: "informe_supervision",
    icon: "📊",
    title: "Analizar Informe de Supervisión",
    description: "Resume actividades ejecutadas, avances y observaciones del supervisor.",
    available: false,
  },
  {
    id: "acta_parcial",
    icon: "📝",
    title: "Analizar Acta Parcial",
    description: "Identifica período, actividades, cantidades y valores del acta parcial.",
    available: false,
  },
  {
    id: "acta_liquidacion",
    icon: "✅",
    title: "Analizar Acta de Liquidación",
    description: "Extrae valores finales, saldos, estado de obligaciones y firma de partes.",
    available: false,
  },
]

// ── Tipos ─────────────────────────────────────────────────────────────────────

type HubScreen =
  | "home"
  | "extracto_upload"
  | "extracto_analyzing"
  | "extracto_reviewing"
  | "extracto_success"

interface FormState {
  banco: string
  mes: string
  anio: string
  valor_rendimientos: string
  movimientos_relevantes: string
  observaciones: string
  funding_group_id: string
  return_date: string
}

interface Props {
  open: boolean
  onClose: () => void
  onModificacion: () => void
  interadministrativoId: number
  fundingGroups: FundingGroup[]
  canEdit: boolean
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function IaHubModal({
  open,
  onClose,
  onModificacion,
  interadministrativoId,
  fundingGroups,
  canEdit,
}: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [screen, setScreen]       = useState<HubScreen>("home")
  const [error, setError]         = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [extraction, setExtraction] = useState<ExtractoBancarioResult | null>(null)
  const [form, setForm] = useState<FormState>({
    banco: "", mes: "", anio: "", valor_rendimientos: "",
    movimientos_relevantes: "", observaciones: "",
    funding_group_id: fundingGroups[0] ? String(fundingGroups[0].id) : "",
    return_date: new Date().toISOString().split("T")[0],
  })
  const [isPending, start] = useTransition()

  if (!open) return null

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goHome() {
    setScreen("home")
    setError(null)
    setExtraction(null)
  }

  function handleCapabilityClick(cap: Capability) {
    if (!cap.available) return
    if (cap.id === "modificacion") {
      onClose()
      onModificacion()
      return
    }
    if (cap.id === "extracto") {
      setScreen("extracto_upload")
      setError(null)
      return
    }
  }

  // ── Extracto bancario ───────────────────────────────────────────────────────

  async function processFile(file: File) {
    setScreen("extracto_analyzing")
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/document-analysis/extracto-bancario", {
        method: "POST",
        body: fd,
      })
      const json = await res.json() as { extraction?: ExtractoBancarioResult; error?: string }
      if (!res.ok) throw new Error(json.error ?? "Error al analizar el extracto.")
      const ex = json.extraction!
      setExtraction(ex)
      setForm((f) => ({
        ...f,
        banco:                  ex.banco ?? "",
        mes:                    ex.mes != null ? String(ex.mes) : "",
        anio:                   ex.anio != null ? String(ex.anio) : "",
        valor_rendimientos:     ex.valor_rendimientos != null ? String(ex.valor_rendimientos) : "",
        movimientos_relevantes: ex.movimientos_relevantes ?? "",
        observaciones:          ex.observaciones ?? "",
        funding_group_id:       fundingGroups[0] ? String(fundingGroups[0].id) : "",
      }))
      setScreen("extracto_reviewing")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.")
      setScreen("extracto_upload")
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleRegister() {
    setError(null)
    const mes   = parseInt(form.mes, 10)
    const anio  = parseInt(form.anio, 10)
    const valor = parseFloat(form.valor_rendimientos.replace(/[^\d.-]/g, ""))
    const gid   = parseInt(form.funding_group_id, 10)

    if (!form.return_date)         { setError("Selecciona la fecha de registro."); return }
    if (!mes || mes < 1 || mes > 12) { setError("Selecciona un mes válido."); return }
    if (!anio || anio < 2000)      { setError("Ingresa un año válido (ej: 2026)."); return }
    if (!valor || valor <= 0)      { setError("El valor de rendimientos debe ser mayor a 0."); return }
    if (!gid)                      { setError("Selecciona el origen de recursos."); return }

    const obs = [
      form.movimientos_relevantes.trim(),
      form.observaciones.trim(),
    ].filter(Boolean).join("\n\n") || null

    start(async () => {
      const res = await createFinancialReturn({
        interadministrativo_id: interadministrativoId,
        funding_group_id:       gid,
        return_month:           mes,
        return_year:            anio,
        return_date:            form.return_date,
        gross_return_value:     valor,
        observations:           obs,
        repayment_status:       "PENDIENTE",
      })
      if (res.error) { setError(res.error); return }
      setScreen("extracto_success")
      router.refresh()
    })
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────

  const inputCls = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  function ConfPill({ value }: { value: number }) {
    if (value >= 0.8) return (
      <span className="ml-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Alta confianza</span>
    )
    if (value >= 0.6) return (
      <span className="ml-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Revisar</span>
    )
    return (
      <span className="ml-1.5 text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Verificar</span>
    )
  }

  const screenTitle: Partial<Record<HubScreen, string>> = {
    extracto_upload:    "Analizar Extracto Bancario",
    extracto_analyzing: "Analizar Extracto Bancario",
    extracto_reviewing: "Analizar Extracto Bancario",
    extracto_success:   "Analizar Extracto Bancario",
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0"
             style={{ background: "linear-gradient(135deg, #001B4F 0%, #0B3D91 60%, #1A4DA8 100%)" }}>
          <div className="flex items-center gap-3">
            {screen !== "home" && (
              <button type="button" onClick={goHome} title="Volver al menú principal"
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                {screen === "home" ? "Inteligencia Artificial" : (screenTitle[screen] ?? "")}
              </p>
              <h2 className="text-white font-bold text-base leading-tight">🤖 EPUXUA IA</h2>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── HOME: tarjetas de capacidades ── */}
          {screen === "home" && (
            <div>
              <p className="text-sm text-[#434652] mb-5 leading-relaxed">
                Selecciona una capacidad del asistente. Las funciones{" "}
                <span className="inline-flex items-center mx-0.5 px-2 py-0.5 text-[9px] font-bold bg-[#0B3D91]/10 text-[#0B3D91] rounded-full uppercase tracking-wide">Disponible</span>{" "}
                ya están activas. Las demás estarán disponibles en próximas versiones.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CAPABILITIES.map((cap) => {
                  const clickable = cap.available && canEdit
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => handleCapabilityClick(cap)}
                      disabled={!clickable}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        clickable
                          ? "border-[#0B3D91]/25 hover:border-[#0B3D91]/60 hover:bg-[#f0f3ff] hover:shadow-md bg-white cursor-pointer"
                          : "border-[#EAEAEA] bg-[#f9f9ff] cursor-not-allowed"
                      }`}
                    >
                      <div className={`text-2xl mb-2 ${!clickable ? "opacity-40" : ""}`}>{cap.icon}</div>
                      <h3 className={`text-[11px] font-bold leading-tight mb-1.5 ${clickable ? "text-[#151c27]" : "text-[#747783]"}`}>
                        {cap.title}
                      </h3>
                      <p className="text-[10px] text-[#747783] leading-tight mb-3">{cap.description}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                        cap.available
                          ? "bg-[#0B3D91]/10 text-[#0B3D91]"
                          : "bg-[#f0f3ff] text-[#ADADB8]"
                      }`}>
                        {cap.available ? "Disponible" : "Próximamente"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── EXTRACTO: subir archivo ── */}
          {screen === "extracto_upload" && (
            <div className="space-y-4">
              <p className="text-sm text-[#434652] leading-relaxed">
                Sube el extracto bancario en formato PDF. El asistente extraerá automáticamente el banco, período y valor de los rendimientos financieros generados.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[#0B3D91] bg-[#f0f3ff]"
                    : "border-[#EAEAEA] hover:border-[#0B3D91]/40 hover:bg-[#f9f9ff]"
                }`}
              >
                <Upload size={28} className="mx-auto text-[#747783] mb-3" />
                <p className="text-sm font-semibold text-[#151c27]">Arrastra el PDF aquí</p>
                <p className="text-xs text-[#747783] mt-1">o haz clic para seleccionar</p>
                <p className="text-[10px] text-[#747783] mt-2 opacity-70">Solo PDF · Máximo 10 MB · Con texto seleccionable</p>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ── EXTRACTO: analizando ── */}
          {screen === "extracto_analyzing" && (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f0f3ff] mb-5 animate-pulse">
                <span className="text-3xl">🏦</span>
              </div>
              <p className="text-sm font-bold text-[#002869]">Analizando extracto bancario…</p>
              <p className="text-xs text-[#747783] mt-2">El asistente está identificando rendimientos y movimientos de intereses.</p>
            </div>
          )}

          {/* ── EXTRACTO: revisión ── */}
          {screen === "extracto_reviewing" && extraction && (
            <div className="space-y-5">
              <div className="flex items-start gap-2.5 p-3 bg-[#f0f3ff] border border-[#0B3D91]/20 rounded-lg">
                <span className="text-base shrink-0 mt-0.5">✅</span>
                <p className="text-xs text-[#0B3D91] font-medium leading-relaxed">
                  Extracto analizado. Revisa y ajusta los campos extraídos. El <strong>Origen de Recursos</strong> debe seleccionarse manualmente según la cuenta correcta.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Banco
                    <ConfPill value={extraction.confidence_banco} />
                  </label>
                  <input type="text" value={form.banco}
                    onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))}
                    className={inputCls} placeholder="Nombre del banco" />
                </div>
                <div>
                  <label className={labelCls}>
                    Valor Rendimientos (COP) <span className="text-red-500">*</span>
                    <ConfPill value={extraction.confidence_valor} />
                  </label>
                  <input type="text" inputMode="numeric" value={form.valor_rendimientos}
                    onChange={(e) => setForm((f) => ({ ...f, valor_rendimientos: e.target.value }))}
                    className={inputCls} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>
                    Mes <span className="text-red-500">*</span>
                    <ConfPill value={extraction.confidence_mes} />
                  </label>
                  <select value={form.mes}
                    onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))} className={inputCls}>
                    <option value="">Seleccionar…</option>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    Año <span className="text-red-500">*</span>
                    <ConfPill value={extraction.confidence_anio} />
                  </label>
                  <input type="number" min={2000} max={2100} value={form.anio}
                    onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fecha de Registro <span className="text-red-500">*</span></label>
                  <input type="date" value={form.return_date}
                    onChange={(e) => setForm((f) => ({ ...f, return_date: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Origen de Recursos <span className="text-red-500">*</span>
                  <span className="ml-1 text-[9px] normal-case font-normal text-[#747783]">(selección manual)</span>
                </label>
                {fundingGroups.length === 0 ? (
                  <p className="text-xs text-amber-700 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    No hay orígenes de recursos configurados. Configura las Fuentes de Financiación primero.
                  </p>
                ) : (
                  <select value={form.funding_group_id}
                    onChange={(e) => setForm((f) => ({ ...f, funding_group_id: e.target.value }))} className={inputCls}>
                    <option value="">Seleccionar…</option>
                    {fundingGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.group_name}</option>
                    ))}
                  </select>
                )}
              </div>

              {form.movimientos_relevantes && (
                <div>
                  <label className={labelCls}>Movimientos Relevantes (extraídos por IA)</label>
                  <textarea value={form.movimientos_relevantes}
                    onChange={(e) => setForm((f) => ({ ...f, movimientos_relevantes: e.target.value }))}
                    className={inputCls + " h-16 py-2 resize-none"} />
                </div>
              )}

              {form.observaciones && (
                <div>
                  <label className={labelCls}>Observaciones (extraídas por IA)</label>
                  <textarea value={form.observaciones}
                    onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                    className={inputCls + " h-16 py-2 resize-none"} />
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setScreen("extracto_upload")}
                  className="flex-1 h-10 border border-[#EAEAEA] rounded-lg text-sm font-semibold text-[#434652] hover:bg-[#f9f9ff]">
                  Subir otro extracto
                </button>
                <button type="button" onClick={handleRegister}
                  disabled={isPending || fundingGroups.length === 0}
                  className="flex-1 h-10 bg-[#0B3D91] text-white rounded-lg text-sm font-semibold hover:bg-[#002869] disabled:opacity-50">
                  {isPending ? "Registrando…" : "Registrar Rendimiento"}
                </button>
              </div>
            </div>
          )}

          {/* ── EXTRACTO: éxito ── */}
          {screen === "extracto_success" && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <p className="text-base font-bold text-[#002869] mb-1">¡Rendimiento registrado!</p>
              <p className="text-sm text-[#434652] max-w-xs mx-auto leading-relaxed">
                El extracto fue analizado y el rendimiento financiero quedó registrado en el módulo correspondiente.
              </p>
              <div className="flex gap-3 mt-6 justify-center">
                <button type="button" onClick={goHome}
                  className="px-4 h-10 border border-[#EAEAEA] rounded-lg text-sm font-semibold text-[#434652] hover:bg-[#f9f9ff]">
                  Analizar otro documento
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 h-10 bg-[#0B3D91] text-white rounded-lg text-sm font-semibold hover:bg-[#002869]">
                  Cerrar asistente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
