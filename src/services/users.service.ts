import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { canManageUsers } from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import type { InteradminAssignmentRole } from "@/modules/projects/lib/access"
import type { UserRole } from "@/types/project"

export interface UserDirectoryEntry {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  active: boolean
  created_at: string
  assignment_count: number
}

export interface InteradminAssignment {
  id: number
  interadministrativo_id: number
  user_id: string
  assignment_role: InteradminAssignmentRole
  active: boolean
  start_date: string
  end_date: string | null
  assigned_by: string | null
  created_at: string
  id_contrato?: string | null
  objeto_contrato?: string | null
}

export interface InteradminCatalogItem {
  id: number
  id_contrato: string
  objeto_contrato: string | null
}

export async function listUsers(): Promise<UserDirectoryEntry[]> {
  const profile = await getCurrentUserProfile()
  if (!canManageUsers(profile?.role)) return []

  const supabase = await createSupabaseServerClient()

  const { data: directory, error: dirError } = await supabase.rpc("get_user_directory" as never)

  let users: Omit<UserDirectoryEntry, "assignment_count">[] = []

  if (!dirError && directory && (directory as unknown[]).length > 0) {
    users = directory as Omit<UserDirectoryEntry, "assignment_count">[]
  } else {
    const { data: profiles, error: profError } = await supabase
      .from("user_profiles")
      .select("id, full_name, role, active, created_at")
      .order("created_at", { ascending: false })

    if (profError) {
      try {
        users = await listUsersWithServiceRole()
      } catch {
        throw new Error(profError.message)
      }
    } else {
      const emailMap = await fetchEmailsWithServiceRole()
      users = ((profiles ?? []) as Omit<UserDirectoryEntry, "email">[]).map((p) => ({
        ...p,
        email: emailMap.get(p.id) ?? null,
      }))
    }
  }

  const { data: counts, error: countError } = await supabase
    .from("interadmin_assignments" as never)
    .select("user_id")
    .eq("active", true)

  if (countError) {
    return users.map((u) => ({ ...u, assignment_count: 0 }))
  }

  const countMap = new Map<string, number>()
  for (const row of (counts ?? []) as { user_id: string }[]) {
    countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1)
  }

  return users.map((u) => ({
    ...u,
    assignment_count: countMap.get(u.id) ?? 0,
  }))
}

async function fetchEmailsWithServiceRole(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return map
    for (const u of data.users ?? []) {
      map.set(u.id, u.email ?? null)
    }
  } catch {
    // Sin service role: listar sin correos
  }
  return map
}

async function listUsersWithServiceRole(): Promise<Omit<UserDirectoryEntry, "assignment_count">[]> {
  const admin = createSupabaseAdminClient()
  const [{ data: profiles, error: profError }, emailMap] = await Promise.all([
    admin.from("user_profiles").select("id, full_name, role, active, created_at").order("created_at", { ascending: false }),
    fetchEmailsWithServiceRole(),
  ])
  if (profError) throw new Error(profError.message)
  return ((profiles ?? []) as Omit<UserDirectoryEntry, "email">[]).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }))
}

export async function listAssignmentsForUser(userId: string): Promise<InteradminAssignment[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("interadmin_assignments" as never)
    .select(
      "id, interadministrativo_id, user_id, assignment_role, active, start_date, end_date, assigned_by, created_at, interadministrativos(id_contrato, objeto_contrato)"
    )
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const inter = row.interadministrativos as
      | { id_contrato: string; objeto_contrato: string | null }
      | null
    return {
      id: row.id as number,
      interadministrativo_id: row.interadministrativo_id as number,
      user_id: row.user_id as string,
      assignment_role: row.assignment_role as InteradminAssignmentRole,
      active: row.active as boolean,
      start_date: row.start_date as string,
      end_date: row.end_date as string | null,
      assigned_by: row.assigned_by as string | null,
      created_at: row.created_at as string,
      id_contrato: inter?.id_contrato ?? null,
      objeto_contrato: inter?.objeto_contrato ?? null,
    }
  })
}

export async function listAssignmentsForInteradmin(
  interadminId: number
): Promise<InteradminAssignment[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("interadmin_assignments" as never)
    .select("*")
    .eq("interadministrativo_id", interadminId)
    .eq("active", true)

  if (error) throw new Error(error.message)
  return (data ?? []) as InteradminAssignment[]
}

export async function getInteradminCatalog(): Promise<InteradminCatalogItem[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("interadministrativos")
    .select("id, id_contrato, objeto_contrato")
    .order("id_contrato", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)
  return (data ?? []) as InteradminCatalogItem[]
}

export { getAssignedInteradminIdsForCurrentUser } from "@/services/interadmin-access"
