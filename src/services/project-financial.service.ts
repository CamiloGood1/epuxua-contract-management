import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ProjectFinancialSummary, ProjectPayment } from "@/types/project"

async function financialSummaryFromProjectDetail(
  projectId: string
): Promise<ProjectFinancialSummary | null> {
  const supabase = await createSupabaseServerClient()

  const { data: project, error: projectError } = await supabase
    .from("v_project_detail")
    .select(
      "id, total_value, goods_services_value, management_fee_amount, executed_value, paid_value, available_balance, execution_pct"
    )
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) throw new Error(projectError.message)
  if (!project) return null

  return {
    project_id: project.id,
    total_value: project.total_value,
    goods_services_value: project.goods_services_value,
    management_fee_amount: project.management_fee_amount,
    executed_value: project.executed_value,
    paid_value: project.paid_value,
    available_balance: project.available_balance,
    execution_pct: project.execution_pct,
    budget_committed: null,
    budget_available: null,
  }
}

export async function getProjectFinancialSummary(
  projectId: string
): Promise<ProjectFinancialSummary | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_project_financial")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle()

  if (!error && data) return data as ProjectFinancialSummary

  return financialSummaryFromProjectDetail(projectId)
}

export async function getProjectPayments(projectId: string): Promise<ProjectPayment[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      project_id,
      contract_id,
      payment_date,
      gross_value,
      deductions,
      contracts ( contract_number )
    `
    )
    .eq("project_id", projectId)
    .order("payment_date", { ascending: false })

  if (error) return []

  return (data ?? []).map((row) => {
    const contract = row.contracts as
      | { contract_number: string | null }
      | { contract_number: string | null }[]
      | null
    const c = Array.isArray(contract) ? contract[0] : contract
    const gross = Number(row.gross_value ?? 0)
    const deductions = Number(row.deductions ?? 0)
    return {
      id: row.id,
      project_id: row.project_id,
      contract_id: row.contract_id,
      payment_date: row.payment_date,
      gross_value: gross,
      deductions,
      net_value: gross - deductions,
      description: null,
      contract_number: c?.contract_number ?? null,
    } as ProjectPayment
  })
}

export async function getGlobalPaymentsSummary() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      payment_date,
      gross_value,
      deductions,
      project_id,
      projects ( project_code, name )
    `
    )
    .order("payment_date", { ascending: false })
    .limit(500)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getBudgetCommitments(projectId?: string) {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("budget_commitments")
    .select(
      `
      *,
      projects ( project_code, name )
    `
    )
    .order("date", { ascending: false })

  if (projectId) {
    query = query.eq("project_id", projectId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
