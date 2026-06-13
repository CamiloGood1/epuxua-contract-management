"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  X, Plus, Pencil, Trash2, AlertTriangle, TrendingUp, Eye, ChevronDown, ChevronUp,
  DollarSign, Calendar, Users,
} from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { formatDateShort } from "@/lib/date-format"
import {
  createFinancialReturn,
  updateFinancialReturn,
  deleteFinancialReturn,
} from "@/services/financial-returns.actions"
import type { CreateFinancialReturnInput } from "@/services/financial-returns.actions"
import type { FundingData, FundingGroup } from "@/types/funding"
import { getSourcesForGroup } from "@/types/funding"
import {
  calcFinancialReturnsKPIs,
  calcFinanciadorResumen,
  getDistributionsForReturn,
  computeDistributionRows,
  monthName,
  MONTH_NAMES,
  REPAYMENT_STATUS_LABEL,
  REPAYMENT_STATUS_CFG,
  type FinancialReturnsData,
  type FinancialReturn,
  type RepaymentStatus,
} from "@/types/financial-returns"

function fmt(v: number) { return formatCOP(v) }

function KpiCard({ label, value, sub, accent = "text-[#D9A520]", icon }: {
  label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#747783] leading-tight">{label}</p>
        {icon && <div className="text-[#747783]">{icon}</div>}
      </div>
      <p className={`text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#747783] mt-0.5">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: RepaymentStatus }) {
  const cfg = REPAYMENT_STATUS_CFG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text}`}>
      {REPAYMENT_STATUS_LABEL[status]}
    </span>
  )
}

function groupLabel(g: FundingGroup) {
  return g.group_name
}

// ── Modal registrar / editar ──────────────────────────────────────────────────

interface ReturnModalProps {
  interadministrativoId: number
  groups: FundingGroup[]
  funding: FundingData
  item?: FinancialReturn | null
  onClose: () => void
}

function ReturnModal({ interadministrativoId, groups, funding, item, onClose }: ReturnModalProps) {
  const router = useRouter()
  const now = new Date()
  const [form, setForm] = useState(() =>
    item
      ? {
          funding_group_id: String(item.funding_group_id),
          return_month: String(item.return_month),
          return_year: String(item.return_year),
          return_date: item.return_date,
          gross_return_value: String(item.gross_return_value),
          observations: item.observations ?? "",
          repayment_status: item.repayment_status,
        }
      : {
          funding_group_id: groups[0] ? String(groups[0].id) : "",
          return_month: String(now.getMonth() + 1),
          return_year: String(now.getFullYear()),
          return_date: now.toISOString().split("T")[0],
          gross_return_value: "",
          observations: "",
          repayment_status: "PENDIENTE" as RepaymentStatus,
        },
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  const selectedGroupId = parseInt(form.funding_group_id, 10)
  const groupSources = useMemo(
    () => (selectedGroupId ? getSourcesForGroup(funding.sources, selectedGroupId) : []),
    [funding.sources, selectedGroupId],
  )

  const parsedGross = parseFloat(form.gross_return_value.replace(/[^\d.-]/g, "")) || 0
  const previewDist = useMemo(
    () => parsedGross > 0 && groupSources.length > 0
      ? computeDistributionRows(parsedGross, groupSources)
      : [],
    [parsedGross, groupSources],
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.funding_group_id) { setError("Seleccione el origen de recursos."); return }
    if (groupSources.length === 0) { setError("El origen seleccionado no tiene fuentes de financiación."); return }
    if (parsedGross <= 0) { setError("El valor del rendimiento debe ser mayor a 0."); return }

    const input: CreateFinancialReturnInput = {
      interadministrativo_id: interadministrativoId,
      funding_group_id: selectedGroupId,
      return_month: parseInt(form.return_month, 10),
      return_year: parseInt(form.return_year, 10),
      return_date: form.return_date,
      gross_return_value: parsedGross,
      observations: form.observations.trim() || null,
    }

    start(async () => {
      const res = item
        ? await updateFinancialReturn(item.id, interadministrativoId, {
            ...input,
            repayment_status: form.repayment_status,
          })
        : await createFinancialReturn(input)
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  const inputCls = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-[#002869]">
            {item ? "Editar Rendimiento Financiero" : "Registrar Rendimiento Financiero"}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mes <span className="text-red-500">*</span></label>
              <select value={form.return_month} onChange={(e) => setForm((p) => ({ ...p, return_month: e.target.value }))} className={inputCls}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Año <span className="text-red-500">*</span></label>
              <input type="number" min={2000} max={2100} value={form.return_year}
                onChange={(e) => setForm((p) => ({ ...p, return_year: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha Registro <span className="text-red-500">*</span></label>
              <input type="date" value={form.return_date}
                onChange={(e) => setForm((p) => ({ ...p, return_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Origen de Recursos <span className="text-red-500">*</span></label>
              <select value={form.funding_group_id}
                onChange={(e) => setForm((p) => ({ ...p, funding_group_id: e.target.value }))} className={inputCls}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{groupLabel(g)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Valor Rendimiento (COP) <span className="text-red-500">*</span></label>
            <input type="text" inputMode="numeric" value={form.gross_return_value}
              onChange={(e) => setForm((p) => ({ ...p, gross_return_value: e.target.value }))}
              className={inputCls} placeholder="0" />
          </div>

          {item && (
            <div>
              <label className={labelCls}>Estado de Devolución</label>
              <select value={form.repayment_status}
                onChange={(e) => setForm((p) => ({ ...p, repayment_status: e.target.value as RepaymentStatus }))}
                className={inputCls}>
                {(Object.keys(REPAYMENT_STATUS_LABEL) as RepaymentStatus[]).map((s) => (
                  <option key={s} value={s}>{REPAYMENT_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea value={form.observations}
              onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
              className={inputCls + " h-16 py-2 resize-none"} placeholder="Opcional" />
          </div>

          {previewDist.length > 0 && (
            <div className="bg-[#f9f9ff] border border-[#EAEAEA] rounded-xl p-4">
              <p className="text-xs font-bold text-[#002869] mb-3">Distribución Automática (vista previa)</p>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-[#747783]">
                    <th className="pb-2">Fuente</th>
                    <th className="pb-2">Participación</th>
                    <th className="pb-2 text-right">Valor Asignado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {previewDist.map((d) => (
                    <tr key={d.funding_source_id}>
                      <td className="py-1.5 font-semibold text-[#151c27]">{d.source_name}</td>
                      <td className="py-1.5 text-[#0B3D91]">{d.participation_percentage.toFixed(2)}%</td>
                      <td className="py-1.5 text-right font-bold text-[#D9A520] tabular-nums">{fmt(d.distributed_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {groupSources.length === 0 && form.funding_group_id && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Este origen no tiene fuentes configuradas. Configure fuentes en la pestaña Fuentes de Financiación.</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 border border-[#EAEAEA] rounded-lg text-sm font-semibold text-[#434652] hover:bg-[#f9f9ff]">
              Cancelar
            </button>
            <button type="submit" disabled={isPending || groupSources.length === 0}
              className="flex-1 h-10 bg-[#0B3D91] text-white rounded-lg text-sm font-semibold hover:bg-[#002869] disabled:opacity-50">
              {isPending ? "Guardando…" : item ? "Actualizar" : "Registrar Rendimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detalle de rendimiento ────────────────────────────────────────────────────

function ReturnDetailDrawer({
  item,
  groups,
  distributions,
  onClose,
}: {
  item: FinancialReturn
  groups: FundingGroup[]
  distributions: ReturnType<typeof getDistributionsForReturn>
  onClose: () => void
}) {
  const group = groups.find((g) => g.id === item.funding_group_id)
  const dists = distributions

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white">
          <h2 className="text-base font-bold text-[#002869]">Detalle del Rendimiento</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Período", v: `${monthName(item.return_month)} ${item.return_year}` },
              { l: "Fecha", v: formatDateShort(item.return_date) },
              { l: "Origen", v: group?.group_name ?? "—" },
              { l: "Valor Total", v: fmt(item.gross_return_value), accent: "text-[#D9A520]" },
              { l: "Estado Devolución", v: <StatusBadge status={item.repayment_status} /> },
              { l: "Registrado por", v: item.user_email ?? "—" },
            ].map((row) => (
              <div key={row.l} className="bg-[#f9f9ff] rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783]">{row.l}</p>
                <div className={`text-sm font-semibold mt-0.5 ${row.accent ?? "text-[#151c27]"}`}>{row.v}</div>
              </div>
            ))}
          </div>

          {item.observations && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[10px] font-bold uppercase text-amber-700 mb-1">Observaciones</p>
              <p className="text-xs text-amber-800">{item.observations}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-[#002869] mb-3">Distribución Automática</h3>
            <table className="w-full text-left">
              <thead className="border-b border-[#EAEAEA]">
                <tr>
                  {["Fuente", "Participación", "Valor Asignado"].map((h) => (
                    <th key={h} className="pb-2 text-[10px] font-bold uppercase text-[#747783]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {dists.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 text-sm font-semibold">{d.source_name}</td>
                    <td className="py-2.5 text-sm text-[#0B3D91]">{d.participation_percentage.toFixed(2)}%</td>
                    <td className="py-2.5 text-sm font-bold text-[#D9A520] tabular-nums">{fmt(d.distributed_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  interadministrativoId: number
  financialReturns: FinancialReturnsData
  funding: FundingData
  canEdit: boolean
  canDelete: boolean
}

export function RendimientosFinancierosTab({
  interadministrativoId,
  financialReturns,
  funding,
  canEdit,
  canDelete,
}: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: FinancialReturn } | null>(null)
  const [detail, setDetail] = useState<FinancialReturn | null>(null)
  const [showResumen, setShowResumen] = useState(true)
  const [isPending, start] = useTransition()

  const kpis = useMemo(() => calcFinancialReturnsKPIs(financialReturns), [financialReturns])
  const resumenFin = useMemo(() => calcFinanciadorResumen(financialReturns.distributions), [financialReturns.distributions])

  const groupsWithSources = useMemo(
    () => funding.groups.filter((g) => getSourcesForGroup(funding.sources, g.id).length > 0),
    [funding],
  )

  const groupNameMap = useMemo(() => {
    const m = new Map<number, string>()
    funding.groups.forEach((g) => m.set(g.id, g.group_name))
    return m
  }, [funding.groups])

  const alerts = useMemo(() => {
    const list: { level: "warning" | "info"; text: string }[] = []
    if (funding.sources.length === 0) {
      list.push({ level: "warning", text: "No hay fuentes de financiación configuradas. Configure fuentes antes de registrar rendimientos." })
    }
    const pendientes = financialReturns.returns.filter((r) => r.repayment_status === "PENDIENTE")
    if (pendientes.length > 0) {
      list.push({ level: "warning", text: `${pendientes.length} rendimiento${pendientes.length > 1 ? "s" : ""} pendiente${pendientes.length > 1 ? "s" : ""} de devolución.` })
    }
    const parciales = financialReturns.returns.filter((r) => r.repayment_status === "PARCIAL")
    if (parciales.length > 0) {
      list.push({ level: "info", text: `${parciales.length} rendimiento${parciales.length > 1 ? "s" : ""} con devolución parcial.` })
    }
    return list
  }, [financialReturns.returns, funding.sources.length])

  const sortedReturns = useMemo(
    () => [...financialReturns.returns].sort((a, b) =>
      b.return_year - a.return_year || b.return_month - a.return_month || b.id - a.id,
    ),
    [financialReturns.returns],
  )

  function handleDelete(item: FinancialReturn) {
    if (!confirm(`¿Eliminar rendimiento de ${monthName(item.return_month)} ${item.return_year}?`)) return
    start(async () => {
      const res = await deleteFinancialReturn(item.id, interadministrativoId)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">

      {!canEdit && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0f3ff] border border-[#0B3D91]/20 rounded-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span className="text-xs font-semibold text-[#0B3D91]">Solo lectura — su rol no tiene permisos de edición en esta sección</span>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border ${a.level === "warning" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
              <AlertTriangle size={14} className={a.level === "warning" ? "text-amber-500" : "text-blue-500"} />
              <p className={`text-xs font-medium ${a.level === "warning" ? "text-amber-800" : "text-blue-800"}`}>{a.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#002869]">Indicadores de Rendimientos</h3>
        {canEdit && groupsWithSources.length > 0 && (
          <button type="button" onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#0B3D91] text-white rounded-lg text-xs font-semibold hover:bg-[#002869]">
            <Plus size={14} />
            Registrar Rendimiento Financiero
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Rendimientos Acumulados" value={kpis.rendimientosAcumulados > 0 ? fmt(kpis.rendimientosAcumulados) : "—"} accent="text-[#0B3D91]" icon={<TrendingUp size={14} />} />
        <KpiCard label="Año Actual" value={kpis.rendimientosAnioActual > 0 ? fmt(kpis.rendimientosAnioActual) : "—"} icon={<Calendar size={14} />} />
        <KpiCard label="Mes Actual" value={kpis.rendimientosMesActual > 0 ? fmt(kpis.rendimientosMesActual) : "—"} />
        <KpiCard label="Pendiente por Devolver" value={kpis.pendientePorDevolver > 0 ? fmt(kpis.pendientePorDevolver) : "—"} accent="text-amber-600" icon={<DollarSign size={14} />} />
        <KpiCard label="Cantidad Registros" value={String(kpis.cantidadRegistros)} sub={kpis.registrosPendientes > 0 ? `${kpis.registrosPendientes} pendientes` : undefined} />
      </div>

      {resumenFin.length > 0 && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <button type="button" onClick={() => setShowResumen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f9f9ff]">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#0B3D91]" />
              <h3 className="text-sm font-bold text-[#002869]">Resumen por Financiador</h3>
            </div>
            {showResumen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showResumen && (
            <div className="overflow-x-auto border-t border-[#EAEAEA]">
              <table className="w-full text-left">
                <thead className="bg-[#f9f9ff]">
                  <tr>
                    {["Fuente", "Valor Acumulado", "Participación Promedio", "Distribuciones"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase text-[#747783]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {resumenFin.map((r) => (
                    <tr key={r.source_name} className="hover:bg-[#f9f9ff]">
                      <td className="px-5 py-3 text-sm font-semibold text-[#151c27]">{r.source_name}</td>
                      <td className="px-5 py-3 text-sm font-bold text-[#D9A520] tabular-nums">{fmt(r.valor_acumulado)}</td>
                      <td className="px-5 py-3 text-sm text-[#0B3D91]">{r.participacion_promedio.toFixed(2)}%</td>
                      <td className="px-5 py-3 text-sm text-[#747783]">{r.cantidad_distribuciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4 border-b border-[#EAEAEA] bg-[#f9f9ff]">
          <h3 className="text-sm font-bold text-[#002869]">Histórico de Rendimientos</h3>
        </div>
        {sortedReturns.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp size={32} className="mx-auto text-[#747783] opacity-40 mb-2" />
            <p className="text-sm font-semibold text-[#434652]">Sin rendimientos registrados</p>
            <p className="text-xs text-[#747783] mt-1">Registre rendimientos financieros para prorrateo automático entre financiadores.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[#EAEAEA]">
                <tr>
                  {["Mes", "Año", "Fecha", "Origen", "Valor Total", "Fuentes", "Estado", "Usuario", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase text-[#747783]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {sortedReturns.map((r) => {
                  const dists = getDistributionsForReturn(financialReturns.distributions, r.id)
                  return (
                    <tr key={r.id} className="hover:bg-[#f9f9ff]">
                      <td className="px-5 py-3 text-sm font-medium">{monthName(r.return_month)}</td>
                      <td className="px-5 py-3 text-sm">{r.return_year}</td>
                      <td className="px-5 py-3 text-sm text-[#747783]">{formatDateShort(r.return_date)}</td>
                      <td className="px-5 py-3 text-sm font-medium text-[#434652]">{groupNameMap.get(r.funding_group_id) ?? "—"}</td>
                      <td className="px-5 py-3 text-sm font-bold text-[#D9A520] tabular-nums">{fmt(r.gross_return_value)}</td>
                      <td className="px-5 py-3 text-sm text-center">{dists.length}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.repayment_status} /></td>
                      <td className="px-5 py-3 text-xs text-[#747783] max-w-[120px] truncate">{r.user_email ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button type="button" onClick={() => setDetail(r)}
                            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] text-[#747783] hover:text-[#0B3D91]" title="Ver detalle">
                            <Eye size={13} />
                          </button>
                          {canEdit && (
                            <button type="button" onClick={() => setModal({ mode: "edit", item: r })}
                              className="p-1.5 rounded-lg hover:bg-[#f0f3ff] text-[#747783] hover:text-[#0B3D91]">
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" onClick={() => handleDelete(r)} disabled={isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#747783] hover:text-red-600">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ReturnModal
          interadministrativoId={interadministrativoId}
          groups={groupsWithSources.length > 0 ? groupsWithSources : funding.groups}
          funding={funding}
          item={modal.item}
          onClose={() => setModal(null)}
        />
      )}

      {detail && (
        <ReturnDetailDrawer
          item={detail}
          groups={funding.groups}
          distributions={getDistributionsForReturn(financialReturns.distributions, detail.id)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
