import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"

export type InteradminDashboardFilterState = {
  year: string
  estado: string
  entity: string
}

export const DEFAULT_PROJECT_DASHBOARD_FILTERS: InteradminDashboardFilterState = {
  year:   "all",
  estado: "all",
  entity: "all",
}

export function applyDashboardProjectFilters(
  contracts: Interadministrativo[],
  filters: InteradminDashboardFilterState
): Interadministrativo[] {
  return contracts.filter((p) => {
    if (filters.year !== "all" && p.fecha_suscripcion) {
      const y = new Date(p.fecha_suscripcion).getFullYear()
      if (y !== Number(filters.year)) return false
    }
    if (filters.estado !== "all" && p.estado !== filters.estado) return false
    if (filters.entity !== "all") {
      const entity = p.secretaria ?? p.area_responsable ?? "—"
      if (entity !== filters.entity) return false
    }
    return true
  })
}

export function uniqueProjectYears(contracts: Interadministrativo[]): number[] {
  const years = new Set<number>()
  for (const c of contracts) {
    if (c.fecha_suscripcion) {
      const y = new Date(c.fecha_suscripcion).getFullYear()
      if (!isNaN(y)) years.add(y)
    }
  }
  return [...years].sort((a, b) => b - a)
}

// ── Compatibilidad con código que aún usa tipos del esquema anterior ──────────

export type ProjectDashboardFilterState = InteradminDashboardFilterState

export function enrichFuncionamientoProjects<T>(projects: T[], _contracts: FuncionamientoContrato[]): T[] {
  return projects
}

// ── Estado counts ─────────────────────────────────────────────────────────────

export function computeEstadoCounts(
  contracts: Interadministrativo[]
): Record<EstadoInteradministrativo, number> {
  return {
    "EN EJECUCIÓN": contracts.filter((c) => c.estado === "EN EJECUCIÓN").length,
    "TERMINADO":    contracts.filter((c) => c.estado === "TERMINADO").length,
    "LIQUIDADO":    contracts.filter((c) => c.estado === "LIQUIDADO").length,
  }
}
