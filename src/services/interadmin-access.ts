import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  canAccessInteradmin,
  canReadAllInteradmins,
  canViewAllInteradmins,
  canWriteInteradmin,
} from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import type { UserRole } from "@/types/project"

export interface AccessContext {
  role: UserRole
  userId: string
  assignedIds: Set<number>
}

async function loadAccessContext(): Promise<AccessContext | null> {
  const profile = await getCurrentUserProfile()
  if (!profile?.role) return null

  if (canReadAllInteradmins(profile.role)) {
    return { role: profile.role, userId: profile.id, assignedIds: new Set() }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("interadmin_assignments" as never)
    .select("interadministrativo_id")
    .eq("user_id", profile.id)
    .eq("active", true)

  if (error) throw new Error(error.message)

  const assignedIds = new Set(
    ((data ?? []) as { interadministrativo_id: number }[]).map((r) => r.interadministrativo_id)
  )

  return { role: profile.role, userId: profile.id, assignedIds }
}

/** null = sin filtro (ve todos); [] = ninguno asignado */
export async function getAssignedInteradminIdsForCurrentUser(): Promise<number[] | null> {
  const profile = await getCurrentUserProfile()
  if (!profile?.role) return []

  if (canReadAllInteradmins(profile.role)) return null

  const ctx = await loadAccessContext()
  if (!ctx) return []
  return [...ctx.assignedIds]
}

export async function canCurrentUserAccessInteradmin(interadminId: number): Promise<boolean> {
  const ctx = await loadAccessContext()
  if (!ctx) return false
  return canAccessInteradmin(ctx.role, interadminId, ctx.assignedIds)
}

export async function assertInteradminWriteAccess(
  interadminId: number
): Promise<{ error: string | null }> {
  const ctx = await loadAccessContext()
  if (!ctx) return { error: "Sin permisos para editar." }
  if (!canWriteInteradmin(ctx.role, interadminId, ctx.assignedIds)) {
    return { error: "No tiene acceso para editar este contrato interadministrativo." }
  }
  return { error: null }
}

export async function getAccessContextForCurrentUser(): Promise<AccessContext | null> {
  return loadAccessContext()
}

export function shouldFilterProjectsByAssignment(role: UserRole | null | undefined): boolean {
  if (!role) return true
  return !canViewAllInteradmins(role) && !canReadAllInteradmins(role)
}
