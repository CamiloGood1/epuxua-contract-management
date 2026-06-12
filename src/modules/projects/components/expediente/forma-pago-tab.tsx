"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Info, Calendar } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { createMilestone, updateMilestone, deleteMilestone } from "@/services/forma-pago.actions"
import { calcFormaPagoSummary } from "@/types/forma-pago"
import type { PaymentMilestone, DestinoHito } from "@/types/forma-pago"
import type { CreateMilestoneInput } from "@/services/forma-pago.actions"
import type { Interadministrativo } from "@/types/database"
import { formatDateShort } from "@/lib/date-format"

export type { PaymentMilestone }

// ── Helpers ───────────────────────────────────────────────────────────────────

const DESTINO_CFG: Record<DestinoHito, { label: string; bg: string; text: string; border: string }> = {
  BIENES_SERVICIOS: { label: "Bienes y Servicios", bg: "bg-[#0B3D91]/10", text: "text-[#0B3D91]",   border: "border-[#0B3D91]/20" },
  CUOTA_GERENCIA:   { label: "Cuota de Gerencia",  bg: "bg-violet-50",    text: "text-violet-700",  border: "border-violet-200" },
  MIXTO:            { label: "Mixto",              bg: "bg-teal-50",      text: "text-teal-700",    border: "border-teal-200" },
}

function DestinoBadge({ destination }: { destination: DestinoHito }) {
  const c = DESTINO_CFG[destination]
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  )
}

function fmt(v: number | null | undefined) {
  return v == null ? "—" : formatCOP(v)
}

function fmtDate(d: string) {
  return formatDateShort(d.includes("T") ? d.slice(0, 10) : d)
}

function pctBar(value: number, total: number, color: string) {
  const pct = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-[#747783]">Programado</span>
        <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#f0f3ff] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Sección resumen financiero ────────────────────────────────────────────────

interface SummaryBlockProps {
  title: string
  available: number
  programado: number
  color: string
  accentBg: string
}

function SummaryBlock({ title, available, programado, color, accentBg }: SummaryBlockProps) {
  const pendiente = Math.max(0, available - programado)
  const exceso    = programado > available && available > 0 ? programado - available : 0
  const pct       = available > 0 ? Math.round((programado / available) * 100) : 0
  const hasExcess = exceso > 0

  return (
    <div className={`flex-1 border rounded-xl p-5 ${hasExcess ? "border-red-200 bg-red-50" : "border-[#EAEAEA] bg-white"}`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#747783]">{title}</h4>
        {hasExcess ? (
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle size={10} /> Excede límite
          </span>
        ) : programado > 0 && pct === 100 ? (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={10} /> 100% programado
          </span>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {[
          { label: "Valor Disponible",  v: available,  bold: true,  color: "text-[#151c27]" },
          { label: "Valor Programado",  v: programado, bold: true,  color: hasExcess ? "text-red-600" : `text-[${color}]` },
          { label: "Valor Pendiente",   v: pendiente,  bold: false, color: pendiente > 0 ? "text-amber-600" : "text-[#747783]" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[11px] text-[#434652]">{row.label}</span>
            <span className={`text-[13px] tabular-nums ${row.bold ? "font-bold" : "font-medium"} ${row.color}`}>{fmt(row.v)}</span>
          </div>
        ))}
      </div>

      {available > 0 && (
        <div className="mt-4">
          {pctBar(programado, available, hasExcess ? "#EF4444" : color)}
        </div>
      )}

      {available === 0 && (
        <div className={`mt-3 flex items-start gap-1.5 p-2.5 rounded-lg ${accentBg}`}>
          <Info size={12} className="text-[#747783] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#747783]">Valor no definido en el contrato</p>
        </div>
      )}
    </div>
  )
}

// ── Modal de hito ─────────────────────────────────────────────────────────────

interface ModalProps {
  interadministrativoId: number
  milestone?: PaymentMilestone | null
  existingNumbers: number[]
  onClose: () => void
}

const EMPTY_FORM = {
  milestone_number:  "",
  milestone_name:    "",
  destination:       "BIENES_SERVICIOS" as DestinoHito,
  percentage:        "",
  scheduled_value:   "",
  payment_condition: "",
  observations:      "",
}

function MilestoneModal({ interadministrativoId, milestone, existingNumbers, onClose }: ModalProps) {
  const router = useRouter()
  const isEditing = !!milestone
  const [form, setForm] = useState(() =>
    milestone
      ? {
          milestone_number:  String(milestone.milestone_number),
          milestone_name:    milestone.milestone_name,
          destination:       milestone.destination,
          percentage:        milestone.percentage != null ? String(milestone.percentage) : "",
          scheduled_value:   String(milestone.scheduled_value),
          payment_condition: milestone.payment_condition,
          observations:      milestone.observations ?? "",
        }
      : EMPTY_FORM
  )
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const milNum = parseInt(form.milestone_number)
    const value  = parseFloat(form.scheduled_value)
    const pct    = form.percentage ? parseFloat(form.percentage) : null

    if (isNaN(milNum) || milNum < 1)       { setError("El número de hito debe ser mayor a 0."); return }
    if (!form.milestone_name.trim())        { setError("El nombre del hito es obligatorio."); return }
    if (!form.payment_condition.trim())     { setError("La condición de pago es obligatoria."); return }
    if (isNaN(value) || value <= 0)         { setError("El valor programado debe ser mayor a 0."); return }
    if (pct != null && (pct < 0 || pct > 100)) { setError("El porcentaje debe estar entre 0 y 100."); return }
    if (!isEditing && existingNumbers.includes(milNum)) {
      setError(`El hito número ${milNum} ya existe en este contrato.`)
      return
    }

    const input: CreateMilestoneInput = {
      interadministrativo_id: interadministrativoId,
      milestone_number:   milNum,
      milestone_name:     form.milestone_name.trim(),
      destination:        form.destination,
      percentage:         pct,
      scheduled_value:    value,
      payment_condition:  form.payment_condition.trim(),
      observations:       form.observations.trim() || null,
    }

    start(async () => {
      const res = isEditing
        ? await updateMilestone(milestone!.id, interadministrativoId, input, {
            milestone_number: milestone!.milestone_number,
            milestone_name:   milestone!.milestone_name,
            scheduled_value:  milestone!.scheduled_value,
          })
        : await createMilestone(input)
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  const inputCls = "w-full rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">
            {isEditing ? "Editar Hito de Pago" : "Agregar Hito de Pago"}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>N° Hito <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                step={1}
                value={form.milestone_number}
                onChange={(e) => set("milestone_number", e.target.value)}
                className={inputCls + " h-10"}
                placeholder="1"
              />
            </div>
            <div>
              <label className={labelCls}>Destino <span className="text-red-500">*</span></label>
              <select
                value={form.destination}
                onChange={(e) => set("destination", e.target.value as DestinoHito)}
                className={inputCls + " h-10 appearance-none"}
              >
                <option value="BIENES_SERVICIOS">Bienes y Servicios</option>
                <option value="CUOTA_GERENCIA">Cuota de Gerencia</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Nombre del Hito <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.milestone_name}
              onChange={(e) => set("milestone_name", e.target.value)}
              className={inputCls + " h-10"}
              placeholder="Ej. Pago Inicial, Acta de Inicio…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Porcentaje</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.percentage}
                  onChange={(e) => set("percentage", e.target.value)}
                  className={inputCls + " h-10 pr-8"}
                  placeholder="0 – 100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#747783]">%</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Valor Programado <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.scheduled_value}
                onChange={(e) => set("scheduled_value", e.target.value)}
                className={inputCls + " h-10"}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Condición de Pago <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              value={form.payment_condition}
              onChange={(e) => set("payment_condition", e.target.value)}
              className={inputCls + " py-2 resize-none"}
              placeholder="Ej. Firma del contrato, entrega de informe técnico…"
            />
          </div>

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              rows={2}
              value={form.observations}
              onChange={(e) => set("observations", e.target.value)}
              className={inputCls + " py-2 resize-none"}
              placeholder="Opcional"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60"
            >
              {isPending ? "Guardando…" : isEditing ? "Actualizar Hito" : "Agregar Hito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tarjeta visual de hito ────────────────────────────────────────────────────

function MilestoneCard({
  hito,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  hito: PaymentMilestone
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const cfg = DESTINO_CFG[hito.destination]

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 hover:border-[#0B3D91]/20 transition-colors" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Número del hito */}
          <div className="w-9 h-9 rounded-full bg-[#0B3D91] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">{hito.milestone_number}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#151c27] leading-tight">{hito.milestone_name}</p>
            <p className="text-[10px] text-[#747783] mt-0.5">{fmtDate(hito.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DestinoBadge destination={hito.destination} />
          {canEdit && (
            <button onClick={onEdit} className="p-1.5 rounded hover:bg-[#f0f3ff] text-[#747783] hover:text-[#0B3D91] transition-colors" title="Editar">
              <Pencil size={13} />
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-[#747783] hover:text-red-600 transition-colors" title="Eliminar">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className={`rounded-lg p-3 ${cfg.bg}`}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-0.5">Valor Programado</p>
          <p className={`text-lg font-bold tabular-nums ${cfg.text}`}>{fmt(Number(hito.scheduled_value))}</p>
        </div>
        {hito.percentage != null && (
          <div className="rounded-lg p-3 bg-[#f9f9ff]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-0.5">Porcentaje</p>
            <p className="text-lg font-bold tabular-nums text-[#002869]">{hito.percentage}%</p>
          </div>
        )}
      </div>

      <div className="border-t border-[#EAEAEA] pt-3 space-y-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-0.5 flex items-center gap-1">
            <Calendar size={9} />
            Condición de pago
          </p>
          <p className="text-xs text-[#434652] leading-relaxed">{hito.payment_condition}</p>
        </div>
        {hito.observations && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-0.5">Observaciones</p>
            <p className="text-xs text-[#747783] leading-relaxed italic">{hito.observations}</p>
          </div>
        )}
        {hito.created_by && (
          <p className="text-[9px] text-[#747783] pt-1 border-t border-[#f0f3ff]">
            Registrado por {hito.created_by}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  project: Interadministrativo
  hitos: PaymentMilestone[]
  canEdit: boolean
  canDelete: boolean
}

export function FormaPagoTab({ project: p, hitos, canEdit, canDelete }: Props) {
  const router = useRouter()
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<PaymentMilestone | null>(null)
  const [view, setView]             = useState<"cards" | "table">("cards")
  const [deleting, startDelete]     = useTransition()

  const summary = useMemo(() => calcFormaPagoSummary(hitos), [hitos])

  // Valores de referencia desde el contrato
  const totalContrato   = Number(p.total_contrato   ?? 0)
  const totalCuota      = Number(p.total_cuota_admin ?? 0)
  const valorBienes     = Math.max(0, totalContrato - totalCuota)

  // Validaciones globales
  const excedeBienes    = summary.programadoBienes > valorBienes && valorBienes > 0
  const excedeCuota     = summary.programadoCuota  > totalCuota  && totalCuota  > 0
  const excedeTotal     = summary.programadoTotal  > totalContrato && totalContrato > 0
  const hayAdvertencia  = excedeBienes || excedeCuota || excedeTotal
  const faltaProgramar  = summary.programadoTotal < totalContrato && summary.totalHitos > 0

  const existingNumbers = useMemo(() => hitos.map((h) => h.milestone_number), [hitos])

  const sorted = useMemo(() => [...hitos].sort((a, b) => a.milestone_number - b.milestone_number), [hitos])

  async function handleDelete(h: PaymentMilestone) {
    if (!confirm(`¿Eliminar el Hito ${h.milestone_number} — "${h.milestone_name}"? Esta acción no se puede deshacer.`)) return
    startDelete(async () => {
      const res = await deleteMilestone(h.id, p.id, {
        milestone_number: h.milestone_number,
        milestone_name:   h.milestone_name,
        scheduled_value:  h.scheduled_value,
      })
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Resumen Financiero ── */}
      <div className="flex flex-col md:flex-row gap-4">
        <SummaryBlock
          title="Bienes y Servicios"
          available={valorBienes}
          programado={summary.programadoBienes + summary.programadoMixto}
          color="#0B3D91"
          accentBg="bg-[#f9f9ff]"
        />
        <SummaryBlock
          title="Cuota de Gerencia"
          available={totalCuota}
          programado={summary.programadoCuota}
          color="#7c3aed"
          accentBg="bg-violet-50"
        />
        {/* Totalizador */}
        <div className="flex-1 border border-[#EAEAEA] rounded-xl p-5 bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#747783] mb-4">Total Contrato</h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#434652]">Valor Total</span>
              <span className="text-[13px] font-bold text-[#151c27] tabular-nums">{fmt(totalContrato)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#434652]">Total Programado</span>
              <span className={`text-[13px] font-bold tabular-nums ${excedeTotal ? "text-red-600" : "text-[#D9A520]"}`}>{fmt(summary.programadoTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#434652]">Hitos registrados</span>
              <span className="text-[13px] font-bold text-[#151c27]">{summary.totalHitos}</span>
            </div>
            {summary.sumaPct > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#434652]">Suma % declarada</span>
                <span className={`text-[13px] font-bold tabular-nums ${summary.sumaPct > 100 ? "text-red-600" : "text-[#151c27]"}`}>{summary.sumaPct.toFixed(1)}%</span>
              </div>
            )}
          </div>
          {totalContrato > 0 && (
            <div className="mt-4">
              {pctBar(summary.programadoTotal, totalContrato, excedeTotal ? "#EF4444" : "#D9A520")}
            </div>
          )}
        </div>
      </div>

      {/* ── Alertas de validación ── */}
      {hayAdvertencia && (
        <div className="space-y-2">
          {excedeTotal && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">La suma de hitos supera el valor total del contrato</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Programado: {fmt(summary.programadoTotal)} · Disponible: {fmt(totalContrato)} · Exceso: {fmt(summary.programadoTotal - totalContrato)}
                </p>
              </div>
            </div>
          )}
          {excedeBienes && !excedeTotal && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Los hitos de Bienes y Servicios superan el valor disponible</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Programado B&amp;S: {fmt(summary.programadoBienes)} · Disponible: {fmt(valorBienes)}
                </p>
              </div>
            </div>
          )}
          {excedeCuota && !excedeTotal && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Los hitos de Cuota de Gerencia superan el valor disponible</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Programado Cuota: {fmt(summary.programadoCuota)} · Disponible: {fmt(totalCuota)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {faltaProgramar && !hayAdvertencia && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700">Quedan recursos sin programar</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Pendiente de programar: {fmt(totalContrato - summary.programadoTotal)}
            </p>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#002869]">
            Cronograma de Pagos
            {sorted.length > 0 && <span className="ml-2 text-[11px] font-normal text-[#747783]">({sorted.length} hito{sorted.length !== 1 ? "s" : ""})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex border border-[#EAEAEA] rounded-lg overflow-hidden">
            {(["cards", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? "bg-[#0B3D91] text-white" : "text-[#747783] hover:bg-[#f0f3ff]"}`}
              >
                {v === "cards" ? "Tarjetas" : "Tabla"}
              </button>
            ))}
          </div>
          {canEdit && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true) }}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#002869]"
            >
              <Plus size={13} />
              Agregar Hito de Pago
            </button>
          )}
        </div>
      </div>

      {/* ── Vista Tarjetas ── */}
      {view === "cards" && (
        <>
          {sorted.length === 0 ? (
            <div className="bg-white border border-dashed border-[#EAEAEA] rounded-xl flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-[#f0f3ff] flex items-center justify-center mb-4">
                <Calendar size={22} className="text-[#0B3D91]/40" />
              </div>
              <p className="text-sm font-semibold text-[#151c27]">Sin hitos de pago</p>
              <p className="text-xs text-[#747783] mt-1 text-center max-w-xs">
                {canEdit
                  ? "Agrega el cronograma financiero pactado en la minuta contractual."
                  : "No hay hitos de pago registrados para este contrato."}
              </p>
              {canEdit && (
                <button
                  onClick={() => { setEditTarget(null); setShowModal(true) }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B3D91] text-white text-sm font-semibold rounded-lg hover:bg-[#002869]"
                >
                  <Plus size={14} />
                  Agregar primer hito
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.map((h) => (
                <MilestoneCard
                  key={h.id}
                  hito={h}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => { setEditTarget(h); setShowModal(true) }}
                  onDelete={() => handleDelete(h)}
                />
              ))}
              {/* Tarjeta placeholder de "total" al final */}
              {summary.totalHitos > 1 && (
                <div className="bg-[#f9f9ff] border border-dashed border-[#0B3D91]/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#747783] mb-2">Total Programado</p>
                  <p className="text-2xl font-bold text-[#002869] tabular-nums">{fmt(summary.programadoTotal)}</p>
                  <p className="text-[10px] text-[#747783] mt-1">{summary.totalHitos} hitos · {Math.round(summary.programadoTotal / totalContrato * 100)}% del contrato</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Vista Tabla ── */}
      {view === "table" && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar size={36} className="text-[#EAEAEA] mb-3" />
              <p className="text-sm font-semibold text-[#151c27]">Sin hitos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
                  <tr>
                    {["N°","Nombre","Destino","Porcentaje","Valor Programado","Condición","Observaciones","Creado","Usuario",""].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {sorted.map((h) => (
                    <tr key={h.id} className="hover:bg-[#f9f9ff] transition-colors">
                      <td className="px-4 py-3">
                        <span className="w-7 h-7 rounded-full bg-[#0B3D91] text-white text-xs font-bold flex items-center justify-center">
                          {h.milestone_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#151c27] whitespace-nowrap">{h.milestone_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><DestinoBadge destination={h.destination} /></td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        {h.percentage != null ? `${h.percentage}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-[#D9A520] whitespace-nowrap">
                        {fmt(Number(h.scheduled_value))}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="line-clamp-2 text-xs text-[#434652]">{h.payment_condition}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[140px]">
                        <span className="line-clamp-1 text-xs text-[#747783] italic">{h.observations ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#747783] whitespace-nowrap">{fmtDate(h.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-[#747783] max-w-[100px]">
                        <span className="truncate block">{h.created_by ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => { setEditTarget(h); setShowModal(true) }}
                              className="p-1.5 rounded hover:bg-[#f0f3ff] text-[#747783] hover:text-[#0B3D91]"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(h)}
                              disabled={deleting}
                              className="p-1.5 rounded hover:bg-red-50 text-[#747783] hover:text-red-600 disabled:opacity-40"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {sorted.length > 1 && (
                  <tfoot className="bg-[#f9f9ff] border-t border-[#EAEAEA]">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-[11px] font-bold text-[#747783] uppercase tracking-wide">
                        Total ({sorted.length})
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-[#D9A520]">
                        {fmt(summary.programadoTotal)}
                      </td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MilestoneModal
          interadministrativoId={p.id}
          milestone={editTarget}
          existingNumbers={existingNumbers.filter((n) => !editTarget || n !== editTarget.milestone_number)}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
