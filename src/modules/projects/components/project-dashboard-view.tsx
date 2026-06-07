"use client"

import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { FolderKanban, TrendingUp, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react"
import { KPICard } from "@/components/dashboard/KPICard"
import { formatCOP } from "@/modules/contracts/lib/status"
import { LIFECYCLE_CONFIG, LIFECYCLE_ORDER } from "../lib/lifecycle"
import { projectTypeLabel } from "../lib/project-type"
import type { ProjectDashboardMetrics, ProjectDetail } from "@/types/project"

const CHART_COLORS = ["#345bab", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#64748B"]

interface ProjectDashboardViewProps {
  metrics: ProjectDashboardMetrics | null
  recentProjects: ProjectDetail[]
  fetchError?: string
}

export function ProjectDashboardView({
  metrics,
  recentProjects,
  fetchError,
}: ProjectDashboardViewProps) {
  const lifecycleData = LIFECYCLE_ORDER.map((s) => ({
    name: LIFECYCLE_CONFIG[s].label,
    value: metrics?.by_lifecycle[s] ?? 0,
    color: LIFECYCLE_CONFIG[s].color,
  })).filter((d) => d.value > 0)

  const typeData = metrics
    ? Object.entries(metrics.by_type)
        .filter(([, v]) => v > 0)
        .map(([type, value], i) => ({
          name: projectTypeLabel(type),
          value,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
    : []

  const kpis = metrics
    ? [
        {
          label: "Total proyectos",
          value: metrics.total_projects,
          formattedValue: String(metrics.total_projects),
          isCurrency: false,
          change: 0,
          icon: FolderKanban,
          gradient: "from-indigo-500 to-blue-600",
          iconBg: "bg-indigo-50",
        },
        {
          label: "Valor total",
          value: metrics.total_value,
          formattedValue: formatCOP(metrics.total_value),
          isCurrency: true,
          change: 0,
          icon: Wallet,
          gradient: "from-emerald-500 to-teal-600",
          iconBg: "bg-emerald-50",
        },
        {
          label: "Ejecutado",
          value: metrics.total_executed,
          formattedValue: formatCOP(metrics.total_executed),
          isCurrency: true,
          change: 0,
          icon: TrendingUp,
          gradient: "from-violet-500 to-purple-600",
          iconBg: "bg-violet-50",
        },
        {
          label: "Con alertas",
          value: metrics.projects_with_alerts,
          formattedValue: String(metrics.projects_with_alerts),
          isCurrency: false,
          change: 0,
          icon: AlertTriangle,
          gradient: "from-amber-500 to-orange-600",
          iconBg: "bg-amber-50",
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#151c27] tracking-tight">
          Panel de proyectos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visión general de la cartera de proyectos EPUXUA.
        </p>
      </div>

      {fetchError && (
        <div className="px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          Error al cargar el dashboard: {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="epuxua-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Proyectos por ciclo de vida
          </h3>
          {lifecycleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
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
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin datos de ciclo de vida
            </p>
          )}
        </div>

        <div className="epuxua-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Por tipo de proyecto</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin datos por tipo
            </p>
          )}
        </div>
      </div>

      <div className="epuxua-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Proyectos recientes</h3>
          <Link
            href="/proyectos"
            className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentProjects.slice(0, 8).map((p) => (
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
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xs font-medium">{formatCOP(p.total_value)}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                  <CheckCircle2 size={10} />
                  {Number(p.execution_pct ?? 0).toFixed(0)}% ejecución
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
