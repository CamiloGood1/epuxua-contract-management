"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText,
  Activity,
  Hourglass,
  Banknote,
  CalendarX2,
  BarChart3,
  Plus,
  ArrowRight,
  AlertTriangle,
  Download,
} from "lucide-react"
import { MaterialIcon } from "@/components/ui/material-icon"
import { KPICard } from "./KPICard"
import { DonutChart } from "./DonutChart"
import { BarByEntityChart } from "./BarByEntityChart"
import { ContractCards } from "./ContractCards"
import { ActivityTimeline } from "./ActivityTimeline"
import { NewContractModal } from "@/modules/contracts/components/new-contract-modal"
import type { DashboardMetrics, KPICardData, StatusSlice, EntityBar } from "@/types"
import type { Contract } from "@/types/contract"
import {
  STATUS_CONFIG as SC,
  resolveStatus as RS,
  formatCOP,
} from "@/modules/contracts/lib/status"

export const STATUS_CONFIG = SC
export const resolveStatus = RS
export { formatCOP }
export type StatusKey = keyof typeof STATUS_CONFIG

function buildKPIs(metrics: DashboardMetrics | null, contracts: Contract[]): KPICardData[] {
  const total = metrics?.totalContracts ?? contracts.length
  const inProgress =
    metrics?.inProgressContracts ??
    contracts.filter((c) => c.status === "EN_EJECUCION").length
  const suspended =
    metrics?.suspendedContracts ??
    contracts.filter((c) => c.status === "SUSPENDIDO").length
  const totalVal =
    metrics?.activeContractedValue ??
    metrics?.totalValue ??
    contracts.reduce((s, c) => s + Number(c.final_value ?? c.initial_value), 0)
  const paid = metrics?.totalPaidValue ?? contracts.reduce((s, c) => s + Number(c.paid_value), 0)
  const expiring = metrics?.expiring30Days ?? 0

  return [
    {
      label: "Total contratos",
      value: total,
      formattedValue: String(total),
      isCurrency: false,
      change: 0,
      icon: FileText,
      gradient: "bg-indigo-500",
      iconBg: "",
    },
    {
      label: "En ejecución",
      value: inProgress,
      formattedValue: String(inProgress),
      isCurrency: false,
      change: 0,
      icon: Activity,
      gradient: "bg-emerald-500",
      iconBg: "",
    },
    {
      label: "Valor contratado",
      value: totalVal,
      formattedValue: formatCOP(totalVal),
      isCurrency: true,
      change: 0,
      icon: Banknote,
      gradient: "bg-violet-500",
      iconBg: "",
    },
    {
      label: "Ejecutado (pagos)",
      value: paid,
      formattedValue: formatCOP(paid),
      isCurrency: true,
      change: 0,
      icon: BarChart3,
      gradient: "bg-indigo-500",
      iconBg: "",
    },
    {
      label: "Suspendidos",
      value: suspended,
      formattedValue: String(suspended),
      isCurrency: false,
      change: 0,
      icon: Hourglass,
      gradient: "bg-amber-500",
      iconBg: "",
    },
    {
      label: "Próx. a vencer",
      value: expiring,
      formattedValue: String(expiring),
      isCurrency: false,
      change: 0,
      icon: CalendarX2,
      gradient: "bg-rose-500",
      iconBg: "",
    },
  ]
}

function buildDonut(contracts: Contract[]): StatusSlice[] {
  const counts: Record<string, { count: number; color: string }> = {}
  for (const c of contracts) {
    const cfg = resolveStatus(c.status)
    const key = cfg.label
    if (!counts[key]) counts[key] = { count: 0, color: cfg.color }
    counts[key].count++
  }
  return Object.entries(counts).map(([name, { count, color }]) => ({
    name,
    value: count,
    color,
  }))
}

function buildEntityBars(contracts: Contract[]): EntityBar[] {
  const map: Record<string, number> = {}
  for (const c of contracts) {
    const key = c.area_name?.trim() || "Sin área"
    map[key] = (map[key] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([entity, count]) => ({ entity, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
}

function urgentContracts(contracts: Contract[]): Contract[] {
  return contracts
    .filter(
      (c) =>
        c.status === "EN_EJECUCION" &&
        c.days_remaining != null &&
        c.days_remaining <= 30
    )
    .sort((a, b) => (a.days_remaining ?? 99) - (b.days_remaining ?? 99))
    .slice(0, 4)
}

interface DashboardPageProps {
  metrics: DashboardMetrics | null
  contracts: Contract[]
  fetchError?: string
}

export function DashboardPage({ metrics, contracts, fetchError }: DashboardPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const kpis = useMemo(() => buildKPIs(metrics, contracts), [metrics, contracts])
  const donutData = useMemo(() => buildDonut(contracts), [contracts])
  const entityBars = useMemo(() => buildEntityBars(contracts), [contracts])
  const urgent = useMemo(() => urgentContracts(contracts), [contracts])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#151c27] tracking-tight">
            Ejecución y monitoreo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de la actividad contractual y avance financiero.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#EAEAEA] bg-white text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Download size={14} />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90 shadow-sm"
          >
            <Plus size={14} />
            Nuevo contrato
          </button>
        </div>
      </div>

      <NewContractModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertTriangle size={16} />
          Error al cargar datos: {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 epuxua-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Estado por contrato</h3>
              <p className="text-xs text-muted-foreground">Distribución actual</p>
            </div>
            <MaterialIcon name="more_vert" size={20} className="text-muted-foreground" />
          </div>
          <DonutChart data={donutData} total={contracts.length} />
        </div>

        <div className="lg:col-span-3 epuxua-card p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-foreground">
              Contratos por área responsable
            </h3>
            <p className="text-xs text-muted-foreground">Top áreas</p>
          </div>
          <BarByEntityChart data={entityBars} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="epuxua-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Contratos recientes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {contracts.length} en el sistema
                </p>
              </div>
              <Link
                href="/contracts"
                className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            <ContractCards contracts={contracts} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="epuxua-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MaterialIcon name="warning" size={18} className="text-amber-500" />
                Próximos a vencer
              </h3>
              <Link href="/alertas" className="text-[10px] font-semibold text-[var(--corporate-blue)]">
                Ver todo
              </Link>
            </div>
            <ul className="space-y-3">
              {urgent.length === 0 ? (
                <li className="text-xs text-muted-foreground py-4 text-center">
                  Sin vencimientos críticos
                </li>
              ) : (
                urgent.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/contracts/${c.id}`}
                      className="block p-3 rounded-lg border border-[#EAEAEA] hover:border-[var(--corporate-blue)]/30 transition-colors"
                    >
                      <p className="text-xs font-mono text-muted-foreground">{c.contract_number}</p>
                      <p className="text-sm font-medium line-clamp-1 mt-0.5">{c.object}</p>
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">
                        {c.days_remaining != null && c.days_remaining >= 0
                          ? `${c.days_remaining} días restantes`
                          : "Vencido"}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="epuxua-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Actividad reciente</h3>
            <ActivityTimeline contracts={contracts} />
          </div>
        </div>
      </div>
    </div>
  )
}
