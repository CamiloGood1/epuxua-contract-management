import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Contract } from "@/types/contract"

export interface DerivedContractRow extends Contract {
  project_id: string | null
  project_code: string | null
}

export interface DerivedContractsKPIs {
  totalCommitted: number
  activeContracts: number
  expiringContracts: number
  inLiquidation: number
  parentContractsCount: number
}

export async function getAllDerivedContracts(): Promise<DerivedContractRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .eq("contract_type", "DERIVADO")
    .order("subscription_date", { ascending: false })

  if (error) throw new Error(error.message)

  const contracts = (data ?? []) as Contract[]
  const parentIds = [
    ...new Set(contracts.map((c) => c.parent_contract_id).filter(Boolean)),
  ] as string[]

  if (parentIds.length === 0) {
    return contracts.map((c) => ({
      ...c,
      project_id: null,
      project_code: null,
    }))
  }

  const { data: projects } = await supabase
    .from("v_project_detail")
    .select("id, project_code, primary_contract_id")
    .in("primary_contract_id", parentIds)

  const projectByParent = new Map(
    (projects ?? []).map((p) => [
      p.primary_contract_id as string,
      { id: p.id as string, code: p.project_code as string },
    ])
  )

  return contracts.map((c) => {
    const linked = c.parent_contract_id
      ? projectByParent.get(c.parent_contract_id)
      : null
    return {
      ...c,
      project_id: linked?.id ?? null,
      project_code: linked?.code ?? null,
    }
  })
}

export async function getDerivedContractsKPIs(
  contracts: Contract[]
): Promise<DerivedContractsKPIs> {
  const active = contracts.filter((c) =>
    ["EN_EJECUCION", "SUSPENDIDO"].includes(c.status)
  )
  const expiring = contracts.filter(
    (c) =>
      c.status === "EN_EJECUCION" &&
      c.days_remaining != null &&
      c.days_remaining >= 0 &&
      c.days_remaining <= 30
  )
  const liquidating = contracts.filter((c) =>
    ["CIERRE_CONTRACTUAL", "TERMINADO"].includes(c.status)
  )
  const parentIds = new Set(
    contracts.map((c) => c.parent_contract_id).filter(Boolean)
  )

  return {
    totalCommitted: contracts.reduce((sum, c) => sum + (c.final_value ?? 0), 0),
    activeContracts: active.length,
    expiringContracts: expiring.length,
    inLiquidation: liquidating.length,
    parentContractsCount: parentIds.size,
  }
}
