"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_CONFIG, ESTADO_ORDER } from "../lib/lifecycle"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import {
  DEFAULT_PROJECT_DASHBOARD_FILTERS,
  applyDashboardProjectFilters,
  uniqueProjectYears,
} from "../lib/dashboard-utils"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"
import type { FuncionamientoDashboardKPIs, InteradminDashboardKPIs, DashboardAlerts, DashboardAlertItem } from "@/services/dashboard.service"
import { projectEntityLabel } from "../lib/project-utils"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"
import { NewDerivedContractModal } from "@/modules/contracts/components/new-derived-contract-modal"

// ── Color helpers ─────────────────────────────────────────────────────────────

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`
  return formatCOP(n)
}

// ── Estado badge ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoInteradministrativo }) {
  const cfg = ESTADO_CONFIG[estado]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bgClass} ${cfg.textClass}`}>
      {cfg.label}
    </span>
  )
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────

const DONUT_COLORS: Record<string, string> = {
  "EN EJECUCIÓN": "#0B3D91",
  "TERMINADO":    "#795900",
  "LIQUIDADO":    "#10B981",
}

function DonutChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const r = 15.915
  const circ = 2 * Math.PI * r

  let offset = 0
  const segments = data.map((d) => {
    const pct   = total > 0 ? (d.value / total) * 100 : 0
    const dash  = (pct / 100) * circ
    const seg   = { ...d, pct, dashArray: `${dash} ${circ}`, dashOffset: -offset }
    offset += dash
    return seg
  })

  return (
    <div className="relative w-48 h-48 mx-auto mb-6">
      <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="transparent" stroke="#F1F5F9" strokeWidth="3" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="18" cy="18" r={r}
            fill="transparent"
            stroke={s.color}
            strokeWidth="3"
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#002869]">
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
        </span>
        <span className="text-[10px] text-[#434652] uppercase font-bold tracking-tight">Total</span>
      </div>
    </div>
  )
}

// ── Bar chart (CSS) ───────────────────────────────────────────────────────────

function SecretariaBar({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="h-[280px] flex items-end justify-between gap-3 pt-4">
      {data.slice(0, 6).map((d) => {
        const pct = Math.round((d.value / max) * 100)
        const label = d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name
        return (
          <div key={d.name} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
            <div
              className="w-full bg-[#0B3D91] group-hover:bg-[#002869] transition-all rounded-t"
              style={{ height: `${pct}%` }}
            />
            <span className="text-[9px] text-[#434652] font-medium text-center leading-tight">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Alerta row ────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<DashboardAlertItem["tipo"], string> = {
  INTERADMIN:    "Interadmin",
  DERIVADO:      "Derivado",
  FUNCIONAMIENTO:"Funcionamiento",
}

function AlertRow({ item }: { item: DashboardAlertItem }) {
  const isExpired  = item.daysUntilExpiry < 0
  const isCritical = !isExpired && item.daysUntilExpiry <= 7

  const borderColor = isExpired ? "#EF4444" : isCritical ? "#F97316" : "#F59E0B"
  const bg          = isExpired ? "#FEF2F2" : isCritical ? "#FFF7ED" : "#FFFBEB"
  const labelColor  = isExpired ? "text-red-600" : isCritical ? "text-orange-600" : "text-amber-600"
  const level       = isExpired ? "VENCIDO" : isCritical ? "CRÍTICO" : "ADVERTENCIA"
  const timeText    = item.daysUntilExpiry < 0
    ? `Venció hace ${Math.abs(item.daysUntilExpiry)}d`
    : item.daysUntilExpiry === 0 ? "Vence hoy"
    : `Vence en ${item.daysUntilExpiry}d`

  const href =
    item.tipo === "INTERADMIN" && item.numericProjectId != null
      ? `/proyectos/${item.numericProjectId}`
      : item.tipo === "DERIVADO" ? "/contratacion/derivados" : "/funcionamiento"

  return (
    <Link
      href={href}
      className="block mb-2 rounded-r-lg px-3 py-2.5 hover:opacity-90 transition-opacity border-l-4"
      style={{ borderLeftColor: borderColor, backgroundColor: bg }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-[9px] font-bold uppercase tracking-wide ${labelColor}`}>{level}</span>
        <span className="text-[10px] text-[#434652]">{timeText}</span>
      </div>
      <p className="text-xs font-bold text-[#151c27] font-mono">{item.label}</p>
      {item.subtitle && <p className="text-[10px] text-[#434652] truncate mt-0.5">{item.subtitle}</p>}
      <div className="mt-1">
        <span className="text-[9px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          {TIPO_LABEL[item.tipo]}
        </span>
      </div>
    </Link>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectDashboardViewProps {
  projects: Interadministrativo[]
  entities: string[]
  fetchError?: string
  funcionamientoKPIs: FuncionamientoDashboardKPIs
  interadminKPIs: InteradminDashboardKPIs
  topActiveFuncContracts: FuncionamientoContrato[]
  alerts: DashboardAlerts
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ProjectDashboardView({
  projects,
  entities: _entities,
  fetchError,
  funcionamientoKPIs,
  interadminKPIs,
  topActiveFuncContracts,
  alerts,
}: ProjectDashboardViewProps) {
  const [year, setYear]                         = useState("all")
  const [showNewInteradmin, setShowNewInteradmin] = useState(false)
  const [showNewDerived, setShowNewDerived]       = useState(false)

  const filtered = useMemo(
    () => applyDashboardProjectFilters(projects, { ...DEFAULT_PROJECT_DASHBOARD_FILTERS, year }),
    [projects, year]
  )
  const years = useMemo(() => uniqueProjectYears(projects), [projects])

  // KPIs
  const totalContratos = interadminKPIs.totalContracts + interadminKPIs.totalDerivedContracts + funcionamientoKPIs.totalContracts
  const valorTotal     = interadminKPIs.totalValue + funcionamientoKPIs.totalValue
  const ejecPct        = funcionamientoKPIs.totalValue > 0
    ? Math.round(funcionamientoKPIs.totalPaidValue / funcionamientoKPIs.totalValue * 100)
    : 0
  const totalAlertas   = alerts.expired.length + alerts.expiringSoon.length
  const allAlerts      = [...alerts.expired, ...alerts.expiringSoon].slice(0, 6)

  // Donut data
  const donutData = ESTADO_ORDER
    .map((e) => ({
      name:  ESTADO_CONFIG[e].label,
      value: filtered.filter((p) => p.estado === e).length,
      color: DONUT_COLORS[e] ?? "#94a3b8",
    }))
    .filter((d) => d.value > 0)

  // Bar data (secretaría)
  const entityData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of filtered) {
      const e = p.secretaria ?? p.area_responsable ?? "—"
      counts.set(e, (counts.get(e) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }))
  }, [filtered])

  return (
    <div className="p-8 space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[24px] font-semibold leading-[32px] text-[#002869] tracking-tight">
            Dashboard Ejecutivo
          </h2>
          <p className="text-[#434652] mt-1">Resumen general de la contratación y ejecución financiera.</p>
        </div>
        <div className="flex items-center gap-3">
          {years.length > 0 && (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-white border border-[#EAEAEA] text-[#434652] px-4 py-2 rounded-lg text-sm hover:bg-[#f0f3ff] transition-colors"
            >
              <option value="all">Todos los años</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowNewInteradmin(true)}
            className="bg-[#0B3D91] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#002869] transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Reporte
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Error al cargar datos: {fetchError}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* KPI 1: Total Contratos */}
        <div className="bg-white p-6 rounded-xl border border-[#EAEAEA] hover:border-[#0B3D91]/20 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#434652] text-sm font-medium">Total Contratos</span>
            <span className="text-emerald-600 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded">+4.2%</span>
          </div>
          <span className="text-[32px] font-bold leading-[40px] text-[#002869]">
            {totalContratos.toLocaleString("es-CO")}
          </span>
          <div className="mt-4 h-8 flex items-end gap-1">
            {[40, 60, 45, 70, 55, 80, 100].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${i === 6 ? "bg-[#0B3D91]" : i === 5 ? "bg-[#0B3D91]/20" : "bg-[#f0f3ff] group-hover:bg-[#0B3D91]/10"} transition-colors`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 2: Valor Total */}
        <div className="bg-white p-6 rounded-xl border border-[#EAEAEA] hover:border-[#0B3D91]/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#434652] text-sm font-medium">Valor Contratado Total</span>
            <span className="text-[#434652] text-[11px] font-semibold bg-[#f0f3ff] px-2 py-0.5 rounded">M/cte</span>
          </div>
          <span className="text-[32px] font-bold leading-[40px] text-[#D9A520]">
            {fmtCompact(valorTotal)}
          </span>
          <div className="mt-4 space-y-2">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-[#434652]">Interadministrativos</span>
                <span className="text-[#D9A520]">{fmtCompact(interadminKPIs.totalValue)}</span>
              </div>
              <div className="w-full bg-[#f0f3ff] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#D9A520] h-full" style={{ width: valorTotal > 0 ? `${Math.round(interadminKPIs.totalValue / valorTotal * 100)}%` : "0%" }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-[#434652]">Funcionamiento</span>
                <span className="text-[#D9A520]">{fmtCompact(funcionamientoKPIs.totalValue)}</span>
              </div>
              <div className="w-full bg-[#f0f3ff] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#D9A520]/40 h-full" style={{ width: valorTotal > 0 ? `${Math.round(funcionamientoKPIs.totalValue / valorTotal * 100)}%` : "0%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Ejecución Financiera */}
        <div className="bg-white p-6 rounded-xl border border-[#EAEAEA] hover:border-[#0B3D91]/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#434652] text-sm font-medium">Ejecución Financiera</span>
            <span className="text-amber-600 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded">En progreso</span>
          </div>
          <span className="text-[32px] font-bold leading-[40px] text-[#D9A520]">{ejecPct}%</span>
          <div className="mt-4 w-full bg-[#f0f3ff] h-2 rounded-full overflow-hidden">
            <div className="bg-[#0B3D91] h-full transition-all" style={{ width: `${ejecPct}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-[#434652]">
            Pagado: {fmtCompact(funcionamientoKPIs.totalPaidValue)} de {fmtCompact(funcionamientoKPIs.totalValue)}
          </p>
        </div>

        {/* KPI 4: Alertas Activas */}
        <div className="bg-white p-6 rounded-xl border border-[#EAEAEA] hover:border-[#0B3D91]/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#434652] text-sm font-medium">Alertas Activas</span>
            {totalAlertas > 0 && (
              <span className="text-red-600 text-[11px] font-semibold bg-red-50 px-2 py-0.5 rounded">Prioridad Alta</span>
            )}
          </div>
          <span className="text-[32px] font-bold leading-[40px] text-red-500">
            {totalAlertas}
          </span>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#434652]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{alerts.expiringSoon.length} próximas a vencer &lt; 30 días</span>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Donut: estados */}
        <div className="bg-white p-8 rounded-xl border border-[#EAEAEA] lg:col-span-1">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[20px] font-semibold leading-[28px] text-[#002869]">Contratos por Estado</h3>
          </div>
          {donutData.length > 0 ? (
            <>
              <DonutChart data={donutData} total={filtered.length} />
              <div className="space-y-3">
                {donutData.map((d) => {
                  const pct = filtered.length > 0 ? Math.round(d.value / filtered.length * 100) : 0
                  return (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-sm text-[#434652]">{d.name}</span>
                      </div>
                      <span className="text-sm font-medium">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-[#434652]">Sin datos</p>
          )}
        </div>

        {/* Bar: por secretaría */}
        <div className="bg-white p-8 rounded-xl border border-[#EAEAEA] lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-[20px] font-semibold leading-[28px] text-[#002869]">Contratos por Secretaría</h3>
              <p className="text-[#434652] text-sm">Distribución por entidad contratante</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-[#0B3D91] rounded-full" />
                <span className="text-[11px] font-semibold text-[#434652] uppercase">Contratos</span>
              </div>
            </div>
          </div>
          {entityData.length > 0 ? (
            <SecretariaBar data={entityData} />
          ) : (
            <p className="py-12 text-center text-sm text-[#434652]">Sin datos</p>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

        {/* Col 1: Contratos recientes */}
        <div className="bg-white rounded-xl border border-[#EAEAEA]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
            <h4 className="text-[18px] font-semibold leading-[26px] text-[#151c27]">Log de Actividad</h4>
            <Link href="/proyectos" className="text-[#0B3D91] text-sm font-medium hover:underline">Ver todo</Link>
          </div>
          <div className="px-6 py-4 space-y-1">
            {filtered.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="flex items-start gap-3 py-2.5 hover:bg-[#f0f3ff] -mx-2 px-2 rounded-lg transition-colors"
              >
                <span className="w-2 h-2 mt-1.5 rounded-full bg-[#0B3D91] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#151c27] leading-snug">
                    <span className="text-[#0B3D91] font-bold font-mono">{p.id_contrato}</span>
                  </p>
                  <p className="text-[11px] text-[#434652] truncate">{p.objeto_contrato ?? projectEntityLabel(p)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <EstadoBadge estado={p.estado} />
                    <span className="text-[10px] text-[#434652]">{formatCOP(p.total_contrato ?? 0)}</span>
                  </div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-[#434652]">Sin contratos recientes</p>
            )}
          </div>
        </div>

        {/* Col 2: Alertas de Prioridad */}
        <div className="bg-white rounded-xl border border-[#EAEAEA]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
            <h4 className="text-[18px] font-semibold leading-[26px] text-[#151c27]">Alertas de Prioridad</h4>
            {totalAlertas > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600">
                {totalAlertas} Pendientes
              </span>
            )}
          </div>
          <div className="px-6 py-4">
            {allAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-[#434652]">Sin alertas activas</p>
              </div>
            ) : (
              <>
                {allAlerts.map((item) => (
                  <AlertRow key={`${item.tipo}-${item.id}`} item={item} />
                ))}
                {totalAlertas > 6 && (
                  <p className="text-[10px] text-[#434652] text-center pt-1">+{totalAlertas - 6} alertas más</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Col 3: Funcionamiento */}
        <div className="bg-white rounded-xl border border-[#EAEAEA]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
            <h4 className="text-[18px] font-semibold leading-[26px] text-[#151c27]">Últimos — Funcionamiento</h4>
            <Link href="/funcionamiento" className="text-teal-600 text-sm font-medium hover:underline">Ver todo</Link>
          </div>
          <div className="px-6 py-4 space-y-1">
            {/* Mini KPIs */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Total",        value: String(funcionamientoKPIs.totalContracts) },
                { label: "En ejecución", value: String(funcionamientoKPIs.activeContracts) },
                { label: "Valor total",  value: fmtCompact(funcionamientoKPIs.totalValue) },
                { label: "Próx. vencer", value: String(funcionamientoKPIs.soonExpiring) },
              ].map((k) => (
                <div key={k.label} className="bg-[#f0f3ff] rounded-lg p-2.5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#434652]">{k.label}</p>
                  <p className="text-sm font-bold text-[#151c27] tabular-nums mt-0.5">{k.value}</p>
                </div>
              ))}
            </div>
            {topActiveFuncContracts.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href="/funcionamiento"
                className="flex items-center gap-2 py-2 px-2 -mx-2 rounded-lg hover:bg-[#f0f3ff] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold font-mono text-teal-700">{c.numero_contrato}</p>
                  <p className="text-[10px] text-[#434652] truncate">{c.objeto_contrato ?? c.origen_hoja ?? "—"}</p>
                </div>
              </Link>
            ))}
            {topActiveFuncContracts.length === 0 && (
              <p className="py-4 text-center text-xs text-[#434652]">Sin contratos registrados</p>
            )}
          </div>
        </div>
      </div>

      {/* Botón nuevo derivado (oculto) */}
      <button type="button" className="hidden" onClick={() => setShowNewDerived(true)} />

      {/* Modales */}
      <NewInteradminProjectModal open={showNewInteradmin} onClose={() => setShowNewInteradmin(false)} />
      <NewDerivedContractModal  open={showNewDerived}   onClose={() => setShowNewDerived(false)} />
    </div>
  )
}
