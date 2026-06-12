"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getLoginRedirectUrl } from "@/lib/app-url"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { InteradminAssignmentRole } from "@/modules/projects/lib/access"
import { canManageUsers } from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import type { UserRole } from "@/types/project"

type ActionResult = { error: string | null; success?: boolean; message?: string }

function validateNewUserInput(
  email: string,
  full_name: string,
  role: UserRole
): string | null {
  if (!email || !full_name) return "Correo y nombre son obligatorios."
  if (role === "ADMIN") return "No se puede crear con rol Administrador."
  return null
}

async function syncUserProfileRole(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  full_name: string,
  role: UserRole
) {
  await admin.from("user_profiles").upsert({
    id: userId,
    full_name,
    role,
    active: true,
    updated_at: new Date().toISOString(),
  })
}

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

  const validation = validateNewUserInput(email, full_name, input.role)
  if (validation) return { error: validation }

  try {
    const admin = createSupabaseAdminClient()
    const redirectTo = getLoginRedirectUrl()

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: input.role },
      redirectTo,
    })

    if (error) return { error: error.message }

    revalidateUserRoutes()
    return {
      error: null,
      success: true,
      message: `Se envió correo a ${email}. El enlace usará ${redirectTo ?? "la Site URL de Supabase"}.`,
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al enviar la invitación.",
    }
  }
}

export async function createUserWithPassword(input: {
  email: string
  full_name: string
  role: UserRole
  password: string
}): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const email = input.email.trim().toLowerCase()
  const full_name = input.full_name.trim()
  const password = input.password

  const validation = validateNewUserInput(email, full_name, input.role)
  if (validation) return { error: validation }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." }
  }

  try {
    const admin = createSupabaseAdminClient()

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: input.role },
    })

    if (error) return { error: error.message }
    if (!data.user) return { error: "No se pudo crear el usuario." }

    await syncUserProfileRole(admin, data.user.id, full_name, input.role)

    revalidateUserRoutes()
    return {
      error: null,
      success: true,
      message: `Usuario ${email} creado. Comparta la contraseña asignada por un canal seguro. El usuario puede cambiarla en el menú superior → Cambiar contraseña.`,
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al crear el usuario.",
    }
  }
}

export async function resetUserPassword(input: {
  userId: string
  password: string
}): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }
  if (input.password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." }
  }

  try {
    const admin = createSupabaseAdminClient()
    const { error } = await admin.auth.admin.updateUserById(input.userId, {
      password: input.password,
    })
    if (error) return { error: error.message }
    return {
      error: null,
      success: true,
      message: "Contraseña actualizada. Comunique la nueva contraseña al usuario.",
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al actualizar la contraseña.",
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
