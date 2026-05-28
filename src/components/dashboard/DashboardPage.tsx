"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Activity,
  Hourglass,
  Banknote,
  CalendarX2,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  Plus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import { KPICard } from "./KPICard"
import { DonutChart } from "./DonutChart"
import { BarByEntityChart } from "./BarByEntityChart"
import { ContractCards } from "./ContractCards"
import { ActivityTimeline } from "./ActivityTimeline"
import { NewContractModal } from "@/modules/contracts/components/new-contract-modal"
import type { DashboardMetrics, KPICardData, StatusSlice, EntityBar } from "@/types"
import type { Contract } from "@/types/contract"

// ── Status config (real Supabase values) ─────────────────────────────────────

export const STATUS_CONFIG = {
  in_progress:   { label: "En Ejecución",     color: "#10B981", dot: "bg-emerald-400" },
  liquidation:   { label: "En Liquidación",   color: "#F59E0B", dot: "bg-amber-400"   },
  liquidated:    { label: "Liquidado",         color: "#7C3AED", dot: "bg-violet-400"  },
  suspended:     { label: "Suspendido",        color: "#EF4444", dot: "bg-red-400"     },
  pending_start: { label: "Pendiente de Inicio", color: "#3B82F6", dot: "bg-blue-400"  },
} as const

export type StatusKey = keyof typeof STATUS_CONFIG

export function resolveStatus(raw: string | null | undefined): StatusKey {
  if (raw && raw in STATUS_CONFIG) return raw as StatusKey
  return "pending_start"
}

// ── COP formatter (shared) ────────────────────────────────────────────────────

export function formatCOP(value: number | null | undefined): string {
  if (value == null) return "—"
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`
  return `$${value.toLocaleString("es-CO")}`
}

// ── KPI computation ───────────────────────────────────────────────────────────

function buildKPIs(metrics: DashboardMetrics | null, contracts: Contract[]): KPICardData[] {
  const total = metrics?.totalContracts ?? contracts.length
  const inProgress = metrics?.inProgressContracts ?? contracts.filter(c => c.status === "in_progress").length
  const inLiquidation = metrics?.liquidationContracts ?? contracts.filter(c => c.status === "liquidation").length
  const totalVal = metrics?.totalValue ?? contracts.reduce((s, c) => s + Number(c.initial_value), 0)
  const pendingStart = contracts.filter(c => c.status === "pending_start").length

  const now = Date.now()
  const in30 = now + 30 * 86_400_000
  const expiring = contracts.filter(c => {
    if (!c.end_date) return false
    const d = new Date(c.end_date).getTime()
    return d >= now && d <= in30
  }).length

  return [
    {
      label: "Total Contratos",
      value: total,
      formattedValue: String(total),
      isCurrency: false,
      change: 0,
      icon: FileText,
      gradient: "bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700",
      iconBg: "bg-indigo-400/30",
    },
    {
      label: "En Ejecución",
      value: inProgress,
      formattedValue: String(inProgress),
      isCurrency: false,
      change: 0,
      icon: Activity,
      gradient: "bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700",
      iconBg: "bg-emerald-400/30",
    },
    {
      label: "En Liquidación",
      value: inLiquidation,
      formattedValue: String(inLiquidation),
      isCurrency: false,
      change: 0,
      icon: Hourglass,
      gradient: "bg-linear-to-br from-amber-500 via-orange-500 to-orange-600",
      iconBg: "bg-amber-400/30",
    },
    {
      label: "Valor Contratado",
      value: totalVal,
      formattedValue: formatCOP(totalVal),
      isCurrency: true,
      change: 0,
      icon: Banknote,
      gradient: "bg-linear-to-br from-violet-500 via-violet-600 to-purple-700",
      iconBg: "bg-violet-400/30",
    },
    {
      label: "Pendientes Inicio",
      value: pendingStart,
      formattedValue: String(pendingStart),
      isCurrency: false,
      change: 0,
      icon: Clock,
      gradient: "bg-linear-to-br from-blue-500 via-blue-600 to-blue-700",
      iconBg: "bg-blue-400/30",
    },
    {
      label: "Próx. a Vencer",
      value: expiring,
      formattedValue: String(expiring),
      isCurrency: false,
      change: 0,
      icon: CalendarX2,
      gradient: "bg-linear-to-br from-rose-500 via-red-500 to-rose-700",
      iconBg: "bg-rose-400/30",
    },
  ]
}

function buildDonut(contracts: Contract[]): StatusSlice[] {
  const counts: Record<string, { count: number; color: string }> = {}
  for (const c of contracts) {
    const cfg = STATUS_CONFIG[resolveStatus(c.status)]
    const key = cfg.label
    if (!counts[key]) counts[key] = { count: 0, color: cfg.color }
    counts[key].count++
  }
  return Object.entries(counts).map(([name, { count, color }]) => ({
    name, value: count, color,
  }))
}

function buildEntityBars(contracts: Contract[]): EntityBar[] {
  const map: Record<string, number> = {}
  for (const c of contracts) {
    const key = c.contracting_entity?.trim() || "Sin entidad"
    map[key] = (map[key] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([entity, count]) => ({ entity, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
}

// ── Animation helper ──────────────────────────────────────────────────────────

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
})

// ── Props ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  metrics: DashboardMetrics | null
  contracts: Contract[]
  fetchError?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardPage({ metrics, contracts, fetchError }: DashboardPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const kpis = useMemo(() => buildKPIs(metrics, contracts), [metrics, contracts])
  const donutData = useMemo(() => buildDonut(contracts), [contracts])
  const entityBars = useMemo(() => buildEntityBars(contracts), [contracts])

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-8">

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Bienvenida, Camila</h2>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-muted transition-colors">
            <RefreshCw size={13} />
            Actualizar
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 transition-all shadow-sm shadow-primary/20 active:scale-95"
          >
            <Plus size={13} />
            Nuevo contrato
          </button>
        </div>
      </motion.div>

      <NewContractModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Error */}
      {fetchError && (
        <motion.div {...fadeUp(0.05)} className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertTriangle size={16} />
          Error al cargar datos: {fetchError}
        </motion.div>
      )}

      {/* KPIs — 3 cols mobile, 6 desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div {...fadeUp(0.3)} className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <PieChart size={15} className="text-violet-600" />
              </div>
              Estado de Contratos
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 ml-9">Distribución por estado actual</p>
          </div>
          <DonutChart data={donutData} total={contracts.length} />
        </motion.div>

        <motion.div {...fadeUp(0.38)} className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BarChart3 size={15} className="text-indigo-600" />
              </div>
              Contratos por Entidad
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 ml-9">Top entidades contratantes</p>
          </div>
          <BarByEntityChart data={entityBars} />
        </motion.div>
      </div>

      {/* Contracts + Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div {...fadeUp(0.46)} className="xl:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Contratos Recientes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contracts.length > 0
                  ? `${contracts.length} contrato${contracts.length !== 1 ? "s" : ""} registrado${contracts.length !== 1 ? "s" : ""}`
                  : "Sin contratos registrados aún"}
              </p>
            </div>
            {contracts.length > 6 && (
              <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                Ver todos <ArrowRight size={13} />
              </button>
            )}
          </div>
          <ContractCards contracts={contracts} />
        </motion.div>

        <motion.div {...fadeUp(0.54)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground">Actividad Reciente</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos eventos del sistema</p>
          </div>
          <ActivityTimeline contracts={contracts} />
        </motion.div>
      </div>
    </div>
  )
}
