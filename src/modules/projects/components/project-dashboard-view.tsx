"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  FolderKanban,
  TrendingUp,
  Wallet,
  GitBranch,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react"
import { KPICard } from "@/components/dashboard/KPICard"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_CONFIG, ESTADO_ORDER } from "../lib/lifecycle"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import {
  DEFAULT_PROJECT_DASHBOARD_FILTERS,
  applyDashboardProjectFilters,
  uniqueProjectYears,
} from "../lib/dashboard-utils"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"
import type { FuncionamientoDashboardKPIs, InteradminDashboardKPIs } from "@/services/dashboard.service"
import { projectEntityLabel } from "../lib/project-utils"
import { cn } from "@/lib/utils"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"
import { NewDerivedContractModal } from "@/modules/contracts/components/new-derived-contract-modal"

const CHART_COLORS = ["#345bab", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#64748B"]

interface ProjectDashboardViewProps {
  projects: Interadministrativo[]
  entities: string[]
  fetchError?: string
  funcionamientoKPIs: FuncionamientoDashboardKPIs
  interadminKPIs: InteradminDashboardKPIs
  topActiveFuncContracts: FuncionamientoContrato[]
}

function YearFilter({ year, years, onChange }: {
  year: string; years: number[]; onChange: (y: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">Año:</span>
      <select
        value={year}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-lg border border-border bg-white pl-2.5 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
      >
        <option value="all">Todos</option>
        {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

function SectionHeader({ title, subtitle, color, count, countLabel }: {
  title: string; subtitle: string; color: string; count: number; countLabel?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-1 h-10 rounded-full shrink-0", color)} />
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          {title}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {count} {countLabel}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

// ── KPI Cards Interadministrativos ────────────────────────────────────────────

function InteradminKPIs({ kpis }: { kpis: InteradminDashboardKPIs }) {
  const cards = [
    {
      label: "Contratos activos",
      value: kpis.activeContracts,
      formattedValue: String(kpis.activeContracts),
      isCurrency: false, change: 0,
      icon: FolderKanban,
      gradient: "from-indigo-500 to-blue-600",
      iconBg: "bg-indigo-50",
    },
    {
      label: "Valor total contratado",
      value: kpis.totalValue,
      formattedValue: formatCOP(kpis.totalValue),
      isCurrency: true, change: 0,
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Valor pendiente cobrar",
      value: kpis.pendingValue,
      formattedValue: formatCOP(kpis.pendingValue),
      isCurrency: true, change: 0,
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Cuota de administración",
      value: kpis.totalCuotaAdmin,
      formattedValue: formatCOP(kpis.totalCuotaAdmin),
      isCurrency: true, change: 0,
      icon: CreditCard,
      gradient: "from-cyan-500 to-blue-500",
      iconBg: "bg-cyan-50",
    },
    {
      label: "Contratos derivados",
      value: kpis.totalDerivedContracts,
      formattedValue: String(kpis.totalDerivedContracts),
      isCurrency: false, change: 0,
      icon: GitBranch,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-50",
    },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((kpi, i) => <KPICard key={kpi.label} {...kpi} index={i} />)}
    </div>
  )
}

// ── KPI Cards Funcionamiento ──────────────────────────────────────────────────

function FuncionamientoKPIs({ kpis }: { kpis: FuncionamientoDashboardKPIs }) {
  const cards = [
    {
      label: "Contratos registrados",
      value: kpis.totalContracts,
      formattedValue: String(kpis.totalContracts),
      isCurrency: false, change: 0,
      icon: Users,
      gradient: "from-slate-500 to-slate-700",
      iconBg: "bg-slate-50",
    },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {cards.map((kpi, i) => <KPICard key={kpi.label} {...kpi} index={i} />)}
    </div>
  )
}

// ── Badge de estado ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoInteradministrativo }) {
  const cfg = ESTADO_CONFIG[estado]
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
      cfg.bgClass, cfg.textClass
    )}>
      {cfg.label}
    </span>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ProjectDashboardView({
  projects,
  entities: _entities,
  fetchError,
  funcionamientoKPIs,
  interadminKPIs,
  topActiveFuncContracts,
}: ProjectDashboardViewProps) {
  const [year, setYear]                   = useState("all")
  const [showNewInteradmin, setShowNewInteradmin] = useState(false)
  const [showNewDerived, setShowNewDerived]       = useState(false)

  const filtered = useMemo(
    () => applyDashboardProjectFilters(projects, { ...DEFAULT_PROJECT_DASHBOARD_FILTERS, year }),
    [projects, year]
  )

  const years = useMemo(() => uniqueProjectYears(projects), [projects])

  // Gráfico por estado
  const estadoData = ESTADO_ORDER.map((estado) => ({
    name:  ESTADO_CONFIG[estado].label,
    value: filtered.filter((p) => p.estado === estado).length,
    color: ESTADO_CONFIG[estado].color,
  })).filter((d) => d.value > 0)

  // Gráfico por secretaría/entidad
  const entityData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of filtered) {
      const e = p.secretaria ?? p.area_responsable ?? "—"
      counts.set(e, (counts.get(e) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [filtered])

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#151c27] tracking-tight">
            Panel ejecutivo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Indicadores gerenciales — Interadministrativos y Funcionamiento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <YearFilter year={year} years={years} onChange={setYear} />
          <button
            type="button"
            onClick={() => setShowNewInteradmin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90 shadow-sm"
          >
            <Plus size={13} />
            Nuevo Contrato
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <Activity size={16} />
          Error al cargar datos: {fetchError}
        </div>
      )}

      {/* ─── INTERADMINISTRATIVOS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Contratos Interadministrativos"
            subtitle="Mandatos con secretarías — contratos y derivados"
            color="bg-[var(--corporate-blue)]"
            count={interadminKPIs.activeContracts}
            countLabel="activos"
          />
          <button
            type="button"
            onClick={() => setShowNewDerived(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[var(--corporate-blue)]/30"
          >
            <GitBranch size={12} />
            Nuevo Derivado
          </button>
        </div>

        <InteradminKPIs kpis={interadminKPIs} />

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="epuxua-card p-5">
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wide">
              Por estado
            </h4>
            {estadoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={estadoData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {estadoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>
            )}
          </div>

          <div className="epuxua-card p-5">
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wide">
              Por secretaría / entidad
            </h4>
            {entityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={entityData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {entityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>
            )}
          </div>
        </div>

        {/* Lista de contratos recientes */}
        <div className="epuxua-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              Contratos recientes
            </h4>
            <Link href="/proyectos" className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {filtered.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--corporate-blue)]">{p.id_contrato}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.objeto_contrato ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground/80 truncate">{projectEntityLabel(p)}</p>
                </div>
                <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-1">
                  <p className="text-xs font-medium">{formatCOP(p.total_contrato ?? 0)}</p>
                  <EstadoBadge estado={p.estado} />
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin contratos interadministrativos
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── FUNCIONAMIENTO ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Funcionamiento"
            subtitle="Contratos de apoyo operativo con recursos propios EPUXUA"
            color="bg-teal-500"
            count={funcionamientoKPIs.totalContracts}
            countLabel="registrados"
          />
          <Link
            href="/funcionamiento"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-teal-500/30"
          >
            <ArrowRight size={12} />
            Ver módulo
          </Link>
        </div>

        <FuncionamientoKPIs kpis={funcionamientoKPIs} />

        {/* Últimos contratos de funcionamiento */}
        <div className="epuxua-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              Contratos recientes
              <span className="ml-2 text-[10px] font-semibold text-muted-foreground normal-case">
                {funcionamientoKPIs.totalContracts} registrados en total
              </span>
            </h4>
            <Link href="/funcionamiento" className="text-xs font-semibold text-teal-600 hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="divide-y divide-border">
            {topActiveFuncContracts.map((c) => (
              <Link
                key={c.id}
                href="/funcionamiento"
                className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-teal-700 font-mono">{c.numero_contrato}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.origen_hoja}</p>
                </div>
              </Link>
            ))}
            {topActiveFuncContracts.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin contratos de funcionamiento registrados
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Modales */}
      <NewInteradminProjectModal open={showNewInteradmin} onClose={() => setShowNewInteradmin(false)} />
      <NewDerivedContractModal  open={showNewDerived}   onClose={() => setShowNewDerived(false)} />
    </div>
  )
}
