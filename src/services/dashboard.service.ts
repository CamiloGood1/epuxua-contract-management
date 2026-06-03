import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { DashboardMetrics } from "@/types"

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_dashboard_kpis")
    .select("*")
    .single()

  if (error) throw new Error(error.message)

  return {
    totalContracts:      data.total_contracts       ?? 0,
    inProgressContracts: data.active_contracts       ?? 0,
    liquidationContracts: data.finished_contracts    ?? 0,
    totalValue:          data.total_final_value      ?? 0,
    // campos extra disponibles en la vista
    suspendedContracts:  data.suspended_contracts    ?? 0,
    liquidatedContracts: data.liquidated_contracts   ?? 0,
    expiring30Days:      data.expiring_30_days       ?? 0,
    expiring15Days:      data.expiring_15_days       ?? 0,
    overdueActive:       data.overdue_active         ?? 0,
    totalPaidValue:      data.total_paid_value       ?? 0,
    totalPendingValue:   data.total_pending_value    ?? 0,
    activeContractedValue: data.active_contracted_value ?? 0,
  }
}
