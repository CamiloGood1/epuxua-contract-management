"use client"

import Link from "next/link"
import { ArrowRight, GitBranch, Landmark } from "lucide-react"
import { MaterialIcon } from "@/components/ui/material-icon"
import { KPICard } from "./KPICard"
import { DonutChart } from "./DonutChart"
import { BarByEntityChart } from "./BarByEntityChart"
import { ContractCards } from "./ContractCards"
import type { Contract } from "@/types/contract"
import type { EntityBar, KPICardData, StatusSlice } from "@/types"
import { urgentContracts } from "./dashboard-utils"

interface DashboardSectionProps {
  variant: "main" | "derived"
  title: string
  subtitle: string
  contracts: Contract[]
  kpis: KPICardData[]
  donutData: StatusSlice[]
  barData: EntityBar[]
  barTitle: string
  barSubtitle: string
  listHref: string
  listLabel: string
}

export function DashboardSection({
  variant,
  title,
  subtitle,
  contracts,
  kpis,
  donutData,
  barData,
  barTitle,
  barSubtitle,
  listHref,
  listLabel,
}: DashboardSectionProps) {
  const urgent = urgentContracts(contracts, 3)
  const accent =
    variant === "main"
      ? "border-[var(--corporate-blue)]"
      : "border-[var(--institutional-gold)]"
  const Icon = variant === "main" ? Landmark : GitBranch

  if (contracts.length === 0) {
    return (
      <div className={cnSection(accent)}>
        <SectionHeader Icon={Icon} title={title} subtitle={subtitle} />
        <p className="text-sm text-muted-foreground py-8 text-center">
          Sin registros con los filtros actuales.
        </p>
      </div>
    )
  }

  return (
    <div className={cnSection(accent)}>
      <SectionHeader Icon={Icon} title={title} subtitle={subtitle} count={contracts.length} />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <div className="lg:col-span-2 bg-[#f6f8fc] rounded-xl p-4 min-w-0 overflow-hidden">
          <h4 className="text-sm font-bold text-foreground mb-1">Estado</h4>
          <p className="text-xs text-muted-foreground mb-3">Distribución por estado</p>
          <DonutChart data={donutData} total={contracts.length} />
        </div>
        <div className="lg:col-span-3 bg-[#f6f8fc] rounded-xl p-4 min-w-0 overflow-hidden">
          <h4 className="text-sm font-bold text-foreground">{barTitle}</h4>
          <p className="text-xs text-muted-foreground mb-3">{barSubtitle}</p>
          <BarByEntityChart
            data={barData}
            emptyMessage={
              variant === "derived"
                ? "Sin derivados con interadministrativo padre identificado."
                : "No hay interadministrativos con secretaría registrada."
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[#f6f8fc] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">Recientes</h4>
            <Link
              href={listHref}
              className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline inline-flex items-center gap-1"
            >
              {listLabel} <ArrowRight size={12} />
            </Link>
          </div>
          <ContractCards contracts={contracts} limit={4} />
        </div>

        <div className="bg-[#f6f8fc] rounded-xl p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <MaterialIcon name="warning" size={16} className="text-amber-500" />
            Próximos a vencer
          </h4>
          <ul className="space-y-2">
            {urgent.length === 0 ? (
              <li className="text-xs text-muted-foreground py-4 text-center">Sin alertas</li>
            ) : (
              urgent.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="block p-3 rounded-lg border border-[#EAEAEA] bg-white hover:border-[var(--corporate-blue)]/30 transition-colors"
                  >
                    <p className="text-[10px] font-mono text-muted-foreground">{c.contract_number}</p>
                    <p className="text-xs font-medium line-clamp-2 mt-0.5">{c.object}</p>
                    <p className="text-[10px] text-rose-600 font-semibold mt-1">
                      {c.days_remaining != null && c.days_remaining >= 0
                        ? `${c.days_remaining} días`
                        : "Vencido"}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function cnSection(accent: string) {
  return `epuxua-card p-4 sm:p-5 border-l-4 ${accent} space-y-0`
}

function SectionHeader({
  Icon,
  title,
  subtitle,
  count,
}: {
  Icon: typeof Landmark
  title: string
  subtitle: string
  count?: number
}) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-4 border-b border-[#EAEAEA]">
      <div className="w-10 h-10 rounded-xl bg-[var(--corporate-blue)]/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-[var(--corporate-blue)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {count != null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f6f8fc] text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}
