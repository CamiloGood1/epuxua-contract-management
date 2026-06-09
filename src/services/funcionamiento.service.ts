import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface FuncionamientoContract {
  id: string
  contract_number: string
  year: number
  contract_type: string
  selection_modality: string | null
  contract_class: string | null
  object: string | null
  area_name: string | null
  contractor_name: string
  supervisor_name: string | null
  start_date: string | null
  end_date: string | null
  subscription_date: string | null
  initial_value: number
  total_additions_value: number
  final_value: number
  paid_value: number
  status: string
  days_remaining: number | null
  project_id: string | null
  project_code: string | null
}

export async function getFuncionamientoContracts(): Promise<FuncionamientoContract[]> {
  const supabase = await createSupabaseServerClient()

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, project_code, year")
    .eq("project_type", "FUNCIONAMIENTO")

  if (projectsError) throw new Error(projectsError.message)
  if (!projects?.length) return []

  const projectIds = projects.map((p) => p.id)
  const projectMap = new Map(projects.map((p) => [p.id as string, p.project_code as string]))

  // v_contract_detail expone project_id — se filtra con .or() igual que en las rutas de reportes
  const orFilter = projectIds.map((id) => `project_id.eq.${id}`).join(",")

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .or(orFilter)
    .order("year", { ascending: false })
    .order("contract_number", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: String(c.id),
    contract_number: String(c.contract_number ?? ""),
    year: Number(c.year ?? 0),
    contract_type: String(c.contract_type ?? ""),
    selection_modality: c.selection_modality ? String(c.selection_modality) : null,
    contract_class: c.contract_class ? String(c.contract_class) : null,
    object: c.object ? String(c.object) : null,
    area_name: c.area_name ? String(c.area_name) : null,
    contractor_name: String(c.contractor_name ?? ""),
    supervisor_name: c.supervisor_name ? String(c.supervisor_name) : null,
    start_date: c.start_date ? String(c.start_date) : null,
    end_date: c.end_date ? String(c.end_date) : null,
    subscription_date: c.subscription_date ? String(c.subscription_date) : null,
    initial_value: Number(c.initial_value ?? 0),
    total_additions_value: Number(c.total_additions_value ?? 0),
    final_value: Number(c.final_value ?? 0),
    paid_value: Number(c.paid_value ?? 0),
    status: String(c.status ?? ""),
    days_remaining: c.days_remaining != null ? Number(c.days_remaining) : null,
    project_id: c.project_id ? String(c.project_id) : null,
    project_code: c.project_id ? (projectMap.get(String(c.project_id)) ?? null) : null,
  }))
}
