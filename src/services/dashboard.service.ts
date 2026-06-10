import { createSupabaseServerClient } from "@/lib/supabase/server"

// ── KPIs Interadministrativos (desde interadministrativos) ────────────────────

export interface InteradminDashboardKPIs {
  totalContracts: number
  activeContracts: number       // estado = 'EN EJECUCIÓN'
  terminatedContracts: number   // estado = 'TERMINADO'
  liquidatedContracts: number   // estado = 'LIQUIDADO'
  totalValue: number            // SUM(total_contrato)
  pendingValue: number          // SUM(valor_pendiente_cobrar)
  totalCuotaAdmin: number       // SUM(total_cuota_admin)
  totalDerivedContracts: number // COUNT(contratos WHERE tipo_contrato = 'DERIVADO')
}

// ── KPIs Funcionamiento (desde contratos WHERE tipo_contrato = 'FUNCIONAMIENTO') ─

export interface FuncionamientoDashboardKPIs {
  totalContracts: number
  activeContracts: number       // = totalContracts (no hay campo estado en contratos)
  suspendedContracts: number
  finishedContracts: number
  liquidatedContracts: number
  totalValue: number
  totalPaidValue: number
  avgValue: number
  soonExpiring: number
  expired: number
}

// ── Interadmin KPIs ───────────────────────────────────────────────────────────

export async function getInteradminDashboardKPIs(): Promise<InteradminDashboardKPIs> {
  const supabase = await createSupabaseServerClient()

  const [
    { data: interadmin, error: e1 },
    { count: derivadosCount, error: e2 },
  ] = await Promise.all([
    supabase
      .from("interadministrativos")
      .select("estado, total_contrato, valor_pendiente_cobrar, total_cuota_admin")
      .limit(5000),
    supabase
      .from("contratos")
      .select("id", { count: "exact", head: true })
      .eq("tipo_contrato", "DERIVADO"),
  ])

  if (e1) throw new Error(e1.message)
  if (e2) throw new Error(e2.message)

  const rows = interadmin ?? []
  const active     = rows.filter((r) => r.estado === "EN EJECUCIÓN").length
  const terminated = rows.filter((r) => r.estado === "TERMINADO").length
  const liquidated = rows.filter((r) => r.estado === "LIQUIDADO").length
  const totalValue      = rows.reduce((s, r) => s + Number(r.total_contrato       ?? 0), 0)
  const pendingValue    = rows.reduce((s, r) => s + Number(r.valor_pendiente_cobrar ?? 0), 0)
  const totalCuotaAdmin = rows.reduce((s, r) => s + Number(r.total_cuota_admin    ?? 0), 0)

  return {
    totalContracts:       rows.length,
    activeContracts:      active,
    terminatedContracts:  terminated,
    liquidatedContracts:  liquidated,
    totalValue,
    pendingValue,
    totalCuotaAdmin,
    totalDerivedContracts: derivadosCount ?? 0,
  }
}

// ── Funcionamiento KPIs ───────────────────────────────────────────────────────

export async function getFuncionamientoDashboardKPIs(): Promise<FuncionamientoDashboardKPIs> {
  const supabase = await createSupabaseServerClient()

  const { count, error } = await supabase
    .from("contratos")
    .select("id", { count: "exact", head: true })
    .eq("tipo_contrato", "FUNCIONAMIENTO")

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    totalContracts:     total,
    activeContracts:    total,
    suspendedContracts: 0,
    finishedContracts:  0,
    liquidatedContracts: 0,
    totalValue:    0,
    totalPaidValue: 0,
    avgValue:      0,
    soonExpiring:  0,
    expired:       0,
  }
}
