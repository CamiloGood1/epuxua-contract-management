/**
 * Capa de compatibilidad — todas las funciones y constantes delegan en src/lib/auth/permissions.ts.
 * Los callers existentes no necesitan cambiar sus imports.
 * Para agregar permisos nuevos, editar permissions.ts directamente.
 */
import type { UserRole } from "@/types/project"
import {
  ROLE_LABELS,
  ROLE_ORDER,
  canCreateInteradmin,
  canCreateDerivado,
  canCreateModification,
  canEditModification,
  canEditProject,
  canEditFinancialData,
  canDeleteAny,
  canDownloadReportFor,
  canManageUsersInSystem,
  canViewAllContracts,
  canReadAllContracts,
  isReadOnlyUser,
} from "@/lib/auth/permissions"

// ── Re-exports directos de permissions.ts ─────────────────────────────────────

export {
  ROLE_LABELS,
  ROLE_ORDER,
  canCreateInteradmin,
  canCreateDerivado,
  canCreateModification,
  canEditModification,
}

// ── Aliases con los nombres históricos (backward compatibility) ───────────────

/** @deprecated Usar canCreateInteradmin o canCreateDerivado según el contexto. */
export function canCreateProject(role: UserRole | null | undefined): boolean {
  return canCreateInteradmin(role)
}

export function canEditProjects(role: UserRole | null | undefined): boolean {
  return canEditProject(role)
}

export function canDeleteProject(role: UserRole | null | undefined): boolean {
  return canDeleteAny(role)
}

export function isReadOnlyRole(role: UserRole | null | undefined): boolean {
  return isReadOnlyUser(role)
}

export function canEditFinancialTabs(role: UserRole | null | undefined): boolean {
  return canEditFinancialData(role)
}

export function canDownloadReport(role: UserRole | null | undefined): boolean {
  return canDownloadReportFor(role)
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return canManageUsersInSystem(role)
}

export function canViewAllInteradmins(role: UserRole | null | undefined): boolean {
  return canViewAllContracts(role)
}

export function canReadAllInteradmins(role: UserRole | null | undefined): boolean {
  return canReadAllContracts(role)
}

export function roleLabel(role: UserRole | null | undefined): string {
  if (!role) return "Usuario"
  return ROLE_LABELS[role] ?? role
}

// ── Funciones contextuales (dependen de assignedIds) ─────────────────────────

export function canAccessInteradmin(
  role: UserRole | null | undefined,
  interadminId: number,
  assignedIds: ReadonlySet<number> | readonly number[]
): boolean {
  if (!role) return false
  if (canReadAllContracts(role)) return true
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
  if (canViewAllContracts(role)) return true  // ADMIN, GERENTE, SECRETARIA_GENERAL
  if (role === "GERENTE_PROYECTO") {
    const set = assignedIds instanceof Set ? assignedIds : new Set(assignedIds)
    return set.has(interadminId)
  }
  return false
}

// ── Constantes de roles ───────────────────────────────────────────────────────

/** Roles que pueden ser invitados/creados por un administrador (excluye ADMIN). */
export const INVITABLE_ROLES: UserRole[] = [
  "GERENTE",
  "DIRECTIVO",
  "SECRETARIA_GENERAL",
  "GERENTE_PROYECTO",
  "ESTRUCTURADOR",
  "CONSULTOR_PROYECTO",
  "ESPECTADOR",
  "SUBADMINISTRATIVA",
]

export const ASSIGNMENT_ROLES = ["GERENTE_PROYECTO", "CONSULTOR_PROYECTO"] as const
export type InteradminAssignmentRole = (typeof ASSIGNMENT_ROLES)[number]
