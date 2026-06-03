import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Contract } from "@/types/contract"

export interface DerivedContractsKPIs {
  totalCommitted: number
  activeContracts: number
  expiringContracts: number
  inLiquidation: number
  parentContractsCount: number
}

export async function getAllDerivedContracts(): Promise<Contract[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .not("parent_contract_id", "is", null)
    .order("subscription_date", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Contract[]
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
