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
  AlertTriangle,
  GitBranch,
  Users,
  CreditCard,
  CheckCircle2,
  Plus,
  Clock,
} from "lucide-react"
import { KPICard } from "@/components/dashboard/KPICard"
import { formatCOP } from "@/modules/contracts/lib/status"
import { LIFECYCLE_CONFIG, LIFECYCLE_ORDER } from "../lib/lifecycle"
import { projectTypeLabel } from "../lib/project-type"
import type { ProjectDetail } from "@/types/project"
import {
  DEFAULT_PROJECT_DASHBOARD_FILTERS,
  applyDashboardProjectFilters,
  computeSectionMetrics,
  computeFuncionamientoContractMetrics,
  uniqueProjectYears,
  type SectionMetrics,
} from "../lib/dashboard-utils"
import type { FuncionamientoContract } from "@/services/funcionamiento.service"
import { projectEntityLabel } from "../lib/project-utils"
import { cn } from "@/lib/utils"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"
import { NewDerivedContractModal } from "@/modules/contracts/components/new-derived-contract-modal"
import { NewFuncionamientoContractModal } from "@/modules/funcionamiento/components/new-funcionamiento-contract-modal"

const CHART_COLORS = ["#345bab", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#64748B"]

interface ProjectDashboardViewProps {
  projects: ProjectDetail[]
  entities: string[]
  fetchError?: string
  funcionamientoActiveContracts?: FuncionamientoContract[]
}

function YearFilter({
  year,
  years,
  onChange,
}: {
  year: string
  years: number[]
  onChange: (y: string) => void
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
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  color,
  count,
}: {
  title: string
  subtitle: string
  color: string
  count: number
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-1 h-10 rounded-full shrink-0", color)} />
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          {title}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {count}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

function InteradminKPIs({ metrics }: { metrics: SectionMetrics }) {
  const cards = [
    {
      label: "Proyectos activos",
      value: metrics.activeProjects,
      formattedValue: String(metrics.activeProjects),
      isCurrency: false,
      change: 0,
      icon: FolderKanban,
      gradient: "from-indigo-500 to-blue-600",
      iconBg: "bg-indigo-50",
    },
    {
      label: "Valor total contratado",
      value: metrics.totalValue,
      formattedValue: formatCOP(metrics.totalValue),
      isCurrency: true,
      change: 0,
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Valor ejecutado",
      value: metrics.executedValue,
      formattedValue: formatCOP(metrics.executedValue),
      isCurrency: true,
      change: 0,
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Valor pagado",
      value: metrics.paidValue,
      formattedValue: formatCOP(metrics.paidValue),
      isCurrency: true,
      change: 0,
      icon: CreditCard,
      gradient: "from-cyan-500 to-blue-500",
      iconBg: "bg-cyan-50",
    },
    {
      label: "Contratos derivados",
      value: metrics.derivedCount,
      formattedValue: String(metrics.derivedCount),
      isCurrency: false,
      change: 0,
      icon: GitBranch,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-50",
    },
    {
      label: "Proyectos con alertas",
      value: metrics.alertsCount,
      formattedValue: String(metrics.alertsCount),
      isCurrency: false,
      change: 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      iconBg: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((kpi, i) => (
        <KPICard key={kpi.label} {...kpi} index={i} />
      ))}
    </div>
  )
}

function FuncionamientoKPIs({ metrics }: { metrics: SectionMetrics }) {
  const cards = [
    {
      label: "Contratos activos",
      value: metrics.activeProjects,
      formattedValue: String(metrics.activeProjects),
      isCurrency: false,
      change: 0,
      icon: Users,
      gradient: "from-slate-500 to-slate-700",
      iconBg: "bg-slate-50",
    },
    {
      label: "Valor total contratado",
      value: metrics.totalValue,
      formattedValue: formatCOP(metrics.totalValue),
      isCurrency: true,
      change: 0,
      icon: Wallet,
      gradient: "from-teal-500 to-emerald-600",
      iconBg: "bg-teal-50",
    },
    {
      label: "Valor promedio contrato",
      value: metrics.avgValue ?? 0,
      formattedValue: formatCOP(metrics.avgValue ?? 0),
      isCurrency: true,
      change: 0,
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Próximos a vencer",
      value: metrics.soonExpiring ?? 0,
      formattedValue: String(metrics.soonExpiring ?? 0),
      isCurrency: false,
      change: 0,
      icon: Clock,
      gradient: (metrics.soonExpiring ?? 0) > 0 ? "from-amber-500 to-orange-500" : "from-slate-400 to-slate-500",
      iconBg: (metrics.soonExpiring ?? 0) > 0 ? "bg-amber-50" : "bg-slate-50",
    },
    {
      label: "Contratos vencidos",
      value: metrics.expired ?? 0,
      formattedValue: String(metrics.expired ?? 0),
      isCurrency: false,
      change: 0,
      icon: AlertTriangle,
      gradient: (metrics.expired ?? 0) > 0 ? "from-red-500 to-rose-600" : "from-slate-400 to-slate-500",
      iconBg: (metrics.expired ?? 0) > 0 ? "bg-red-50" : "bg-slate-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((kpi, i) => (
        <KPICard key={kpi.label} {...kpi} index={i} />
      ))}
    </div>
  )
}

export function ProjectDashboardView({
  projects,
  entities: _entities,
  fetchError,
  funcionamientoActiveContracts,
}: ProjectDashboardViewProps) {
  const [year, setYear] = useState("all")
  const [showNewInteradmin, setShowNewInteradmin] = useState(false)
  const [showNewDerived, setShowNewDerived] = useState(false)
  const [showNewFuncionamiento, setShowNewFuncionamiento] = useState(false)

  const filtered = useMemo(
    () =>
      applyDashboardProjectFilters(projects, {
        ...DEFAULT_PROJECT_DASHBOARD_FILTERS,
        year,
      }),
    [projects, year]
  )

  const interadmin = useMemo(
    () => filtered.filter((p) => p.project_type === "INTERADMINISTRATIVO"),
    [filtered]
  )

  const funcionamiento = useMemo(
    () => filtered.filter((p) => p.project_type === "FUNCIONAMIENTO"),
    [filtered]
  )

  const interadminMetrics = useMemo(() => computeSectionMetrics(interadmin), [interadmin])

  // Métricas FUNCIONAMIENTO: si vienen contratos activos del servidor, úsalos directamente.
  // Esto garantiza que los KPIs reflejan solo contratos EN_EJECUCION.
  const funcionamientoMetrics = useMemo(
    () =>
      funcionamientoActiveContracts && funcionamientoActiveContracts.length >= 0
        ? computeFuncionamientoContractMetrics(funcionamientoActiveContracts)
        : computeSectionMetrics(funcionamiento),
    [funcionamientoActiveContracts, funcionamiento]
  )

  const years = useMemo(() => uniqueProjectYears(projects), [projects])

  const lifecycleData = LIFECYCLE_ORDER.map((s) => ({
    name: LIFECYCLE_CONFIG[s].label,
    value: interadmin.filter((p) => p.lifecycle_status === s).length,
    color: LIFECYCLE_CONFIG[s].color,
  })).filter((d) => d.value > 0)

  const entityData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of interadmin) {
      const e = p.secretaria ?? p.area_name ?? "—"
      counts.set(e, (counts.get(e) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [interadmin])

  return (
    <div className="space-y-8">
      {/* Header con acciones */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#151c27] tracking-tight">
            Panel ejecutivo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Indicadores gerenciales separados por categoría — Interadministrativos y Funcionamiento.
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
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertTriangle size={16} />
          Error al cargar datos: {fetchError}
        </div>
      )}

      {/* ─── SECCIÓN INTERADMINISTRATIVOS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Contratos Interadministrativos"
            subtitle="Mandatos con secretarías — proyectos y derivados asociados"
            color="bg-[var(--corporate-blue)]"
            count={interadmin.length}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewDerived(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[var(--corporate-blue)]/30"
            >
              <GitBranch size={12} />
              Nuevo Derivado
            </button>
          </div>
        </div>

        <InteradminKPIs metrics={interadminMetrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="epuxua-card p-5">
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wide">
              Por ciclo de vida
            </h4>
            {lifecycleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={lifecycleData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {lifecycleData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
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
                    {entityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>
            )}
          </div>
        </div>

        <div className="epuxua-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              Proyectos recientes
            </h4>
            <Link
              href="/proyectos"
              className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {interadmin.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--corporate-blue)]">
                    {p.project_code}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground/80 truncate">
                    {projectEntityLabel(p)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs font-medium">{formatCOP(p.total_value)}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                    <CheckCircle2 size={10} />
                    {Number(p.execution_pct ?? 0).toFixed(0)}% ejec.
                  </p>
                </div>
              </Link>
            ))}
            {interadmin.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin proyectos interadministrativos
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Modales de creación */}
      <NewInteradminProjectModal
        open={showNewInteradmin}
        onClose={() => setShowNewInteradmin(false)}
      />
      <NewDerivedContractModal
        open={showNewDerived}
        onClose={() => setShowNewDerived(false)}
      />
      <NewFuncionamientoContractModal
        open={showNewFuncionamiento}
        onClose={() => setShowNewFuncionamiento(false)}
        availableProjects={funcionamiento}
      />

      {/* ─── SECCIÓN FUNCIONAMIENTO ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Funcionamiento"
            subtitle="Contratos de apoyo con recursos propios EPUXUA — agrupados por proyecto contenedor"
            color="bg-teal-500"
            count={funcionamiento.length}
          />
          <button
            type="button"
            onClick={() => setShowNewFuncionamiento(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-teal-500/30"
          >
            <Plus size={12} />
            Nuevo Contrato
          </button>
        </div>

        <FuncionamientoKPIs metrics={funcionamientoMetrics} />

        <div className="epuxua-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              Proyectos contenedor
            </h4>
            <Link
              href="/funcionamiento"
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Ver árbol →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {funcionamiento.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-teal-700">{p.project_code}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.name}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs font-medium">{formatCOP(p.total_value)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {projectTypeLabel(p.project_type)} · {p.year}
                  </p>
                </div>
              </Link>
            ))}
            {funcionamiento.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin proyectos de funcionamiento
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
