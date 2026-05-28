import type { LucideIcon } from "lucide-react"

// ── Dashboard service return type ─────────────────────────────────────────────

export interface DashboardMetrics {
  totalContracts: number
  inProgressContracts: number
  liquidationContracts: number
  totalValue: number
}

// ── Dashboard derived types ──────────────────────────────────────────────────

export interface KPICardData {
  label: string
  value: number
  formattedValue: string
  isCurrency: boolean
  change: number
  icon: LucideIcon
  gradient: string
  iconBg: string
  suffix?: string
}

export interface StatusSlice {
  name: string
  value: number
  color: string
}

export interface EntityBar {
  entity: string
  count: number
}

// ── Navigation ───────────────────────────────────────────────────────────────

export type ContractStatus =
  | "en_ejecucion"
  | "en_liquidacion"
  | "liquidado"
  | "suspendido"
  | "terminado"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  section?: string
}

// ── Chart data ───────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  month: string
  valor: number
  contratos: number
}
