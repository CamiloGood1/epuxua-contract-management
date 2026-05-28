import { supabase } from "@/lib/supabase"

export interface NewContractInput {
  contract_number: string
  contract_name: string
  contract_object?: string
  contracting_entity?: string
  contractor_entity?: string
  manager_name?: string
  supervisor_name?: string
  status: string
  initial_value: number
  management_fee_percentage: number
  start_date?: string
  end_date?: string
  risk_level?: string
}

export async function createContract(input: NewContractInput): Promise<{ error: string | null }> {
  const fee = Number(input.initial_value) * (Number(input.management_fee_percentage) / 100)
  const goods = Number(input.initial_value) - fee

  const payload = {
    contract_number:          input.contract_number.trim(),
    contract_name:            input.contract_name.trim(),
    contract_object:          input.contract_object?.trim() || null,
    contracting_entity:       input.contracting_entity?.trim() || null,
    contractor_entity:        input.contractor_entity?.trim() || null,
    manager_name:             input.manager_name?.trim() || null,
    supervisor_name:          input.supervisor_name?.trim() || null,
    status:                   input.status,
    initial_value:            Number(input.initial_value),
    management_fee_percentage: Number(input.management_fee_percentage),
    management_fee_value:     fee,
    goods_services_value:     goods,
    executed_value:           0,
    physical_progress:        0,
    financial_progress:       0,
    start_date:               input.start_date || null,
    end_date:                 input.end_date || null,
    risk_level:               input.risk_level || null,
  }

  const { error } = await supabase.from("contracts").insert([payload])

  if (error) return { error: error.message }
  return { error: null }
}
