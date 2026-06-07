import type { LucideIcon } from "lucide-react"

export interface DashboardMetrics {
  totalContracts: number
  inProgressContracts: number
  liquidationContracts: number
  totalValue: number
  suspendedContracts: number
  liquidatedContracts: number
  expiring30Days: number
  expiring15Days: number
  overdueActive: number
  totalPaidValue: number
  totalPendingValue: number
  activeContractedValue: number
}

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

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  section?: string
}

export type { ProjectDashboardMetrics } from "@/types/project"
