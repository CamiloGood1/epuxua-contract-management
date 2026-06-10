"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import {
  FolderKanban, Wallet, TrendingUp, Bell, Plus, GitBranch,
  AlertTriangle, Clock, ArrowRight, Activity,
  ChevronRight,
} from "lucide-react"
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
import { cn } from "@/lib/utils"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"
import { NewDerivedContractModal } from "@/modules/contracts/components/new-derived-contract-modal"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  return formatCOP(n)
}

function today(): string {
  return new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

// ── KPI Card ejecutivo ────────────────────────────────────────────────────────

interface ExecKPIProps {
  label: string
  value: string
  sub?: string
  accent?: string
  badge?: { text: string; color: string }
  icon: React.ElementType
  iconColor: string
}

function ExecKPI({ label, value, sub, badge, icon: Icon, iconColor }: ExecKPIProps) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        {badge && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badge.color)}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-foreground tabular-nums leading-none">{value}</p>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor)}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Badge estado interadmin ───────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoInteradministrativo }) {
  const cfg = ESTADO_CONFIG[estado]
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold", cfg.bgClass, cfg.textClass)}>
      {cfg.label}
    </span>
  )
}

// ── Alertas ───────────────────────────────────────────────────────────────────

const TIPO_COLOR: Record<DashboardAlertItem["tipo"], string> = {
  INTERADMIN:    "bg-blue-100 text-blue-700",
  DERIVADO:      "bg-violet-100 text-violet-700",
  FUNCIONAMIENTO:"bg-teal-100 text-teal-700",
}
const TIPO_LABEL: Record<DashboardAlertItem["tipo"], string> = {
  INTERADMIN:    "Interadmin",
  DERIVADO:      "Derivado",
  FUNCIONAMIENTO:"Funcionamiento",
}

function AlertPriorityRow({ item }: { item: DashboardAlertItem }) {
  const isExpired = item.daysUntilExpiry < 0
  const isCritical = item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7
  const href =
    item.tipo === "INTERADMIN" && item.numericProjectId != null
      ? `/proyectos/${item.numericProjectId}`
      : item.tipo === "DERIVADO" ? "/contratacion/derivados" : "/funcionamiento"

  return (
    <Link href={href} className="block border-l-4 rounded-r-xl px-3 py-2.5 mb-2 hover:opacity-90 transition-opacity"
      style={{ borderLeftColor: isExpired ? "#EF4444" : isCritical ? "#F97316" : "#F59E0B", backgroundColor: isExpired ? "#FEF2F2" : isCritical ? "#FFF7ED" : "#FFFBEB" }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className={cn("text-[9px] font-bold uppercase tracking-wide", isExpired ? "text-red-600" : isCritical ? "text-orange-600" : "text-amber-600")}>
          {isExpired ? "VENCIDO" : isCritical ? "CRÍTICO" : "ADVERTENCIA"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {item.daysUntilExpiry < 0
            ? `Venció hace ${Math.abs(item.daysUntilExpiry)}d`
            : item.daysUntilExpiry === 0 ? "Vence hoy"
            : `Vence en ${item.daysUntilExpiry}d`}
        </span>
      </div>
      <p className="text-xs font-bold text-foreground font-mono leading-tight">{item.label}</p>
      {item.subtitle && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.subtitle}</p>}
      <div className="mt-1">
        <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", TIPO_COLOR[item.tipo])}>
          {TIPO_LABEL[item.tipo]}
        </span>
      </div>
    </Link>
  )
}

// ── Donut personalizado ───────────────────────────────────────────────────────

const DONUT_COLORS: Record<string, string> = {
  "EN EJECUCIÓN": "#345bab",
  "TERMINADO":    "#78716c",
  "LIQUIDADO":    "#10B981",
}

// ── Tooltip donut ─────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} contratos</p>
    </div>
  )
}

// ── Year filter ───────────────────────────────────────────────────────────────

function YearFilter({ year, years, onChange }: { year: string; years: number[]; onChange: (y: string) => void }) {
  return (
    <select
      value={year}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-border bg-white pl-2.5 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20 appearance-none"
    >
      <option value="all">Todos los años</option>
      {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
    </select>
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
  const [year, setYear] = useState("all")
  const [showNewInteradmin, setShowNewInteradmin] = useState(false)
  const [showNewDerived, setShowNewDerived] = useState(false)

  const filtered = useMemo(
    () => applyDashboardProjectFilters(projects, { ...DEFAULT_PROJECT_DASHBOARD_FILTERS, year }),
    [projects, year]
  )
  const years = useMemo(() => uniqueProjectYears(projects), [projects])

  // KPIs ejecutivos
  const totalContratos = interadminKPIs.totalContracts + interadminKPIs.totalDerivedContracts + funcionamientoKPIs.totalContracts
  const valorTotal = interadminKPIs.totalValue + funcionamientoKPIs.totalValue
  const ejecPct = funcionamientoKPIs.totalValue > 0
    ? Math.round(funcionamientoKPIs.totalPaidValue / funcionamientoKPIs.totalValue * 100)
    : 0
  const totalAlertas = alerts.expired.length + alerts.expiringSoon.length

  // Donut estados
  const donutData = ESTADO_ORDER
    .map((estado) => ({
      name: ESTADO_CONFIG[estado].label,
      value: filtered.filter((p) => p.estado === estado).length,
      color: DONUT_COLORS[estado] ?? "#94a3b8",
    }))
    .filter((d) => d.value > 0)

  // Bar por secretaría
  const entityData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of filtered) {
      const e = p.secretaria ?? p.area_responsable ?? "—"
      counts.set(e, (counts.get(e) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, value }))
  }, [filtered])

  const allAlerts = [...alerts.expired, ...alerts.expiringSoon].slice(0, 6)

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#151c27] tracking-tight">Dashboard Ejecutivo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen general de la contratación y ejecución financiera.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 bg-white">
            <Clock size={12} />
            <span>Enero 2024 – {today()}</span>
          </div>
          <YearFilter year={year} years={years} onChange={setYear} />
          <button
            type="button"
            onClick={() => setShowNewInteradmin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90 shadow-sm"
          >
            <Plus size={13} />
            Nuevo Contrato
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <Activity size={16} /> Error al cargar datos: {fetchError}
        </div>
      )}

      {/* ── KPIs ejecutivos ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ExecKPI
          label="Total Contratos"
          value={totalContratos.toLocaleString("es-CO")}
          sub={`${interadminKPIs.activeContracts} interadmin activos · ${funcionamientoKPIs.activeContracts} func. en ejecución`}
          icon={FolderKanban}
          iconColor="bg-[var(--corporate-blue)]"
          badge={{ text: "+4.2%", color: "bg-emerald-100 text-emerald-700" }}
        />
        <ExecKPI
          label="Valor Contratado Total"
          value={fmtCompact(valorTotal)}
          sub={`Interadmin: ${fmtCompact(interadminKPIs.totalValue)}`}
          icon={Wallet}
          iconColor="bg-emerald-500"
          badge={{ text: "M/cte", color: "bg-slate-100 text-slate-600" }}
        />
        <ExecKPI
          label="Ejecución Financiera"
          value={`${ejecPct}%`}
          sub={`Pagado: ${fmtCompact(funcionamientoKPIs.totalPaidValue)} de ${fmtCompact(funcionamientoKPIs.totalValue)}`}
          icon={TrendingUp}
          iconColor="bg-violet-500"
          badge={{ text: ejecPct >= 70 ? "En progreso" : "Por iniciar", color: ejecPct >= 70 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600" }}
        />
        <ExecKPI
          label="Alertas Activas"
          value={String(totalAlertas)}
          sub={`${alerts.expired.length} vencidos · ${alerts.expiringSoon.length} próximos a vencer < 30d`}
          icon={Bell}
          iconColor={totalAlertas > 0 ? "bg-red-500" : "bg-slate-400"}
          badge={totalAlertas > 0 ? { text: "Prioridad Alta", color: "bg-red-100 text-red-600" } : undefined}
        />
      </div>

      {/* ── Gráficas ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Donut: estados */}
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Contratos por Estado</h4>
            <span className="text-[10px] text-muted-foreground">{filtered.length} total</span>
          </div>
          {donutData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {donutData.map((d) => {
                  const pct = filtered.length > 0 ? Math.round(d.value / filtered.length * 100) : 0
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground truncate">{d.name}</span>
                          <span className="font-semibold tabular-nums ml-2">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
        </div>

        {/* Bar: por secretaría */}
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Contratos por Secretaría</h4>
          </div>
          {entityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={entityData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} axisLine={false} tickLine={false} />
                <ReTooltip />
                <Bar dataKey="value" fill="#345bab" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
        </div>
      </div>

      {/* ── Bottom row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Col 1: Contratos recientes interadmin */}
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Contratos Recientes</h4>
            <Link href="/proyectos" className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline flex items-center gap-0.5">
              Ver todo <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {filtered.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/proyectos/${p.id}`}
                className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-muted/40 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--corporate-blue)] font-mono group-hover:underline">{p.id_contrato}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{p.objeto_contrato ?? projectEntityLabel(p)}</p>
                </div>
                <div className="text-right shrink-0 ml-2 flex flex-col items-end gap-1">
                  <p className="text-[10px] font-semibold tabular-nums">{formatCOP(p.total_contrato ?? 0)}</p>
                  <EstadoBadge estado={p.estado} />
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin contratos</p>
            )}
          </div>
        </div>

        {/* Col 2: Alertas de prioridad */}
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Alertas de Prioridad</h4>
            {totalAlertas > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600">
                {totalAlertas} Pendientes
              </span>
            )}
          </div>
          {allAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell size={28} className="text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Sin alertas activas</p>
            </div>
          ) : (
            <div>
              {allAlerts.map((item) => (
                <AlertPriorityRow key={`${item.tipo}-${item.id}`} item={item} />
              ))}
              {totalAlertas > 6 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{totalAlertas - 6} alertas más
                </p>
              )}
            </div>
          )}
        </div>

        {/* Col 3: Funcionamiento recientes */}
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Funcionamiento</h4>
            <Link href="/funcionamiento" className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-0.5">
              Ver todo <ChevronRight size={12} />
            </Link>
          </div>
          {/* Mini KPIs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Total", value: String(funcionamientoKPIs.totalContracts) },
              { label: "En ejecución", value: String(funcionamientoKPIs.activeContracts) },
              { label: "Valor total", value: fmtCompact(funcionamientoKPIs.totalValue) },
              { label: "Próx. a vencer", value: String(funcionamientoKPIs.soonExpiring) },
            ].map((k) => (
              <div key={k.label} className="bg-muted/30 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{k.label}</p>
                <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">{k.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {topActiveFuncContracts.slice(0, 4).map((c) => (
              <Link key={c.id} href="/funcionamiento"
                className="flex items-center gap-2 py-2 px-2 -mx-2 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <GitBranch size={12} className="text-teal-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold font-mono text-teal-700">{c.numero_contrato}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.objeto_contrato ?? c.origen_hoja ?? "—"}</p>
                </div>
              </Link>
            ))}
            {topActiveFuncContracts.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Sin contratos registrados</p>
            )}
          </div>
          <Link href="/funcionamiento"
            className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
          >
            <ArrowRight size={12} /> Ir al módulo Funcionamiento
          </Link>
        </div>
      </div>

      {/* Modales */}
      <NewInteradminProjectModal open={showNewInteradmin} onClose={() => setShowNewInteradmin(false)} />
      <NewDerivedContractModal  open={showNewDerived}   onClose={() => setShowNewDerived(false)} />
    </div>
  )
}
