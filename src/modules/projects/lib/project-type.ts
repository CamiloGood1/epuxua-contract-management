import type { ProjectType } from "@/types/project"

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  INTERADMINISTRATIVO: "Interadministrativo",
  FUNCIONAMIENTO: "Funcionamiento",
  OPERACION_COMERCIAL: "Operación Comercial",
  TIENDA_VIRTUAL: "Tienda Virtual",
  PAGO_FACTURA: "Pago contra Factura",
}

export function projectTypeLabel(type: ProjectType | string | null | undefined): string {
  if (!type) return "—"
  return PROJECT_TYPE_LABELS[type as ProjectType] ?? type
}

export const PROJECT_TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
)
