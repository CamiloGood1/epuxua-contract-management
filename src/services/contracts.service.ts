import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  Contract,
  ContractFollowup,
  ContractTracking,
  ContractStatus,
} from "@/types/contract"

// ── Lista de contratos (vista con todos los joins) ────────────────────────────

export async function getContracts(filters?: {
  status?: ContractStatus | "all"
  year?: number
  area?: string
  type?: string
}): Promise<Contract[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("v_contract_detail")
    .select("*")
    .order("subscription_date", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters?.year) {
    query = query.eq("year", filters.year)
  }
  if (filters?.area && filters.area !== "all") {
    query = query.eq("area_name", filters.area)
  }
  if (filters?.type && filters.type !== "all") {
    query = query.eq("contract_type", filters.type)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Contract[]
}

// ── Contrato por ID ───────────────────────────────────────────────────────────

export async function getContractById(id: string): Promise<Contract | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return data as Contract
}

// ── Seguimiento (contratos activos con progreso) ──────────────────────────────

export async function getContractTracking(): Promise<ContractTracking[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_tracking")
    .select("*")
    .in("status", ["EN_EJECUCION", "SUSPENDIDO"])
    .order("days_remaining", { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ContractTracking[]
}

export async function getContractTrackingById(
  id: string
): Promise<ContractTracking | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_tracking")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as ContractTracking | null
}

export async function getContractFollowups(
  contractId: string
): Promise<ContractFollowup[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contract_followups")
    .select("*")
    .eq("contract_id", contractId)
    .order("followup_date", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ContractFollowup[]
}

// ── Contratos derivados de un interadmin ──────────────────────────────────────

export async function getDerivedContracts(parentId: string): Promise<Contract[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .eq("parent_contract_id", parentId)
    .order("subscription_date", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Contract[]
}

// ── Catálogos para filtros ────────────────────────────────────────────────────

export async function getFilterCatalogs(): Promise<{
  areas: string[]
  supervisors: string[]
  years: number[]
}> {
  const supabase = await createSupabaseServerClient()

  const [{ data: areas }, { data: supervisors }, { data: years }] = await Promise.all([
    supabase.from("responsible_areas").select("name").order("name"),
    supabase.from("supervisors").select("full_name").order("full_name"),
    supabase.from("contracts").select("year").order("year", { ascending: false }),
  ])

  return {
    areas: (areas ?? []).map((a) => a.name),
    supervisors: (supervisors ?? []).map((s) => s.full_name),
    years: [...new Set((years ?? []).map((r) => r.year))],
  }
}
