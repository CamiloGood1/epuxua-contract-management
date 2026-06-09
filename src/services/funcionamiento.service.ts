import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface FuncionamientoContract {
  // Identificación
  id: string
  contract_number: string
  year: number
  contract_type: string
  selection_modality: string | null
  contract_class: string | null
  resource_type: string | null

  // Descripción
  object: string | null

  // Partes
  contractor_name: string
  contractor_document: string | null
  contractor_person_type: string | null
  supervisor_name: string | null
  area_name: string | null
  interventor: string | null

  // PAA
  paa_code: string | null
  paa_description: string | null
  paa_estimated_value: number | null

  // Fechas
  subscription_date: string | null
  publication_date: string | null
  start_date: string | null
  initial_term_text: string | null
  initial_term_days: number | null
  end_date: string | null
  liquidation_date: string | null

  // Valores financieros
  monthly_value: number | null
  initial_value: number
  total_additions_value: number
  final_value: number
  paid_value: number
  pending_value: number
  future_validity: number

  // Estado
  status: string

  // Externos
  secop_url: string | null
  observations: string | null

  // Calculados
  financial_progress_pct: number
  days_remaining: number | null

  // Póliza
  policy_number: string | null
  policy_issuer: string | null
  policy_start: string | null
  policy_end: string | null

  // Referencia al proyecto contenedor (interno, no se muestra en UI)
  project_id: string | null
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

  // contracts tiene project_id; v_contract_detail no lo expone — se hace en dos pasos.
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
    resource_type: c.resource_type ? String(c.resource_type) : null,
    object: c.object ? String(c.object) : null,
    contractor_name: String(c.contractor_name ?? ""),
    contractor_document: c.contractor_document ? String(c.contractor_document) : null,
    contractor_person_type: c.contractor_person_type ? String(c.contractor_person_type) : null,
    supervisor_name: c.supervisor_name ? String(c.supervisor_name) : null,
    area_name: c.area_name ? String(c.area_name) : null,
    interventor: c.interventor ? String(c.interventor) : null,
    paa_code: c.paa_code ? String(c.paa_code) : null,
    paa_description: c.paa_description ? String(c.paa_description) : null,
    paa_estimated_value: c.paa_estimated_value != null ? Number(c.paa_estimated_value) : null,
    subscription_date: c.subscription_date ? String(c.subscription_date) : null,
    publication_date: c.publication_date ? String(c.publication_date) : null,
    start_date: c.start_date ? String(c.start_date) : null,
    initial_term_text: c.initial_term_text ? String(c.initial_term_text) : null,
    initial_term_days: c.initial_term_days != null ? Number(c.initial_term_days) : null,
    end_date: c.end_date ? String(c.end_date) : null,
    liquidation_date: c.liquidation_date ? String(c.liquidation_date) : null,
    monthly_value: c.monthly_value != null ? Number(c.monthly_value) : null,
    initial_value: Number(c.initial_value ?? 0),
    total_additions_value: Number(c.total_additions_value ?? 0),
    final_value: Number(c.final_value ?? 0),
    paid_value: Number(c.paid_value ?? 0),
    pending_value: Number(c.pending_value ?? 0),
    future_validity: Number(c.future_validity ?? 0),
    status: String(c.status ?? ""),
    secop_url: c.secop_url ? String(c.secop_url) : null,
    observations: c.observations ? String(c.observations) : null,
    financial_progress_pct: Number(c.financial_progress_pct ?? 0),
    days_remaining: c.days_remaining != null ? Number(c.days_remaining) : null,
    policy_number: c.policy_number ? String(c.policy_number) : null,
    policy_issuer: c.policy_issuer ? String(c.policy_issuer) : null,
    policy_start: c.policy_start ? String(c.policy_start) : null,
    policy_end: c.policy_end ? String(c.policy_end) : null,
    project_id: contractProjectMap.get(String(c.id)) ?? null,
  }))
}
