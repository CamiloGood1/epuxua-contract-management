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

  // contracts tiene project_id; v_contract_detail no lo expone — se hace en dos pasos.
  // Se usa limit alto explícito para no depender del max_rows configurado en el proyecto.
  const { data: contractRefs, error: refsError } = await supabase
    .from("contracts")
    .select("id, project_id")
    .in("project_id", projectIds)
    .limit(5000)

  if (refsError) throw new Error(refsError.message)
  if (!contractRefs?.length) return []

  const contractIds = contractRefs.map((r) => r.id as string)
  const contractProjectMap = new Map(
    contractRefs.map((r) => [r.id as string, r.project_id as string])
  )

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .in("id", contractIds)
    .order("year", { ascending: false })
    .order("contract_number", { ascending: true })
    .limit(5000)

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
    project_id: contractProjectMap.get(String(c.id)) ?? null,
    project_code: (() => {
      const pid = contractProjectMap.get(String(c.id))
      return pid ? (projectMap.get(pid) ?? null) : null
    })(),
  }))
}
