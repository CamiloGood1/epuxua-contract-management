"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { InteradminAssignmentRole } from "@/modules/projects/lib/access"
import { canManageUsers } from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import type { UserRole } from "@/types/project"

type ActionResult = { error: string | null; success?: boolean }

async function requireAdmin(): Promise<{ error: string | null; adminId?: string }> {
  const profile = await getCurrentUserProfile()
  if (!canManageUsers(profile?.role)) {
    return { error: "Solo un administrador puede realizar esta acción." }
  }
  if (!profile?.id) return { error: "Sesión no válida." }
  return { error: null, adminId: profile.id }
}

function revalidateUserRoutes() {
  revalidatePath("/administracion/usuarios")
  revalidatePath("/proyectos")
}

export async function inviteUser(input: {
  email: string
  full_name: string
  role: UserRole
}): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const email = input.email.trim().toLowerCase()
  const full_name = input.full_name.trim()

  if (!email || !full_name) return { error: "Correo y nombre son obligatorios." }
  if (input.role === "ADMIN") return { error: "No se puede invitar con rol Administrador." }

  try {
    const admin = createSupabaseAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
    const redirectTo = siteUrl ? `${siteUrl}/login` : undefined

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: input.role },
      redirectTo,
    })

    if (error) return { error: error.message }

    revalidateUserRoutes()
    return { error: null, success: true }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al enviar la invitación.",
    }
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("user_profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) return { error: error.message }

  revalidateUserRoutes()
  return { error: null, success: true }
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }
  if (userId === auth.adminId && !active) {
    return { error: "No puede desactivar su propia cuenta." }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("user_profiles")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) return { error: error.message }

  revalidateUserRoutes()
  return { error: null, success: true }
}

export async function assignInteradmin(input: {
  userId: string
  interadministrativoId: number
  assignmentRole?: InteradminAssignmentRole
}): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_assignments" as never).insert({
    user_id: input.userId,
    interadministrativo_id: input.interadministrativoId,
    assignment_role: input.assignmentRole ?? "GERENTE_PROYECTO",
    assigned_by: auth.adminId,
    active: true,
  } as never)

  if (error) {
    if (error.message.includes("uq_interadmin_assignment_active")) {
      return { error: "Este proyecto ya está asignado al usuario." }
    }
    return { error: error.message }
  }

  revalidateUserRoutes()
  return { error: null, success: true }
}

export async function unassignInteradmin(assignmentId: number): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("interadmin_assignments" as never)
    .update({ active: false } as never)
    .eq("id", assignmentId)

  if (error) return { error: error.message }

  revalidateUserRoutes()
  return { error: null, success: true }
}

export async function bulkAssignInteradmins(input: {
  userId: string
  interadministrativoIds: number[]
  assignmentRole?: InteradminAssignmentRole
}): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = await createSupabaseServerClient()

  const { data: existing, error: fetchErr } = await supabase
    .from("interadmin_assignments" as never)
    .select("id, interadministrativo_id")
    .eq("user_id", input.userId)
    .eq("active", true)

  if (fetchErr) return { error: fetchErr.message }

  const targetSet = new Set(input.interadministrativoIds)
  const existingRows = (existing ?? []) as { id: number; interadministrativo_id: number }[]
  const existingSet = new Set(existingRows.map((r) => r.interadministrativo_id))

  const toDeactivate = existingRows.filter((r) => !targetSet.has(r.interadministrativo_id))
  const toInsert = input.interadministrativoIds.filter((id) => !existingSet.has(id))

  for (const row of toDeactivate) {
    const { error } = await supabase
      .from("interadmin_assignments" as never)
      .update({ active: false } as never)
      .eq("id", row.id)
    if (error) return { error: error.message }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("interadmin_assignments" as never).insert(
      toInsert.map((interadministrativo_id) => ({
        user_id: input.userId,
        interadministrativo_id,
        assignment_role: input.assignmentRole ?? "GERENTE_PROYECTO",
        assigned_by: auth.adminId,
        active: true,
      })) as never
    )
    if (error) return { error: error.message }
  }

  revalidateUserRoutes()
  return { error: null, success: true }
}

export async function fetchUserAssignmentIds(
  userId: string
): Promise<{ error: string | null; ids: number[] }> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error, ids: [] }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("interadmin_assignments" as never)
    .select("interadministrativo_id")
    .eq("user_id", userId)
    .eq("active", true)

  if (error) return { error: error.message, ids: [] }

  const ids = ((data ?? []) as { interadministrativo_id: number }[]).map(
    (r) => r.interadministrativo_id
  )
  return { error: null, ids }
}
