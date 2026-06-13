import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/project"
import type { ProjectAlert } from "@/types/project"

type ProfileRow = {
  id: string
  full_name: string
  role: UserRole
  active?: boolean
}

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  active: boolean
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.warn("[getCurrentUserProfile] auth:", authError.message)
    }
    const user = data?.user ?? null
    if (!user) return null

    const userId = user.id

    async function loadProfile(withActive: boolean): Promise<{
      data: ProfileRow | null
      error: { message: string; code?: string } | null
    }> {
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select(withActive ? "id, full_name, role, active" : "id, full_name, role")
        .eq("id", userId)
        .maybeSingle()
      return {
        data: (profileData as ProfileRow | null) ?? null,
        error: error ? { message: error.message, code: error.code } : null,
      }
    }

    let { data: profileRow, error } = await loadProfile(true)

    if (error && (error.message.includes("active") || error.code === "42703")) {
      const fallback = await loadProfile(false)
      profileRow = fallback.data ? { ...fallback.data, active: true } : null
      error = fallback.error
    }

    if (!profileRow) {
      try {
        await supabase.rpc("ensure_user_profile")
      } catch {
        // RPC opcional
      }
      const retry = await loadProfile(true)
      if (retry.error && (retry.error.message.includes("active") || retry.error.code === "42703")) {
        const fallback = await loadProfile(false)
        profileRow = fallback.data ? { ...fallback.data, active: true } : null
        error = fallback.error
      } else {
        profileRow = retry.data
        error = retry.error
      }
    }

    if (error) {
      console.warn("[getCurrentUserProfile]", error.message, "userId:", user.id)
    }

    if (!profileRow) {
      return {
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? user.email ?? null,
        role: "ESPECTADOR",
        active: true,
      }
    }

    return {
      id: profileRow.id,
      full_name: profileRow.full_name,
      role: profileRow.role as UserRole,
      active: "active" in profileRow ? Boolean(profileRow.active) : true,
      email: user.email ?? null,
    }
  } catch (err) {
    console.error("[getCurrentUserProfile]", err instanceof Error ? err.message : err)
    return null
  }
}

export async function getProjectAlerts(projectId?: string): Promise<ProjectAlert[]> {
  const supabase = await createSupabaseServerClient()

  // Intentar vista v_project_alerts
  let query = supabase.from("v_project_alerts").select("*").order("created_at", {
    ascending: false,
  })

  if (projectId) {
    query = query.eq("project_id", projectId)
  }

  const { data, error } = await query

  if (!error && data) {
    return data as ProjectAlert[]
  }

  // Fallback: alertas desde proyectos con contador activo
  const { data: projects, error: projectsError } = await supabase
    .from("v_project_detail")
    .select("id, project_code, name, active_alerts_count, lifecycle_status")
    .gt("active_alerts_count", 0)

  if (projectsError) {
    console.warn("[getProjectAlerts]", projectsError.message)
    return []
  }

  return (projects ?? []).flatMap((p) => {
    const count = p.active_alerts_count ?? 0
    if (projectId && p.id !== projectId) return []
    return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
      id: `${p.id}-alert-${i}`,
      project_id: p.id,
      project_code: p.project_code,
      project_name: p.name,
      alert_type: "SEGUIMIENTO",
      severity: "media" as const,
      title: `Alerta activa en ${p.project_code}`,
      description: `El proyecto tiene ${count} alerta(s) pendiente(s).`,
      is_active: true,
      created_at: new Date().toISOString(),
    }))
  })
}
