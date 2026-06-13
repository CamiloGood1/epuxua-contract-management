import type { UserRole } from "@/types/project"

// ADMIN y ESTRUCTURADOR pueden crear y editar propuestas
const PROPOSAL_WRITE_ROLES: UserRole[] = ["ADMIN", "ESTRUCTURADOR"]

export function canCreateProposal(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return PROPOSAL_WRITE_ROLES.includes(role)
}

export function canEditProposal(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return PROPOSAL_WRITE_ROLES.includes(role)
}

export function canDeleteProposal(role: UserRole | null | undefined): boolean {
  return role === "ADMIN"
}

export function canViewProposals(role: UserRole | null | undefined): boolean {
  return !!role
}
