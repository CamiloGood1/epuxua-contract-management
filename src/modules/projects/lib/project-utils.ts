import type { ProjectDetail } from "@/types/project"

/** Entidad contratante / área — columnas reales en v_project_detail */
export function projectEntityLabel(
  p: Pick<ProjectDetail, "secretaria" | "area_name">
): string {
  return p.secretaria ?? p.area_name ?? "—"
}

/** Contratos asociados según campos de la vista (derived_count + principal) */
export function projectContractsCount(
  p: Pick<ProjectDetail, "derived_count" | "primary_contract_id">,
  fallback?: number
): number | null {
  if (p.derived_count != null || p.primary_contract_id) {
    return (p.derived_count ?? 0) + (p.primary_contract_id ? 1 : 0)
  }
  return fallback ?? null
}
