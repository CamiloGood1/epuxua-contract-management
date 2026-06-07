import type { Contract } from "@/types/contract"
import type { EntityBar, KPICardData, StatusSlice } from "@/types"
import { resolveStatus, formatCOP } from "@/modules/contracts/lib/status"
import type { LucideIcon } from "lucide-react"
import { Activity, Banknote, BarChart3, FileText, GitBranch } from "lucide-react"

export type DashboardFilterState = {
  year: string
  status: string
  segment: "both" | "contratos" | "derivados"
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  year: "all",
  status: "all",
  segment: "both",
}

export function isDerivedContract(c: Contract): boolean {
  return c.contract_type === "DERIVADO" || !!c.parent_contract_id
}

export function isMainContract(c: Contract): boolean {
  return !isDerivedContract(c)
}

export function applyDashboardFilters(
  contracts: Contract[],
  filters: DashboardFilterState
): Contract[] {
  return contracts.filter((c) => {
    if (filters.year !== "all" && String(c.year) !== filters.year) return false
    if (filters.status !== "all" && c.status !== filters.status) return false
    return true
  })
}

export function splitBySegment(
  contracts: Contract[],
  segment: DashboardFilterState["segment"]
): { main: Contract[]; derived: Contract[] } {
  const main = contracts.filter(isMainContract)
  const derived = contracts.filter(isDerivedContract)
  if (segment === "contratos") return { main, derived: [] }
  if (segment === "derivados") return { main: [], derived }
  return { main, derived }
}

export function buildSectionKPIs(
  contracts: Contract[],
  labels: { total: string; icon?: LucideIcon }
): KPICardData[] {
  const inProgress = contracts.filter((c) => c.status === "EN_EJECUCION").length
  const suspended = contracts.filter((c) => c.status === "SUSPENDIDO").length
  const totalVal = contracts.reduce(
    (s, c) => s + Number(c.final_value ?? c.initial_value),
    0
  )
  const paid = contracts.reduce((s, c) => s + Number(c.paid_value), 0)
  const expiring = contracts.filter(
    (c) =>
      c.status === "EN_EJECUCION" &&
      c.days_remaining != null &&
      c.days_remaining >= 0 &&
      c.days_remaining <= 30
  ).length

  const Icon = labels.icon ?? FileText

  return [
    {
      label: labels.total,
      value: contracts.length,
      formattedValue: String(contracts.length),
      isCurrency: false,
      change: 0,
      icon: Icon,
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
      label: "Ejecutado",
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
      icon: Activity,
      gradient: "bg-amber-500",
      iconBg: "",
    },
    {
      label: "Próx. a vencer",
      value: expiring,
      formattedValue: String(expiring),
      isCurrency: false,
      change: 0,
      icon: Activity,
      gradient: "bg-rose-500",
      iconBg: "",
    },
  ]
}

export function buildDonutSlices(contracts: Contract[]): StatusSlice[] {
  const counts: Record<string, { count: number; color: string }> = {}
  for (const c of contracts) {
    const cfg = resolveStatus(c.status)
    const key = cfg.label
    if (!counts[key]) counts[key] = { count: 0, color: cfg.color }
    counts[key].count++
  }
  const slices = Object.entries(counts).map(([name, { count, color }]) => ({
    name,
    value: count,
    color,
  }))
  slices.sort((a, b) => b.value - a.value)
  if (slices.length <= 5) return slices
  const top = slices.slice(0, 4)
  const rest = slices.slice(4)
  const otros = rest.reduce((s, x) => s + x.value, 0)
  return [...top, { name: "Otros estados", value: otros, color: "#94a3b8" }]
}

export function buildSecretariatBars(contracts: Contract[]): EntityBar[] {
  const map: Record<string, number> = {}
  for (const c of contracts) {
    if (c.contract_type !== "INTERADMINISTRATIVO") continue
    const key = c.secretaria?.trim()
    if (!key) continue
    map[key] = (map[key] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([entity, count]) => ({ entity, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export function buildParentInteradminBars(contracts: Contract[]): EntityBar[] {
  const map: Record<string, number> = {}
  for (const c of contracts) {
    const key = c.parent_contract_number?.trim()
    if (!key) continue
    map[key] = (map[key] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([entity, count]) => ({ entity, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export function urgentContracts(contracts: Contract[], limit = 4): Contract[] {
  return contracts
    .filter(
      (c) =>
        c.status === "EN_EJECUCION" &&
        c.days_remaining != null &&
        c.days_remaining <= 30
    )
    .sort((a, b) => (a.days_remaining ?? 99) - (b.days_remaining ?? 99))
    .slice(0, limit)
}

export function uniqueYears(contracts: Contract[]): number[] {
  return [...new Set(contracts.map((c) => c.year))].sort((a, b) => b - a)
}
