import type {
  ProjectDetail,
  ProjectDashboardMetrics,
  ProjectLifecycle,
  ProjectType,
} from "@/types/project"
import type { FuncionamientoContract } from "@/services/funcionamiento.service"
import { projectEntityLabel } from "./project-utils"

/**
 * Computa métricas de la sección FUNCIONAMIENTO directamente desde contratos DIRECTO.
 * Se usa en el dashboard pasando solo los contratos EN_EJECUCION.
 */
export function computeFuncionamientoContractMetrics(
  contracts: FuncionamientoContract[]
): SectionMetrics {
  let totalValue = 0
  let paidValue = 0

  for (const c of contracts) {
    totalValue += c.final_value
    paidValue += c.paid_value
  }

  return {
    totalProjects: contracts.length,
    totalValue,
    executedValue: paidValue,
    paidValue,
    derivedCount: 0,
    alertsCount: 0,
    activeProjects: contracts.length,
  }
}

/**
 * Enriquece proyectos FUNCIONAMIENTO con los valores reales de sus contratos.
 * Los proyectos contenedor se crean con total_value=0; esta función corrige
 * total_value, executed_value y paid_value sumando desde los contratos DIRECTO.
 */
export function enrichFuncionamientoProjects(
  projects: ProjectDetail[],
  contracts: FuncionamientoContract[]
): ProjectDetail[] {
  const sumsByProject = new Map<string, { total: number; paid: number }>()
  for (const c of contracts) {
    if (!c.project_id) continue
    const prev = sumsByProject.get(c.project_id) ?? { total: 0, paid: 0 }
    sumsByProject.set(c.project_id, {
      total: prev.total + c.final_value,
      paid: prev.paid + c.paid_value,
    })
  }

  return projects.map((p) => {
    if (p.project_type !== "FUNCIONAMIENTO") return p
    const sums = sumsByProject.get(p.id)
    if (!sums) return p
    return {
      ...p,
      total_value: sums.total,
      executed_value: sums.paid,
      paid_value: sums.paid,
    }
  })
}

// Tipos activos en el negocio actual
export const ACTIVE_PROJECT_TYPES: ProjectType[] = ["INTERADMINISTRATIVO", "FUNCIONAMIENTO"]

export interface SectionMetrics {
  totalProjects: number
  totalValue: number
  executedValue: number
  paidValue: number
  derivedCount: number
  alertsCount: number
  activeProjects: number
}

export type ProjectDashboardFilterState = {
  year: string
  lifecycle: string
  type: string
  entity: string
}

export const DEFAULT_PROJECT_DASHBOARD_FILTERS: ProjectDashboardFilterState = {
  year: "all",
  lifecycle: "all",
  type: "all",
  entity: "all",
}

export function applyDashboardProjectFilters(
  projects: ProjectDetail[],
  filters: ProjectDashboardFilterState
): ProjectDetail[] {
  return projects.filter((p) => {
    if (filters.year !== "all" && p.year !== Number(filters.year)) return false
    if (filters.lifecycle !== "all" && p.lifecycle_status !== filters.lifecycle) return false
    if (filters.type !== "all" && p.project_type !== filters.type) return false
    if (filters.entity !== "all" && projectEntityLabel(p) !== filters.entity) return false
    return true
  })
}

function emptyLifecycle(): Record<ProjectLifecycle, number> {
  return {
    PLANEACION: 0,
    CONTRATACION: 0,
    EJECUCION: 0,
    SEGUIMIENTO: 0,
    LIQUIDACION: 0,
    CERRADO: 0,
  }
}

function emptyType(): Record<ProjectType, number> {
  return {
    INTERADMINISTRATIVO: 0,
    FUNCIONAMIENTO: 0,
    OPERACION_COMERCIAL: 0,
    TIENDA_VIRTUAL: 0,
    PAGO_FACTURA: 0,
  }
}

export function computeMetricsFromProjects(
  projects: ProjectDetail[]
): ProjectDashboardMetrics {
  const byLifecycle = emptyLifecycle()
  const byType = emptyType()
  let totalValue = 0
  let totalExecuted = 0
  let totalAvailable = 0
  let executionSum = 0
  let withAlerts = 0

  for (const p of projects) {
    if (p.lifecycle_status in byLifecycle) {
      byLifecycle[p.lifecycle_status] += 1
    }
    if (p.project_type in byType) {
      byType[p.project_type] += 1
    }
    totalValue += Number(p.total_value ?? 0)
    totalExecuted += Number(p.executed_value ?? 0)
    totalAvailable += Number(p.available_balance ?? 0)
    executionSum += Number(p.execution_pct ?? 0)
    if ((p.active_alerts_count ?? 0) > 0) withAlerts += 1
  }

  const active =
    byLifecycle.EJECUCION +
    byLifecycle.SEGUIMIENTO +
    byLifecycle.CONTRATACION +
    byLifecycle.PLANEACION

  return {
    total_projects: projects.length,
    active_projects: active,
    closed_projects: byLifecycle.CERRADO,
    total_value: totalValue,
    total_executed: totalExecuted,
    total_available: totalAvailable,
    avg_execution_pct: projects.length ? executionSum / projects.length : 0,
    projects_with_alerts: withAlerts,
    by_lifecycle: byLifecycle,
    by_type: byType,
  }
}

export function uniqueProjectYears(projects: ProjectDetail[]): number[] {
  return [...new Set(projects.map((p) => p.year))].sort((a, b) => b - a)
}

export function computeSectionMetrics(projects: ProjectDetail[]): SectionMetrics {
  let totalValue = 0
  let executedValue = 0
  let paidValue = 0
  let derivedCount = 0
  let alertsCount = 0

  for (const p of projects) {
    totalValue += Number(p.total_value ?? 0)
    executedValue += Number(p.executed_value ?? 0)
    paidValue += Number(p.paid_value ?? 0)
    derivedCount += Number(p.derived_count ?? 0)
    alertsCount += Number(p.active_alerts_count ?? 0)
  }

  const activeStatuses: ProjectLifecycle[] = ["PLANEACION", "CONTRATACION", "EJECUCION", "SEGUIMIENTO"]
  const activeProjects = projects.filter((p) => activeStatuses.includes(p.lifecycle_status)).length

  return {
    totalProjects: projects.length,
    totalValue,
    executedValue,
    paidValue,
    derivedCount,
    alertsCount,
    activeProjects,
  }
}
