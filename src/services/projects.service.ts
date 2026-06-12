import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAssignedInteradminIdsForCurrentUser } from "@/services/interadmin-access"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"

// ── Lista de interadministrativos ─────────────────────────────────────────────

type ProjectListFilters = {
  estado?: EstadoInteradministrativo | "all"
  secretaria?: string | "all"
  area?: string | "all"
}

async function fetchProjects(
  filters?: ProjectListFilters,
  options?: { skipAssignmentFilter?: boolean }
): Promise<Interadministrativo[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("interadministrativos")
    .select("*")
    .order("id_contrato", { ascending: true })

  if (filters?.estado && filters.estado !== "all") {
    query = query.eq("estado", filters.estado)
  }
  if (filters?.secretaria && filters.secretaria !== "all") {
    query = query.eq("secretaria", filters.secretaria)
  }
  if (filters?.area && filters.area !== "all") {
    query = query.eq("area_responsable", filters.area)
  }

  if (!options?.skipAssignmentFilter) {
    const assignedIds = await getAssignedInteradminIdsForCurrentUser()
    if (assignedIds !== null) {
      if (assignedIds.length === 0) return []
      query = query.in("id", assignedIds)
    }
  }

  const { data, error } = await query.limit(5000)
  if (error) throw new Error(error.message)
  return (data ?? []) as Interadministrativo[]
}

/** Listado de proyectos — respeta asignaciones por rol. */
export async function getProjects(filters?: ProjectListFilters): Promise<Interadministrativo[]> {
  return fetchProjects(filters)
}

/** Dashboard ejecutivo — todos los contratos, sin filtro de asignación. */
export async function getProjectsForDashboard(
  filters?: ProjectListFilters
): Promise<Interadministrativo[]> {
  return fetchProjects(filters, { skipAssignmentFilter: true })
}

// Alias explícito
export const getInteradministrativos = getProjects

// ── Por ID (id_contrato) ──────────────────────────────────────────────────────

export async function getProjectById(
  idContrato: string
): Promise<Interadministrativo | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("interadministrativos")
    .select("*")
    .eq("id_contrato", idContrato)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as Interadministrativo | null
}

// Por id numérico (BIGSERIAL) — para rutas /proyectos/[id]
export async function getProjectByNumericId(
  id: number
): Promise<Interadministrativo | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("interadministrativos")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as Interadministrativo | null
}

// ── Catálogos de filtros ──────────────────────────────────────────────────────

export async function getProjectFilterCatalogs(): Promise<{
  entities: string[]
  secretarias: string[]
  areas: string[]
  years: number[]
}> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("interadministrativos")
    .select("secretaria, area_responsable, fecha_suscripcion")
    .limit(5000)

  if (error) throw new Error(error.message)

  const entities   = new Set<string>()
  const secretarias = new Set<string>()
  const areas      = new Set<string>()
  const years      = new Set<number>()

  for (const row of data ?? []) {
    if (row.secretaria) {
      secretarias.add(row.secretaria)
      entities.add(row.secretaria)
    }
    if (row.area_responsable) {
      areas.add(row.area_responsable)
      entities.add(row.area_responsable)
    }
    if (row.fecha_suscripcion) {
      const y = new Date(row.fecha_suscripcion).getFullYear()
      if (!isNaN(y)) years.add(y)
    }
  }

  return {
    entities:   [...entities].sort(),
    secretarias: [...secretarias].sort(),
    areas:      [...areas].sort(),
    years:      [...years].sort((a, b) => b - a),
  }
}

// ── getGlobalIndicators — stub (indicadores no implementados en nuevo esquema) ──

export async function getGlobalIndicators(): Promise<never[]> {
  return []
}

// ── getProjectKanbanCards — devuelve Interadministrativo como forma de tarjeta ─

export async function getProjectKanbanCards(): Promise<Interadministrativo[]> {
  return getProjects()
}

// ── Stubs para project-expediente.service.ts ─────────────────────────────────

export async function getProjectContractTree(_projectId: string) {
  return []
}

export async function getProjectFollowups(_projectId: string) {
  return []
}

export async function getProjectAssignments(_projectId: string) {
  return []
}

// ── No-op para backward compatibility (no hay asignaciones en nuevo esquema) ──

export async function enrichProjectsWithManagers(
  projects: Interadministrativo[]
): Promise<Interadministrativo[]> {
  return projects
}
