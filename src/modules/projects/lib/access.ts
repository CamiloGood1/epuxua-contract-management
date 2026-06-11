import type { UserRole } from "@/types/project"

const READ_ONLY_ROLES: UserRole[] = ["DIRECTIVO", "CONSULTOR_PROYECTO", "ESPECTADOR"]
const CREATE_ROLES:    UserRole[] = ["ADMIN", "GERENTE", "GERENTE_PROYECTO"]
const DELETE_ROLES:    UserRole[] = ["ADMIN"]

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

export function roleLabel(role: UserRole | null | undefined): string {
  const labels: Record<UserRole, string> = {
    ADMIN:              "Administrador",
    GERENTE:            "Gerente de Proyecto",
    GERENTE_PROYECTO:   "Gerente de Proyecto",
    DIRECTIVO:          "Directivo",
    CONSULTOR_PROYECTO: "Consultor de Proyecto",
    ESPECTADOR:         "Espectador",
  }
  if (!role) return "Usuario"
  return labels[role] ?? role
}
