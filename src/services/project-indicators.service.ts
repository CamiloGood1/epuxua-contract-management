import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ProjectIndicator, ProjectType } from "@/types/project"

function mapIndicatorRow(row: Record<string, unknown>): ProjectIndicator {
  const periodDate = row.period_date as string | null | undefined
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    indicator_name: String(row.indicator_name ?? ""),
    indicator_value:
      row.indicator_value != null
        ? Number(row.indicator_value)
        : row.current_value != null
          ? Number(row.current_value)
          : null,
    target_value: row.target_value != null ? Number(row.target_value) : null,
    unit: (row.unit as string | null) ?? null,
    period_label:
      (row.period_label as string | null) ??
      (periodDate ? String(periodDate).slice(0, 7) : null),
    recorded_at:
      (row.recorded_at as string | null) ??
      (row.created_at as string | null) ??
      null,
  }
}

async function fetchIndicatorsFromView(
  projectId?: string
): Promise<ProjectIndicator[] | null> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("v_project_indicators_app")
    .select("*")
    .order("recorded_at", { ascending: false })

  if (projectId) {
    query = query.eq("project_id", projectId)
  }

  const { data, error } = await query
  if (error || !data) return null
  return data.map((row) => mapIndicatorRow(row as Record<string, unknown>))
}

async function fetchIndicatorsFromTable(
  projectId?: string
): Promise<ProjectIndicator[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("project_indicators")
    .select("*")
    .order("created_at", { ascending: false })

  if (projectId) {
    query = query.eq("project_id", projectId)
  }

  const { data, error } = await query
  if (error) return []
  return (data ?? []).map((row) => mapIndicatorRow(row as Record<string, unknown>))
}

export async function getProjectIndicators(
  projectId: string
): Promise<ProjectIndicator[]> {
  const fromView = await fetchIndicatorsFromView(projectId)
  if (fromView) return fromView
  return fetchIndicatorsFromTable(projectId)
}

export async function getGlobalIndicators(filters?: {
  year?: number
  projectType?: ProjectType | "all"
}) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("project_indicators")
    .select(
      `
      *,
      projects ( project_code, name, project_type, year )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    const mapped = await fetchIndicatorsFromView()
    if (!mapped) return []
    return mapped.map((ind) => ({ ...ind, projects: null }))
  }

  let rows = (data ?? []).map((row) => ({
    ...mapIndicatorRow(row as Record<string, unknown>),
    projects: row.projects,
  }))

  if (filters?.year) {
    rows = rows.filter((r) => {
      const p = r.projects as { year?: number } | { year?: number }[] | null
      const proj = Array.isArray(p) ? p[0] : p
      return proj?.year === filters.year
    })
  }
  if (filters?.projectType && filters.projectType !== "all") {
    rows = rows.filter((r) => {
      const p = r.projects as { project_type?: string } | { project_type?: string }[] | null
      const proj = Array.isArray(p) ? p[0] : p
      return proj?.project_type === filters.projectType
    })
  }

  return rows
}
