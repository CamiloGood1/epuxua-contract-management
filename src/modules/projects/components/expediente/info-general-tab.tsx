"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Clock, CheckCircle2, TrendingUp } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { formatDateShort } from "@/lib/date-format"
import { calcFacturacionKPIs } from "@/types/facturas"
import { getKanbanColumn } from "@/types/seguimiento"
import type { Interadministrativo, Contrato } from "@/types/database"
import type { ModificacionesData } from "@/types/modificaciones"
import type { PaymentMilestone } from "@/types/forma-pago"
import type { Factura } from "@/types/facturas"
import type { Tarea } from "@/types/seguimiento"
import type { FundingData } from "@/types/funding"
import { calcFundingKPIs, hasFundingInconsistencies, EMPTY_FUNDING } from "@/types/funding"
import type { FinancialReturnsData } from "@/types/financial-returns"
import { calcFinancialReturnsKPIs, EMPTY_FINANCIAL_RETURNS } from "@/types/financial-returns"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCOP(v: number | null | undefined) { return v == null ? "—" : formatCOP(v) }
function fmtDate(d: string | null | undefined) {
  return formatDateShort(d)
}
function fmt(v: string | null | undefined) { return v ?? "—" }

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000)
}

function daysFromToday(d: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((new Date(d + "T00:00:00").getTime() - today.getTime()) / 86400000)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "info" | "contratos" | "modificaciones" | "fuentes" | "forma_pago" | "facturacion" | "rendimientos" | "seguimiento"

type AlertItem = {
  level: "critical" | "warning" | "info"
  category: string
  description: string
  date?: string
  tabId?: TabId
}

type HealthScore = "VERDE" | "AMARILLO" | "ROJO"

type TimelineEvent = {
  date: string
  label: string
  sublabel?: string
  type: "suscripcion" | "inicio" | "adicion" | "prorroga" | "suspension" | "reinicio" | "terminacion" | "terminacion_actual"
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent = "text-[#151c27]", bg = "bg-white",
}: {
  label: string; value: string; sub?: string; accent?: string; bg?: string
}) {
  return (
    <div className={`${bg} border border-[#EAEAEA] rounded-xl p-4`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-2 leading-tight">{label}</p>
      <p className={`text-lg font-bold tabular-nums leading-tight ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#747783] mt-1">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-bold text-[#002869] uppercase tracking-wider">{title}</h3>
      {action}
    </div>
  )
}

function TabLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B3D91] hover:underline"
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  )
}

function ProgressBar({ pct, color = "bg-[#0B3D91]", thin }: { pct: number; color?: string; thin?: boolean }) {
  const h = thin ? "h-1.5" : "h-2.5"
  return (
    <div className={`w-full ${h} rounded-full bg-[#EAEAEA] overflow-hidden`}>
      <div className={`${h} rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

const TIMELINE_CFG: Record<TimelineEvent["type"], { dot: string; label: string; line: string }> = {
  suscripcion:       { dot: "bg-[#0B3D91] border-[#0B3D91]", label: "text-[#0B3D91]", line: "bg-[#0B3D91]" },
  inicio:            { dot: "bg-[#0B3D91] border-[#0B3D91]", label: "text-[#0B3D91]", line: "bg-[#0B3D91]" },
  adicion:           { dot: "bg-emerald-500 border-emerald-500", label: "text-emerald-700", line: "bg-emerald-200" },
  prorroga:          { dot: "bg-amber-500 border-amber-500", label: "text-amber-700", line: "bg-amber-200" },
  suspension:        { dot: "bg-yellow-500 border-yellow-500", label: "text-yellow-700", line: "bg-yellow-200" },
  reinicio:          { dot: "bg-blue-500 border-blue-500", label: "text-blue-700", line: "bg-blue-200" },
  terminacion:       { dot: "bg-[#EAEAEA] border-[#EAEAEA]", label: "text-[#747783]", line: "bg-[#EAEAEA]" },
  terminacion_actual:{ dot: "bg-[#002869] border-[#002869]", label: "text-[#002869]", line: "bg-[#002869]" },
}

function ContractTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  const today  = new Date().toISOString().split("T")[0]

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-start gap-0 min-w-max">
        {sorted.map((ev, i) => {
          const cfg      = TIMELINE_CFG[ev.type]
          const isPast   = ev.date <= today
          const isLast   = i === sorted.length - 1
          return (
            <div key={`${ev.type}-${i}`} className="flex items-start">
              <div className="flex flex-col items-center">
                {/* dot */}
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 ${cfg.dot} ${isPast ? "opacity-100" : "opacity-40"}`} />
                {/* label below */}
                <div className="mt-1.5 flex flex-col items-center max-w-[90px] text-center px-1">
                  <span className={`text-[10px] font-bold ${cfg.label} ${isPast ? "" : "opacity-50"} leading-tight`}>{ev.label}</span>
                  {ev.sublabel && <span className="text-[9px] text-[#747783] mt-0.5 leading-tight">{ev.sublabel}</span>}
                  <span className="text-[9px] text-[#747783] mt-0.5 tabular-nums">{fmtDate(ev.date)}</span>
                </div>
              </div>
              {/* connector line */}
              {!isLast && (
                <div className={`h-0.5 w-12 mt-2 flex-shrink-0 ${cfg.line} ${isPast ? "opacity-80" : "opacity-30"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Health badge ──────────────────────────────────────────────────────────────

function HealthBadge({ score }: { score: HealthScore }) {
  const cfg = {
    VERDE:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500", label: "Excelente" },
    AMARILLO: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-300",   dot: "bg-amber-500",   label: "Atención" },
    ROJO:     { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-300",      dot: "bg-red-500",     label: "Crítico" },
  }[score]

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <div className={`w-3 h-3 rounded-full ${cfg.dot} animate-pulse`} />
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783]">Salud</p>
        <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
      </div>
    </div>
  )
}

// ── Alert row ─────────────────────────────────────────────────────────────────

function AlertRow({ alert, onNavigate }: { alert: AlertItem; onNavigate: (tab: TabId) => void }) {
  const cfg = {
    critical: { bg: "bg-red-50 border-red-200",    dot: "bg-red-500",    text: "text-red-700",    icon: <AlertTriangle size={13} className="text-red-500 shrink-0" /> },
    warning:  { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500",  text: "text-amber-700",  icon: <Clock size={13} className="text-amber-500 shrink-0" /> },
    info:     { bg: "bg-blue-50 border-blue-200",   dot: "bg-blue-400",   text: "text-blue-700",   icon: <TrendingUp size={13} className="text-blue-500 shrink-0" /> },
  }[alert.level]

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${cfg.bg}`}>
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{alert.category}</span>
        <p className="text-xs text-[#434652] leading-snug mt-0.5">{alert.description}</p>
      </div>
      {alert.tabId && (
        <button onClick={() => onNavigate(alert.tabId!)} className="text-[10px] text-[#0B3D91] font-semibold hover:underline shrink-0">
          Ver →
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  project: Interadministrativo
  contratos: Contrato[]
  modificaciones: ModificacionesData
  hitos: PaymentMilestone[]
  facturas: Factura[]
  tareas: Tarea[]
  funding?: FundingData
  financialReturns?: FinancialReturnsData
  canEdit: boolean
  onTabChange: (tab: TabId) => void
  onEditClick: () => void
}

export function InfoGeneralTab({
  project: p,
  contratos,
  modificaciones,
  facturas,
  tareas,
  funding = EMPTY_FUNDING,
  financialReturns = EMPTY_FINANCIAL_RETURNS,
  canEdit,
  onTabChange,
  onEditClick,
}: Props) {
  const [showDatos, setShowDatos] = useState(false)

  const derivados = useMemo(() => contratos.filter(c => c.tipo_contrato === "DERIVADO"), [contratos])

  // ── Financial ──────────────────────────────────────────────────────────────

  const totalAdicionado = useMemo(
    () => modificaciones.adiciones.reduce((s, a) => s + (a.valor_total ?? 0), 0) || (p.adicion ?? 0),
    [modificaciones.adiciones, p.adicion],
  )

  const valorActual = useMemo(
    () => p.total_contrato ?? ((p.valor_inicial ?? 0) + totalAdicionado),
    [p.total_contrato, p.valor_inicial, totalAdicionado],
  )

  const valorBienes = useMemo(
    () => Math.max(0, valorActual - (p.total_cuota_admin ?? 0)),
    [valorActual, p.total_cuota_admin],
  )

  const facturacionKPIs = useMemo(() => calcFacturacionKPIs(facturas), [facturas])

  const fundingKPIs = useMemo(() => calcFundingKPIs(funding), [funding])
  const fundingInconsistent = useMemo(() => hasFundingInconsistencies(funding), [funding])
  const returnsKPIs = useMemo(() => calcFinancialReturnsKPIs(financialReturns), [financialReturns])

  const avanceFinanciero = useMemo(() => {
    const cuota = p.total_cuota_admin ?? 0
    if (cuota <= 0) return 0
    return Math.min(100, Math.round((facturacionKPIs.ingresadoTotal / cuota) * 100))
  }, [facturacionKPIs.ingresadoTotal, p.total_cuota_admin])

  // ── Dates & Days ───────────────────────────────────────────────────────────

  const fechaTerminActual = useMemo(() => {
    const last = modificaciones.prorrogas.at(-1)
    return last?.nueva_fecha_terminacion ?? p.fecha_terminacion ?? null
  }, [modificaciones.prorrogas, p.fecha_terminacion])

  const daysRemaining = useMemo(
    () => fechaTerminActual ? daysFromToday(fechaTerminActual) : null,
    [fechaTerminActual],
  )

  const diasSuspendidos = useMemo(
    () => modificaciones.suspensiones.reduce((total, s) => {
      if (!s.fin_suspension) return total
      return total + Math.max(0, daysBetween(s.inicio_suspension, s.fin_suspension))
    }, 0),
    [modificaciones.suspensiones],
  )

  // ── Modificaciones summary ─────────────────────────────────────────────────

  const modResumen = useMemo(() => {
    const { adiciones, prorrogas, suspensiones, reinicios, aclaratorios } = modificaciones
    return {
      nAdiciones:    adiciones.length,
      valorAdicionado: totalAdicionado,
      nProrrogas:    prorrogas.length,
      nSuspensiones: suspensiones.length,
      diasSuspendidos,
      nReinicios:    reinicios.length,
      nAclaratorios: aclaratorios.length,
    }
  }, [modificaciones, totalAdicionado, diasSuspendidos])

  // ── Contratos derivados summary ────────────────────────────────────────────

  const contResumen = useMemo(() => {
    const activos    = derivados.filter(c => c.estado === "EN EJECUCIÓN").length
    const terminados = derivados.filter(c => c.estado === "TERMINADO" || c.estado === "LIQUIDADO").length
    const valor      = derivados.reduce((s, c) => s + (c.valor_final ?? c.valor_inicial ?? 0), 0)
    return { total: derivados.length, activos, terminados, valor }
  }, [derivados])

  // ── Timeline events ────────────────────────────────────────────────────────

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const evs: TimelineEvent[] = []
    if (p.fecha_suscripcion) evs.push({ date: p.fecha_suscripcion, label: "Suscripción", type: "suscripcion" })
    if (p.fecha_inicio_ejecucion) evs.push({ date: p.fecha_inicio_ejecucion, label: "Inicio", type: "inicio" })

    modificaciones.adiciones.forEach((a, i) =>
      evs.push({ date: a.fecha_adicion, label: `Adición ${a.numero_adicion ?? i + 1}`, sublabel: a.valor_total ? fmtCOP(a.valor_total) : undefined, type: "adicion" })
    )
    modificaciones.prorrogas.forEach((pr, i) =>
      evs.push({ date: pr.fecha_suscripcion, label: `Prórroga ${pr.numero_prorroga ?? i + 1}`, sublabel: pr.plazo_prorroga ?? undefined, type: "prorroga" })
    )
    modificaciones.suspensiones.forEach((s, i) =>
      evs.push({ date: s.inicio_suspension, label: `Suspensión ${s.numero_suspension ?? i + 1}`, type: "suspension" })
    )
    modificaciones.reinicios.forEach((r, i) =>
      evs.push({ date: r.fecha_reinicio, label: `Reinicio ${r.numero_reinicio ?? i + 1}`, type: "reinicio" })
    )

    if (p.fecha_terminacion) evs.push({ date: p.fecha_terminacion, label: "Terminación Original", type: "terminacion" })
    if (fechaTerminActual && fechaTerminActual !== p.fecha_terminacion)
      evs.push({ date: fechaTerminActual, label: "Terminación Vigente", type: "terminacion_actual" })

    return evs
  }, [p, modificaciones, fechaTerminActual])

  // ── Alerts ─────────────────────────────────────────────────────────────────

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = []
    const today = new Date().toISOString().split("T")[0]

    if (daysRemaining !== null && daysRemaining < 15 && p.estado !== "TERMINADO" && p.estado !== "LIQUIDADO")
      list.push({ level: "critical", category: "Contrato", description: `Vence en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""}`, tabId: "info" })
    else if (daysRemaining !== null && daysRemaining < 30 && p.estado !== "TERMINADO" && p.estado !== "LIQUIDADO")
      list.push({ level: "warning",  category: "Contrato", description: `Próximo a vencer (${daysRemaining} días)`, tabId: "info" })

    const tareasVencidas = tareas.filter(t => t.status !== "COMPLETADA" && getKanbanColumn(t) === "VENCIDA")
    if (tareasVencidas.length > 0)
      list.push({ level: "critical", category: "Seguimiento", description: `${tareasVencidas.length} tarea${tareasVencidas.length > 1 ? "s" : ""} vencida${tareasVencidas.length > 1 ? "s" : ""}`, tabId: "seguimiento" })

    const tareasProximas = tareas.filter(t => t.status !== "COMPLETADA" && getKanbanColumn(t) === "PROXIMA_VENCER")
    if (tareasProximas.length > 0)
      list.push({ level: "warning", category: "Seguimiento", description: `${tareasProximas.length} tarea${tareasProximas.length > 1 ? "s" : ""} próxima${tareasProximas.length > 1 ? "s" : ""} a vencer (≤3 días)`, tabId: "seguimiento" })

    if (facturacionKPIs.facturasVencidas30d > 0)
      list.push({ level: "warning", category: "Facturación", description: `${facturacionKPIs.facturasVencidas30d} factura${facturacionKPIs.facturasVencidas30d > 1 ? "s" : ""} sin recaudar >30 días`, tabId: "facturacion" })

    if (fundingInconsistent)
      list.push({ level: "warning", category: "Fuentes de Financiación", description: "Hay grupos financieros cuya suma de fuentes no coincide con el valor del grupo.", tabId: "fuentes" })

    if (funding.sources.length === 0 && funding.groups.length > 0)
      list.push({ level: "info", category: "Fuentes de Financiación", description: "No hay fuentes de financiación registradas.", tabId: "fuentes" })

    if (returnsKPIs.registrosPendientes > 0)
      list.push({ level: "warning", category: "Rendimientos", description: `${returnsKPIs.registrosPendientes} rendimiento${returnsKPIs.registrosPendientes > 1 ? "s" : ""} pendiente${returnsKPIs.registrosPendientes > 1 ? "s" : ""} de devolución.`, tabId: "rendimientos" })

    if (returnsKPIs.pendientePorDevolver > 0 && returnsKPIs.registrosPendientes === 0)
      list.push({ level: "info", category: "Rendimientos", description: `Pendiente por devolver: ${fmtCOP(returnsKPIs.pendientePorDevolver)}`, tabId: "rendimientos" })

    const derivadosVencidos = derivados.filter(c =>
      c.fecha_terminacion && c.fecha_terminacion < today &&
      c.estado !== "TERMINADO" && c.estado !== "LIQUIDADO" && c.estado !== "TERMINADO ANTICIPADAMENTE"
    )
    if (derivadosVencidos.length > 0)
      list.push({ level: "warning", category: "Derivados", description: `${derivadosVencidos.length} contrato${derivadosVencidos.length > 1 ? "s" : ""} derivado${derivadosVencidos.length > 1 ? "s" : ""} vencido${derivadosVencidos.length > 1 ? "s" : ""}`, tabId: "contratos" })

    return list
  }, [daysRemaining, tareas, facturacionKPIs, derivados, p.estado, fundingInconsistent, funding.sources.length, funding.groups.length, returnsKPIs])

  // ── Health score ───────────────────────────────────────────────────────────

  const healthScore = useMemo<HealthScore>(() => {
    const criticals = alerts.filter(a => a.level === "critical").length
    const warnings  = alerts.filter(a => a.level === "warning").length
    if (criticals >= 2 || (daysRemaining !== null && daysRemaining < 0))  return "ROJO"
    if (criticals >= 1 || warnings >= 2 || (daysRemaining !== null && daysRemaining < 15)) return "ROJO"
    if (warnings >= 1  || (daysRemaining !== null && daysRemaining < 30)) return "AMARILLO"
    return "VERDE"
  }, [alerts, daysRemaining])

  // ── Executive Summary ──────────────────────────────────────────────────────

  const executiveSummary = useMemo(() => {
    const sentences: string[] = []

    const estadoLabel = p.estado.toLowerCase().replace("_", " ")
    const avFis = p.avance_fisico_pct != null ? `${p.avance_fisico_pct}%` : null
    sentences.push(
      `El contrato se encuentra actualmente ${estadoLabel}${avFis ? ` con un avance físico del ${avFis}` : ""}.`
    )

    if (totalAdicionado > 0 && modResumen.nAdiciones > 0)
      sentences.push(`Presenta ${modResumen.nAdiciones} adición${modResumen.nAdiciones > 1 ? "es" : ""} por valor total de ${fmtCOP(totalAdicionado)}.`)

    if (modResumen.nProrrogas > 0)
      sentences.push(`Se ha${modResumen.nProrrogas > 1 ? "n" : ""} registrado ${modResumen.nProrrogas} prórroga${modResumen.nProrrogas > 1 ? "s" : ""}.`)

    if (modResumen.diasSuspendidos > 0)
      sentences.push(`El contrato estuvo suspendido un total de ${modResumen.diasSuspendidos} días.`)

    const pctFac = p.total_cuota_admin && p.total_cuota_admin > 0
      ? Math.round((facturacionKPIs.facturadoTotal / p.total_cuota_admin) * 100)
      : null
    if (pctFac != null && facturas.length > 0)
      sentences.push(`Se ha facturado el ${pctFac}% del valor contractual y se ha recaudado el ${avanceFinanciero}%.`)

    const criticals = alerts.filter(a => a.level === "critical")
    const warnings  = alerts.filter(a => a.level === "warning")
    const totalAlerts = criticals.length + warnings.length
    if (totalAlerts > 0)
      sentences.push(`Actualmente existen ${totalAlerts} alerta${totalAlerts > 1 ? "s" : ""} activa${totalAlerts > 1 ? "s" : ""}: ${[...criticals, ...warnings].map(a => a.description.toLowerCase()).join("; ")}.`)
    else
      sentences.push("No hay alertas activas en este momento.")

    if (daysRemaining !== null)
      sentences.push(daysRemaining < 0
        ? `El contrato está vencido hace ${Math.abs(daysRemaining)} días.`
        : `Restan ${daysRemaining} días para la terminación vigente (${fmtDate(fechaTerminActual)}).`)

    return sentences.join(" ")
  }, [p, totalAdicionado, modResumen, facturacionKPIs, avanceFinanciero, facturas, alerts, daysRemaining, fechaTerminActual])

  // ── Day indicator ──────────────────────────────────────────────────────────

  const dayIndicator = useMemo(() => {
    if (daysRemaining === null) return null
    if (daysRemaining < 0)  return { color: "text-red-600",    bg: "bg-red-50 border-red-200",    label: `${Math.abs(daysRemaining)} días vencido` }
    if (daysRemaining <= 15) return { color: "text-red-600",    bg: "bg-red-50 border-red-200",    label: `${daysRemaining} días restantes` }
    if (daysRemaining <= 30) return { color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",label: `${daysRemaining} días restantes` }
    return { color: "text-[#0B3D91]", bg: "bg-[#0B3D91]/5 border-[#0B3D91]/20", label: `${daysRemaining} días restantes` }
  }, [daysRemaining])

  const avFis = p.avance_fisico_pct ?? 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ─── 1. Encabezado ejecutivo ─── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex flex-wrap items-start gap-4">
          {/* Info */}
          <div className="flex-1 min-w-[280px] space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {p.clase_contrato && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-[#0B3D91]/10 text-[#0B3D91] px-2.5 py-1 rounded-full">
                  {p.clase_contrato}
                </span>
              )}
              {p.categoria && (
                <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full">
                  {p.categoria}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mt-2">
              {[
                { l: "Secretaría",          v: p.secretaria },
                { l: "Área",                v: p.area_responsable },
                { l: "Supervisor",          v: p.supervision },
                { l: "Suscripción",         v: fmtDate(p.fecha_suscripcion) },
                { l: "Inicio",              v: fmtDate(p.fecha_inicio_ejecucion) },
                { l: "Terminación original", v: fmtDate(p.fecha_terminacion) },
              ].map(item => (
                <div key={item.l}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783]">{item.l}</p>
                  <p className="text-xs font-medium text-[#151c27] mt-0.5">{fmt(item.v)}</p>
                </div>
              ))}
            </div>

            {fechaTerminActual && fechaTerminActual !== p.fecha_terminacion && (
              <div className="mt-1 pt-2 border-t border-[#EAEAEA]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Terminación Vigente</p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">{fmtDate(fechaTerminActual)}</p>
              </div>
            )}
          </div>

          {/* Right: health + days + buttons */}
          <div className="flex flex-col gap-3 items-end">
            <HealthBadge score={healthScore} />
            {dayIndicator && (
              <div className={`px-4 py-2.5 rounded-xl border ${dayIndicator.bg} text-center min-w-[110px]`}>
                <p className={`text-2xl font-bold tabular-nums ${dayIndicator.color}`}>{Math.abs(daysRemaining!)}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#434652] mt-0.5">{daysRemaining! < 0 ? "días vencido" : "días restantes"}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              {canEdit && (
                <button
                  onClick={onEditClick}
                  className="flex items-center gap-1.5 h-9 px-3 bg-[#0B3D91] text-white rounded-lg text-xs font-semibold hover:bg-[#002869]"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
              )}
              {p.link_secop && (
                <a href={p.link_secop} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-9 px-3 border border-[#EAEAEA] bg-white rounded-lg text-xs font-semibold text-[#434652] hover:bg-[#f0f3ff]">
                  <ExternalLink size={12} />
                  SECOP II
                </a>
              )}
              {p.link_documentacion && (
                <a href={p.link_documentacion} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-9 px-3 border border-[#EAEAEA] bg-white rounded-lg text-xs font-semibold text-[#434652] hover:bg-[#f0f3ff]">
                  <ExternalLink size={12} />
                  Documentación
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. KPIs Financieros ─── */}
      <div>
        <SectionHeader title="Resumen Financiero" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Valor Original"      value={fmtCOP(p.valor_inicial)} />
          <KpiCard label="Total Adicionado"     value={totalAdicionado > 0 ? `+${fmtCOP(totalAdicionado)}` : "—"}  accent="text-emerald-600" />
          <KpiCard label="Valor Total Actual"   value={fmtCOP(valorActual)}    accent="text-[#0B3D91]" bg="bg-[#f0f3ff]" />
          <KpiCard label="Bienes y Servicios"   value={fmtCOP(valorBienes)} />
          <KpiCard label="Cuota de Gerencia"    value={fmtCOP(p.total_cuota_admin)} />
          <KpiCard
            label="Valor Facturado"
            value={facturacionKPIs.facturadoTotal > 0 ? fmtCOP(facturacionKPIs.facturadoTotal) : "—"}
            sub={p.total_cuota_admin ? `${Math.round(facturacionKPIs.facturadoTotal / p.total_cuota_admin * 100)}% de cuota` : undefined}
          />
          <KpiCard
            label="Valor Recaudado"
            value={facturacionKPIs.ingresadoTotal > 0 ? fmtCOP(facturacionKPIs.ingresadoTotal) : "—"}
            accent={avanceFinanciero >= 80 ? "text-emerald-600" : avanceFinanciero >= 50 ? "text-amber-600" : "text-[#151c27]"}
            sub={`${avanceFinanciero}% de avance financiero`}
          />
          <KpiCard
            label="Pendiente por Recaudar"
            value={facturacionKPIs.pendienteTotal > 0 ? fmtCOP(facturacionKPIs.pendienteTotal) : "—"}
            accent={facturacionKPIs.pendienteTotal > 0 ? "text-amber-600" : "text-emerald-600"}
          />
        </div>
      </div>

      {/* ─── 3. Estado + Alertas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">

        {/* Estado contractual */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader title="Estado Contractual" />
          <div className="space-y-4">
            {/* Avance Físico */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#434652]">Avance Físico</span>
                <span className="text-xs font-bold text-[#0B3D91]">{avFis}%</span>
              </div>
              <ProgressBar pct={avFis} color="bg-[#0B3D91]" />
            </div>

            {/* Avance Financiero */}
            {facturas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#434652]">Avance Financiero (Recaudo)</span>
                  <span className="text-xs font-bold text-emerald-600">{avanceFinanciero}%</span>
                </div>
                <ProgressBar
                  pct={avanceFinanciero}
                  color={avanceFinanciero >= 80 ? "bg-emerald-500" : avanceFinanciero >= 50 ? "bg-amber-500" : "bg-red-400"}
                />
              </div>
            )}

            {/* Derivados activos */}
            {contResumen.total > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#434652]">Derivados activos</span>
                  <span className="text-xs font-bold text-[#10B981]">{contResumen.activos} / {contResumen.total}</span>
                </div>
                <ProgressBar pct={contResumen.total > 0 ? (contResumen.activos / contResumen.total) * 100 : 0} color="bg-[#10B981]" thin />
              </div>
            )}

            {/* Key dates grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAEAEA]">
              {[
                { l: "Inicio",                v: fmtDate(p.fecha_inicio_ejecucion) },
                { l: "Terminación Vigente",   v: fmtDate(fechaTerminActual), accent: fechaTerminActual !== p.fecha_terminacion ? "text-amber-700 font-semibold" : "" },
                { l: "% Cuota Gerencia",      v: p.pct_cuota_gerencia != null ? `${p.pct_cuota_gerencia}%` : "—" },
                { l: "Plazo Inicial",         v: fmt(p.plazo_ejecucion_inicial) },
              ].map(item => (
                <div key={item.l}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783]">{item.l}</p>
                  <p className={`text-xs mt-0.5 ${item.accent ?? "text-[#151c27] font-medium"}`}>{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader
            title={`Alertas del Proyecto ${alerts.length > 0 ? `(${alerts.length})` : ""}`}
          />
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">Sin alertas activas — proyecto en buen estado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => <AlertRow key={i} alert={a} onNavigate={onTabChange} />)}
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. Cronología ─── */}
      {timelineEvents.length > 0 && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader title="Cronología Contractual" />
          <ContractTimeline events={timelineEvents} />
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-[#EAEAEA]">
            {[
              { dot: "bg-[#0B3D91]", label: "Hitos principales" },
              { dot: "bg-emerald-500", label: "Adiciones" },
              { dot: "bg-amber-500", label: "Prórrogas" },
              { dot: "bg-yellow-500", label: "Suspensiones" },
              { dot: "bg-blue-500", label: "Reinicios" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                <span className="text-[10px] text-[#747783]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 5+6. Modificaciones + Derivados summary ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Fuentes de Financiación */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader
            title="Fuentes de Financiación"
            action={<TabLink label="Ver Fuentes" onClick={() => onTabChange("fuentes")} />}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Total Fuentes",           v: fundingKPIs.totalFuentes > 0 ? String(fundingKPIs.totalFuentes) : "—", accent: "text-[#0B3D91]" },
              { l: "Valor Financiado",        v: fundingKPIs.valorFinanciadoTotal > 0 ? fmtCOP(fundingKPIs.valorFinanciadoTotal) : "—", accent: "text-[#D9A520]" },
              { l: "Principal Financiador",   v: fundingKPIs.principalFinanciador ?? "—", sub: fundingKPIs.principalFinanciador ? `${fundingKPIs.participacionPrincipal.toFixed(1)}% participación` : undefined, accent: "text-emerald-700" },
              { l: "Participación Principal", v: fundingKPIs.participacionPrincipal > 0 ? `${fundingKPIs.participacionPrincipal.toFixed(1)}%` : "—", sub: fundingKPIs.valorPrincipal > 0 ? fmtCOP(fundingKPIs.valorPrincipal) : undefined, accent: "text-violet-700" },
            ].map(item => (
              <div key={item.l} className="bg-[#f9f9ff] rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1">{item.l}</p>
                <p className={`text-lg font-bold tabular-nums ${item.accent}`}>{item.v}</p>
                {item.sub && <p className="text-[10px] text-[#747783] mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
          {fundingInconsistent && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-700 font-medium">Inconsistencias en la composición de fuentes</p>
            </div>
          )}
        </div>

        {/* Rendimientos Financieros */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader
            title="Rendimientos Financieros"
            action={<TabLink label="Ver Rendimientos" onClick={() => onTabChange("rendimientos")} />}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Rendimientos Generados", v: returnsKPIs.rendimientosAcumulados > 0 ? fmtCOP(returnsKPIs.rendimientosAcumulados) : "—", accent: "text-[#0B3D91]" },
              { l: "Rendimientos Devueltos", v: returnsKPIs.rendimientosDevueltos > 0 ? fmtCOP(returnsKPIs.rendimientosDevueltos) : "—", accent: "text-emerald-700" },
              { l: "Rendimientos Pendientes", v: returnsKPIs.pendientePorDevolver > 0 ? fmtCOP(returnsKPIs.pendientePorDevolver) : "—", accent: "text-amber-600" },
              { l: "Principal Beneficiario", v: returnsKPIs.principalBeneficiario ?? "—", sub: returnsKPIs.valorPrincipalBeneficiario > 0 ? fmtCOP(returnsKPIs.valorPrincipalBeneficiario) : undefined, accent: "text-violet-700" },
            ].map(item => (
              <div key={item.l} className="bg-[#f9f9ff] rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1">{item.l}</p>
                <p className={`text-lg font-bold tabular-nums ${item.accent}`}>{item.v}</p>
                {item.sub && <p className="text-[10px] text-[#747783] mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Modificaciones */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader
            title="Modificaciones Contractuales"
            action={<TabLink label="Ver detalle" onClick={() => onTabChange("modificaciones")} />}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Adiciones",     v: modResumen.nAdiciones,    sub: modResumen.nAdiciones > 0 ? fmtCOP(modResumen.valorAdicionado) : undefined, accent: "text-emerald-700" },
              { l: "Prórrogas",     v: modResumen.nProrrogas,    accent: "text-amber-700" },
              { l: "Suspensiones",  v: modResumen.nSuspensiones, sub: modResumen.diasSuspendidos > 0 ? `${modResumen.diasSuspendidos} días` : undefined, accent: "text-yellow-700" },
              { l: "Reinicios",     v: modResumen.nReinicios,    accent: "text-blue-700" },
              { l: "Aclaratorios",  v: modResumen.nAclaratorios, accent: "text-violet-700" },
              { l: "Total",         v: modResumen.nAdiciones + modResumen.nProrrogas + modResumen.nSuspensiones + modResumen.nReinicios + modResumen.nAclaratorios, accent: "text-[#002869]" },
            ].map(item => (
              <div key={item.l} className="bg-[#f9f9ff] rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1">{item.l}</p>
                <p className={`text-xl font-bold tabular-nums ${item.accent}`}>{item.v}</p>
                {item.sub && <p className="text-[10px] text-[#747783] mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Contratos Derivados */}
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <SectionHeader
            title="Contratos Derivados"
            action={<TabLink label="Ver detalle" onClick={() => onTabChange("contratos")} />}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Total Derivados",  v: contResumen.total,      accent: "text-[#0B3D91]" },
              { l: "En Ejecución",     v: contResumen.activos,    accent: "text-emerald-600" },
              { l: "Terminados",       v: contResumen.terminados, accent: "text-[#747783]" },
              { l: "Valor Total",      v: fmtCOP(contResumen.valor), accent: "text-[#D9A520]", full: true },
            ].map(item => (
              <div key={item.l} className={`bg-[#f9f9ff] rounded-lg px-3 py-2.5 ${item.full ? "col-span-2" : ""}`}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1">{item.l}</p>
                <p className={`text-xl font-bold tabular-nums ${item.accent}`}>{item.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 7. Resumen Ejecutivo ─── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <SectionHeader title="Resumen Ejecutivo" />
        <div className="flex gap-4 items-start">
          <HealthBadge score={healthScore} />
          <div className="flex-1">
            <p className="text-sm text-[#434652] leading-relaxed">{executiveSummary}</p>
            {p.observaciones && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed"><strong>Observación:</strong> {p.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 8. Datos Generales Completos (colapsable) ─── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <button
          type="button"
          onClick={() => setShowDatos(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f9f9ff] transition-colors"
        >
          <span className="text-[13px] font-bold text-[#002869] uppercase tracking-wider">Datos Generales Completos</span>
          {showDatos ? <ChevronUp size={16} className="text-[#747783]" /> : <ChevronDown size={16} className="text-[#747783]" />}
        </button>

        {showDatos && (
          <div className="px-5 pb-5 border-t border-[#EAEAEA]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 mt-4">
              {[
                { l: "N° Contrato",              v: p.id_contrato,           mono: true },
                { l: "Modalidad de selección",   v: p.modalidad_seleccion },
                { l: "Clase de contrato",         v: p.clase_contrato },
                { l: "Categoría",                v: p.categoria },
                { l: "Secretaría",               v: p.secretaria },
                { l: "Área responsable",          v: p.area_responsable },
                { l: "Supervisor",               v: p.supervision },
                { l: "Estado",                   v: p.estado },
                { l: "Plazo inicial",            v: p.plazo_ejecucion_inicial },
                { l: "Fecha suscripción",        v: fmtDate(p.fecha_suscripcion) },
                { l: "Fecha inicio",             v: fmtDate(p.fecha_inicio_ejecucion) },
                { l: "Fecha terminación inicial",v: fmtDate(p.fecha_terminacion) },
                { l: "% Cuota de gerencia",      v: p.pct_cuota_gerencia != null ? `${p.pct_cuota_gerencia}%` : null },
                { l: "Valor inicial",            v: fmtCOP(p.valor_inicial),           mono: true },
                { l: "Adición",                  v: p.adicion ? fmtCOP(p.adicion) : null, mono: true },
                { l: "Total contrato",           v: fmtCOP(p.total_contrato),          mono: true },
                { l: "Cuota admin inicial",      v: fmtCOP(p.cuota_admin_inicial),     mono: true },
                { l: "Total cuota admin",        v: fmtCOP(p.total_cuota_admin),       mono: true },
                { l: "Pendiente por cobrar",     v: fmtCOP(p.valor_pendiente_cobrar), mono: true },
                { l: "Vigencias futuras",        v: fmtCOP(p.vigencias_futuras),       mono: true },
              ].map(f => (
                <div key={f.l}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#747783] mb-0.5">{f.l}</p>
                  <p className={`text-sm ${!f.v ? "text-[#EAEAEA]" : "text-[#151c27] font-medium"} ${f.mono ? "font-mono" : ""}`}>{f.v ?? "—"}</p>
                </div>
              ))}
            </div>

            {/* Links */}
            {(p.link_secop || p.link_documentacion) && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-[#EAEAEA]">
                {p.link_secop && (
                  <a href={p.link_secop} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#0B3D91] hover:underline font-semibold">
                    <ExternalLink size={12} />
                    SECOP II
                  </a>
                )}
                {p.link_documentacion && (
                  <a href={p.link_documentacion} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#0B3D91] hover:underline font-semibold">
                    <ExternalLink size={12} />
                    Documentación
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
