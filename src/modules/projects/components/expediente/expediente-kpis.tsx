"use client"

import {
  Banknote,
  TrendingUp,
  Wallet,
  GitBranch,
  Bell,
  PieChart,
  Briefcase,
  Receipt,
} from "lucide-react"
import { formatCOP, pct } from "@/modules/contracts/lib/status"
import type { ProjectDetail, ProjectFinancialSummary } from "@/types/project"
import type { ProjectExpedienteComputed } from "@/types/project-expediente"

interface ExpedienteKpisProps {
  project: ProjectDetail
  financial: ProjectFinancialSummary | null
  computed: ProjectExpedienteComputed
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: typeof Banknote
  accent?: boolean
}) {
  return (
    <div className="epuxua-card p-3.5 sm:p-4 flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon
          size={13}
          className={accent ? "text-[var(--corporate-blue)]" : "text-muted-foreground"}
        />
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </p>
      </div>
      <p
        className={`text-base sm:text-lg font-bold tabular-nums truncate ${
          accent ? "text-[var(--corporate-blue)]" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export function ExpedienteKpis({ project, financial, computed }: ExpedienteKpisProps) {
  const fin = financial ?? project
  const executionPct = pct(fin.execution_pct ?? project.execution_pct)

  const items = [
    { label: "Valor total", value: formatCOP(fin.total_value ?? project.total_value), icon: Banknote, accent: true },
    { label: "Bienes y servicios", value: formatCOP(fin.goods_services_value ?? project.goods_services_value), icon: Briefcase },
    { label: "Cuota gerencia", value: formatCOP(fin.management_fee_amount ?? project.management_fee_amount), icon: PieChart },
    { label: "Valor contratado", value: formatCOP(computed.contracted_value || fin.total_value), icon: Receipt },
    { label: "Valor ejecutado", value: formatCOP(fin.executed_value ?? project.executed_value), icon: TrendingUp },
    { label: "Valor pagado", value: formatCOP(fin.paid_value ?? project.paid_value), icon: Wallet },
    { label: "Saldo disponible", value: formatCOP(fin.available_balance ?? project.available_balance), icon: Banknote },
    { label: "% ejecución", value: `${executionPct.toFixed(1)}%`, icon: TrendingUp, accent: true },
    { label: "Derivados", value: String(computed.derived_count), icon: GitBranch },
    { label: "Alertas activas", value: String(computed.open_alerts || project.active_alerts_count || 0), icon: Bell },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {items.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}
