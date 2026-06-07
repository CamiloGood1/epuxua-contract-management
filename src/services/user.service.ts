import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/project"
import type { ProjectAlert } from "@/types/project"

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    return {
      id: user.id,
      email: user.email ?? null,
      full_name: null,
      role: "ESPECTADOR",
    }
  }

  return {
    ...(data as Omit<UserProfile, "email">),
    email: user.email ?? null,
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

  if (projectsError) throw new Error(projectsError.message)

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
