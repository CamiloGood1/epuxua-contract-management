import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  ProjectDetail,
  ProjectKanbanCard,
  ProjectDashboardMetrics,
  ProjectContractTreeNode,
  ProjectFollowup,
  ProjectAssignment,
  ProjectLifecycle,
  ProjectType,
} from "@/types/project"

/** FK explícita: project_assignments.user_id y assigned_by apuntan a user_profiles */
const PROFILE_VIA_USER_ID = "user_profiles!user_id"

function profileFullName(
  profile: { full_name: string | null } | { full_name: string | null }[] | null
): string | null {
  const p = Array.isArray(profile) ? profile[0] : profile
  return p?.full_name ?? null
}

// ── Lista de proyectos (v_project_detail) ─────────────────────────────────────

export async function getProjects(filters?: {
  lifecycle?: ProjectLifecycle | "all"
  type?: ProjectType | "all"
  year?: number
  entity?: string
  manager?: string
}): Promise<ProjectDetail[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("v_project_detail")
    .select("*")
    .order("year", { ascending: false })
    .order("project_code", { ascending: true })

  if (filters?.lifecycle && filters.lifecycle !== "all") {
    query = query.eq("lifecycle_status", filters.lifecycle)
  }
  if (filters?.type && filters.type !== "all") {
    query = query.eq("project_type", filters.type)
  }
  if (filters?.year) {
    query = query.eq("year", filters.year)
  }
  if (filters?.entity && filters.entity !== "all") {
    query = query.or(
      `area_name.eq.${filters.entity},secretaria.eq.${filters.entity}`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as ProjectDetail[]
}

// ── Proyecto por ID ───────────────────────────────────────────────────────────

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_project_detail")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as ProjectDetail | null
}

// ── Kanban (v_project_kanban) ─────────────────────────────────────────────────

export async function getProjectKanbanCards(): Promise<ProjectKanbanCard[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_project_kanban")
    .select("*")
    .order("project_code", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProjectKanbanCard[]
}

// ── Dashboard (v_project_dashboard) ─────────────────────────────────────────

function emptyLifecycleCounts(): Record<ProjectLifecycle, number> {
  return {
    PLANEACION: 0,
    CONTRATACION: 0,
    EJECUCION: 0,
    SEGUIMIENTO: 0,
    LIQUIDACION: 0,
    CERRADO: 0,
  }
}

function emptyTypeCounts(): Record<ProjectType, number> {
  return {
    INTERADMINISTRATIVO: 0,
    FUNCIONAMIENTO: 0,
    OPERACION_COMERCIAL: 0,
    TIENDA_VIRTUAL: 0,
    PAGO_FACTURA: 0,
  }
}

export async function getProjectDashboardMetrics(): Promise<ProjectDashboardMetrics> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.from("v_project_dashboard").select("*")

  if (error) throw new Error(error.message)

  const rows = data ?? []

  // Vista puede ser filas agregadas o una sola fila KPI
  if (rows.length === 1 && rows[0].total_projects != null) {
    const row = rows[0]
    return {
      total_projects: row.total_projects ?? 0,
      active_projects: row.active_projects ?? 0,
      closed_projects: row.closed_projects ?? 0,
      total_value: Number(row.total_value ?? 0),
      total_executed: Number(row.total_executed ?? row.executed_value ?? 0),
      total_available: Number(row.total_available ?? row.available_balance ?? 0),
      avg_execution_pct: Number(row.avg_execution_pct ?? row.execution_pct ?? 0),
      projects_with_alerts: row.projects_with_alerts ?? row.active_alerts ?? 0,
      by_lifecycle: {
        ...emptyLifecycleCounts(),
        ...(row.by_lifecycle ?? {}),
      },
      by_type: {
        ...emptyTypeCounts(),
        ...(row.by_type ?? {}),
      },
    }
  }

  // Filas por lifecycle/type — agregar desde proyectos si la vista es desnormalizada
  const byLifecycle = emptyLifecycleCounts()
  const byType = emptyTypeCounts()
  let totalValue = 0
  let totalExecuted = 0
  let totalAvailable = 0
  let executionSum = 0
  let withAlerts = 0

  for (const row of rows) {
    const lifecycle = row.lifecycle_status as ProjectLifecycle | undefined
    const type = row.project_type as ProjectType | undefined
    if (lifecycle && lifecycle in byLifecycle) {
      byLifecycle[lifecycle] += row.project_count ?? row.count ?? 1
    }
    if (type && type in byType) {
      byType[type] += row.project_count ?? row.count ?? 1
    }
    totalValue += Number(row.total_value ?? 0)
    totalExecuted += Number(row.executed_value ?? row.total_executed ?? 0)
    totalAvailable += Number(row.available_balance ?? 0)
    executionSum += Number(row.execution_pct ?? row.avg_execution_pct ?? 0)
    if ((row.active_alerts_count ?? 0) > 0) withAlerts += 1
  }

  const totalProjects =
    rows.reduce((s, r) => s + (r.project_count ?? r.count ?? 0), 0) || rows.length

  return {
    total_projects: totalProjects,
    active_projects: byLifecycle.EJECUCION + byLifecycle.SEGUIMIENTO + byLifecycle.CONTRATACION,
    closed_projects: byLifecycle.CERRADO,
    total_value: totalValue,
    total_executed: totalExecuted,
    total_available: totalAvailable,
    avg_execution_pct: rows.length ? executionSum / rows.length : 0,
    projects_with_alerts: withAlerts,
    by_lifecycle: byLifecycle,
    by_type: byType,
  }
}

// ── Árbol contractual (v_project_contract_tree + fallback) ────────────────────

type ContractRole = ProjectContractTreeNode["contract_role"]

function mapToTreeNode(
  projectId: string,
  row: Record<string, unknown>,
  depth: number,
  role: ContractRole
): ProjectContractTreeNode {
  return {
    project_id: projectId,
    contract_id: row.id as string,
    contract_number: row.contract_number as string,
    contract_role: role,
    parent_contract_id: (row.parent_contract_id as string | null) ?? null,
    depth,
    contractor_name: (row.contractor_name as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    final_value: row.final_value != null ? Number(row.final_value) : null,
    paid_value: row.paid_value != null ? Number(row.paid_value) : null,
    object: (row.object as string | null) ?? null,
    secop_url: (row.secop_url as string | null) ?? null,
  }
}

async function buildContractTreeFallback(
  projectId: string
): Promise<ProjectContractTreeNode[]> {
  const supabase = await createSupabaseServerClient()

  const { data: project, error: projectError } = await supabase
    .from("v_project_detail")
    .select("id, primary_contract_id, project_type")
    .eq("id", projectId)
    .single()

  if (projectError || !project) return []

  const nodes: ProjectContractTreeNode[] = []

  if (project.primary_contract_id) {
    const { data: principal } = await supabase
      .from("v_contract_detail")
      .select("*")
      .eq("id", project.primary_contract_id)
      .maybeSingle()

    if (principal) {
      nodes.push(mapToTreeNode(projectId, principal, 0, "PRINCIPAL"))
    }

    const { data: derived } = await supabase
      .from("v_contract_detail")
      .select("*")
      .eq("parent_contract_id", project.primary_contract_id)
      .order("contract_number", { ascending: true })

    for (const row of derived ?? []) {
      nodes.push(mapToTreeNode(projectId, row, 1, "DERIVADO"))
    }
  }

  // Contratos operativos del proyecto (funcionamiento, TV, etc.)
  let operativosQuery = supabase
    .from("contracts")
    .select("id")
    .eq("project_id", projectId)
    .is("parent_contract_id", null)

  if (project.primary_contract_id) {
    operativosQuery = operativosQuery.neq("id", project.primary_contract_id)
  }

  const { data: operativoIds } = await operativosQuery

  if (operativoIds?.length) {
    const ids = operativoIds.map((r) => r.id)
    const { data: details } = await supabase
      .from("v_contract_detail")
      .select("*")
      .in("id", ids)
      .order("contract_number", { ascending: true })

    for (const row of details ?? []) {
      nodes.push(mapToTreeNode(projectId, row, 0, "OPERATIVO"))
    }
  }

  return nodes
}

export async function getProjectContractTree(
  projectId: string
): Promise<ProjectContractTreeNode[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_project_contract_tree")
    .select("*")
    .eq("project_id", projectId)
    .order("depth", { ascending: true })
    .order("contract_number", { ascending: true })

  if (!error && data && data.length > 0) {
    return data as ProjectContractTreeNode[]
  }

  return buildContractTreeFallback(projectId)
}

// ── Seguimiento (project_followups) ───────────────────────────────────────────

export async function getProjectFollowups(
  projectId: string
): Promise<ProjectFollowup[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("project_followups")
    .select("*")
    .eq("project_id", projectId)
    .order("followup_date", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProjectFollowup[]
}

// ── Asignaciones (project_assignments + user_profiles) ───────────────────────

export async function getProjectAssignments(
  projectId: string
): Promise<ProjectAssignment[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("project_assignments")
    .select(
      `
      id,
      project_id,
      user_id,
      assignment_role,
      start_date,
      end_date,
      active,
      ${PROFILE_VIA_USER_ID} ( full_name )
    `
    )
    .eq("project_id", projectId)
    .order("start_date", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const p = profileFullName(
      row.user_profiles as
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null
    )
    return {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      assignment_role: row.assignment_role,
      start_date: row.start_date,
      end_date: row.end_date,
      active: row.active,
      user_name: p,
      user_email: null,
    } as ProjectAssignment
  })
}

// ── Catálogos para filtros ────────────────────────────────────────────────────

export async function getProjectFilterCatalogs(): Promise<{
  entities: string[]
  managers: string[]
  years: number[]
}> {
  const supabase = await createSupabaseServerClient()

  const [{ data: projects, error: projectsError }, { data: assignments, error: assignError }] =
    await Promise.all([
      supabase.from("v_project_detail").select("year, area_name, secretaria"),
      supabase
        .from("project_assignments")
        .select(`${PROFILE_VIA_USER_ID} ( full_name )`)
        .eq("active", true)
        .eq("assignment_role", "GERENTE_PROYECTO"),
    ])

  if (projectsError) throw new Error(projectsError.message)
  if (assignError) throw new Error(assignError.message)

  const entities = new Set<string>()
  const managers = new Set<string>()
  const years = new Set<number>()

  for (const row of projects ?? []) {
    if (row.area_name) entities.add(row.area_name)
    if (row.secretaria) entities.add(row.secretaria)
    if (row.year) years.add(row.year)
  }

  for (const row of assignments ?? []) {
    const name = profileFullName(
      row.user_profiles as
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null
    )
    if (name) managers.add(name)
  }

  return {
    entities: [...entities].sort(),
    managers: [...managers].sort(),
    years: [...years].sort((a, b) => b - a),
  }
}

/** Añade manager_name desde project_assignments (no existe en v_project_detail) */
export async function enrichProjectsWithManagers(
  projects: ProjectDetail[]
): Promise<ProjectDetail[]> {
  if (projects.length === 0) return projects

  const supabase = await createSupabaseServerClient()
  const ids = projects.map((p) => p.id)

  const { data, error } = await supabase
    .from("project_assignments")
    .select(`project_id, ${PROFILE_VIA_USER_ID} ( full_name )`)
    .in("project_id", ids)
    .eq("active", true)
    .eq("assignment_role", "GERENTE_PROYECTO")

  if (error) throw new Error(error.message)

  const managerByProject = new Map<string, string>()
  for (const row of data ?? []) {
    if (managerByProject.has(row.project_id)) continue
    const name = profileFullName(
      row.user_profiles as
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null
    )
    if (name) managerByProject.set(row.project_id, name)
  }

  return projects.map((p) => ({
    ...p,
    manager_name: managerByProject.get(p.id) ?? null,
  }))
}

// ── Indicadores (v_project_indicators_app + fallback) ────────────────────────

export {
  getGlobalIndicators,
  getProjectIndicators,
} from "./project-indicators.service"
