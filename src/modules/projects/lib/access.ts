import type { UserRole } from "@/types/project"

const READ_ONLY_ROLES: UserRole[] = ["DIRECTIVO", "CONSULTOR_PROYECTO", "ESPECTADOR"]
const CREATE_ROLES:    UserRole[] = ["ADMIN", "GERENTE", "GERENTE_PROYECTO"]
const DELETE_ROLES:    UserRole[] = ["ADMIN"]

/** Roles con acceso completo de edición sobre Fuentes de Financiación y Rendimientos Financieros. */
const FINANCIAL_WRITE_ROLES: UserRole[] = ["ADMIN", "GERENTE", "SUBADMINISTRATIVA"]

/** Roles que pueden descargar el informe Word de un contrato interadministrativo. */
const REPORT_DOWNLOAD_ROLES: UserRole[] = ["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"]

export function canEditProjects(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return !READ_ONLY_ROLES.includes(role)
}

export function canCreateProject(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return CREATE_ROLES.includes(role)
}

export function canDeleteProject(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return DELETE_ROLES.includes(role)
}

export function isReadOnlyRole(role: UserRole | null | undefined): boolean {
  if (!role) return true
  return READ_ONLY_ROLES.includes(role)
}

export function canEditFinancialTabs(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return FINANCIAL_WRITE_ROLES.includes(role)
}

export function canDownloadReport(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return REPORT_DOWNLOAD_ROLES.includes(role)
}

export function roleLabel(role: UserRole | null | undefined): string {
  const labels: Record<UserRole, string> = {
    ADMIN:              "Administrador",
    GERENTE:            "Gerente General",
    GERENTE_PROYECTO:   "Gerente de Proyecto",
    DIRECTIVO:          "Directivo",
    CONSULTOR_PROYECTO: "Consultor de Proyecto",
    ESPECTADOR:         "Espectador",
    ESTRUCTURADOR:      "Estructurador",
    SUBADMINISTRATIVA:  "Subadministrativa",
  }
  if (!role) return "Usuario"
  return labels[role] ?? role
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return role === "ADMIN"
}

export function canViewAllInteradmins(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return role === "ADMIN" || role === "GERENTE"
}

/** Roles que ven todos los interadministrativos en listados (no aplica al dashboard). */
export function canReadAllInteradmins(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return (
    canViewAllInteradmins(role) ||
    role === "ESPECTADOR" ||
    role === "DIRECTIVO" ||
    role === "SUBADMINISTRATIVA"
  )
}

export function canAccessInteradmin(
  role: UserRole | null | undefined,
  interadminId: number,
  assignedIds: ReadonlySet<number> | readonly number[]
): boolean {
  if (!role) return false
  if (canReadAllInteradmins(role)) return true
  if (role === "GERENTE_PROYECTO" || role === "CONSULTOR_PROYECTO") {
    const set = assignedIds instanceof Set ? assignedIds : new Set(assignedIds)
    return set.has(interadminId)
  }
  return false
}

export function canWriteInteradmin(
  role: UserRole | null | undefined,
  interadminId: number,
  assignedIds: ReadonlySet<number> | readonly number[]
): boolean {
  if (!role) return false
  if (canViewAllInteradmins(role)) return true
  if (role === "GERENTE_PROYECTO") {
    const set = assignedIds instanceof Set ? assignedIds : new Set(assignedIds)
    return set.has(interadminId)
  }
  return false
}

export const INVITABLE_ROLES: UserRole[] = [
  "GERENTE_PROYECTO",
  "GERENTE",
  "DIRECTIVO",
  "CONSULTOR_PROYECTO",
  "ESPECTADOR",
  "ESTRUCTURADOR",
  "SUBADMINISTRATIVA",
]

export const ASSIGNMENT_ROLES = ["GERENTE_PROYECTO", "CONSULTOR_PROYECTO"] as const
export type InteradminAssignmentRole = (typeof ASSIGNMENT_ROLES)[number]
