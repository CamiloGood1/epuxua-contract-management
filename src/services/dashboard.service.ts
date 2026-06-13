import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

// ── Alertas ───────────────────────────────────────────────────────────────────

export interface DashboardAlertItem {
  id: number
  label: string
  subtitle: string | null
  daysUntilExpiry: number
  tipo: "INTERADMIN" | "DERIVADO" | "FUNCIONAMIENTO"
  numericProjectId?: number
}

export interface DashboardAlerts {
  expiringSoon: DashboardAlertItem[]
  expired: DashboardAlertItem[]
}

export async function getDashboardAlerts(): Promise<DashboardAlerts> {
  const supabase = await createSupabaseServerClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 30)

  const [{ data: interadmin }, { data: contratos }] = await Promise.all([
    supabase
      .from("interadministrativos")
      .select("id, id_contrato, objeto_contrato, fecha_terminacion")
      .eq("estado", "EN EJECUCIÓN")
      .not("fecha_terminacion", "is", null)
      .lte("fecha_terminacion", in30.toISOString().split("T")[0])
      .order("fecha_terminacion", { ascending: true })
      .limit(50),
    supabase
      .from("contratos")
      .select("id, numero_contrato, objeto_contrato, fecha_terminacion, tipo_contrato, id_interadministrativo")
      .eq("estado", "EN EJECUCIÓN")
      .not("fecha_terminacion", "is", null)
      .lte("fecha_terminacion", in30.toISOString().split("T")[0])
      .order("fecha_terminacion", { ascending: true })
      .limit(100),
  ])

  const toAlertItem = (
    row: { id: number; fecha_terminacion: string | null; objeto_contrato?: string | null },
    label: string,
    tipo: DashboardAlertItem["tipo"],
    numericProjectId?: number,
  ): DashboardAlertItem => {
    const d = new Date(row.fecha_terminacion!)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    return {
      id: row.id,
      label,
      subtitle: row.objeto_contrato ?? null,
      daysUntilExpiry: diff,
      tipo,
      numericProjectId,
    }
  }

  const all: DashboardAlertItem[] = [
    ...(interadmin ?? []).map((r) =>
      toAlertItem(r, r.id_contrato ?? String(r.id), "INTERADMIN", r.id)
    ),
    ...(contratos ?? []).map((r) =>
      toAlertItem(
        r,
        r.numero_contrato ?? String(r.id),
        r.tipo_contrato === "DERIVADO" ? "DERIVADO" : "FUNCIONAMIENTO",
      )
    ),
  ]

  return {
    expiringSoon: all.filter((a) => a.daysUntilExpiry >= 0).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    expired:      all.filter((a) => a.daysUntilExpiry < 0).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
  }
}

// ── KPIs Interadministrativos (desde interadministrativos) ────────────────────

export interface InteradminDashboardKPIs {
  totalContracts: number
  activeContracts: number       // estado = 'EN EJECUCIÓN'
  terminatedContracts: number   // estado = 'TERMINADO'
  liquidatedContracts: number   // estado = 'LIQUIDADO'
  totalValue: number            // SUM(total_contrato) all
  activeValue: number           // SUM(total_contrato) WHERE EN EJECUCIÓN
  pendingValue: number          // SUM(valor_pendiente_cobrar)
  totalCuotaAdmin: number       // SUM(total_cuota_admin) all
  activeCuotaAdmin: number      // SUM(total_cuota_admin) WHERE EN EJECUCIÓN
  totalDerivedContracts: number // COUNT(contratos WHERE tipo_contrato = 'DERIVADO')
  activeDerivedContracts: number // COUNT(contratos WHERE tipo_contrato = 'DERIVADO' AND EN EJECUCIÓN)
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
    { count: activeDerivedCount, error: e3 },
  ] = await Promise.all([
    supabase
      .from("interadministrativos")
      .select("estado, total_contrato, valor_pendiente_cobrar, total_cuota_admin")
      .limit(5000),
    supabase
      .from("contratos")
      .select("id", { count: "exact", head: true })
      .eq("tipo_contrato", "DERIVADO"),
    supabase
      .from("contratos")
      .select("id", { count: "exact", head: true })
      .eq("tipo_contrato", "DERIVADO")
      .eq("estado", "EN EJECUCIÓN"),
  ])

  if (e1) {
    console.warn("[getInteradminDashboardKPIs]", e1.message)
    return {
      totalContracts: 0, activeContracts: 0, terminatedContracts: 0, liquidatedContracts: 0,
      totalValue: 0, activeValue: 0, pendingValue: 0, totalCuotaAdmin: 0, activeCuotaAdmin: 0,
      totalDerivedContracts: 0, activeDerivedContracts: 0,
    }
  }
  if (e2) console.warn("[getInteradminDashboardKPIs] derivados:", e2.message)
  if (e3) console.warn("[getInteradminDashboardKPIs] activos:", e3.message)

  const rows       = interadmin ?? []
  const activeRows = rows.filter((r) => r.estado === "EN EJECUCIÓN")
  const active     = activeRows.length
  const terminated = rows.filter((r) => r.estado === "TERMINADO").length
  const liquidated = rows.filter((r) => r.estado === "LIQUIDADO").length

  const totalValue      = rows.reduce((s, r) => s + Number(r.total_contrato    ?? 0), 0)
  const activeValue     = activeRows.reduce((s, r) => s + Number(r.total_contrato ?? 0), 0)
  const totalCuotaAdmin = rows.reduce((s, r) => s + Number(r.total_cuota_admin  ?? 0), 0)
  const activeCuotaAdmin = activeRows.reduce((s, r) => s + Number(r.total_cuota_admin ?? 0), 0)

  // valor_pendiente_cobrar puede ser NULL en la importación — usar total_cuota_admin como fallback
  const pendingValue = rows.reduce((s, r) => {
    const pdc = r.valor_pendiente_cobrar != null ? Number(r.valor_pendiente_cobrar) : null
    const fallback = pdc != null && pdc > 0 ? pdc : Number(r.total_cuota_admin ?? 0)
    return s + fallback
  }, 0)

  return {
    totalContracts:        rows.length,
    activeContracts:       active,
    terminatedContracts:   terminated,
    liquidatedContracts:   liquidated,
    totalValue,
    activeValue,
    pendingValue,
    totalCuotaAdmin,
    activeCuotaAdmin,
    totalDerivedContracts:  derivadosCount ?? 0,
    activeDerivedContracts: activeDerivedCount ?? 0,
  }
}

// ── Forma de Pago KPIs ───────────────────────────────────────────────────────

export interface FormaPagoDashboardKPIs {
  programadoTotal:  number
  programadoBienes: number
  programadoCuota:  number
  programadoMixto:  number
  contratosConCronograma: number
}

export async function getFormaPagoDashboardKPIs(): Promise<FormaPagoDashboardKPIs> {
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from("contract_payment_schedule" as never)
    .select("scheduled_value, destination, interadministrativo_id")
    .limit(10000) as { data: Array<{ scheduled_value: number; destination: string; interadministrativo_id: number }> | null }

  const rows = data ?? []
  let programadoTotal = 0, programadoBienes = 0, programadoCuota = 0, programadoMixto = 0
  const contratos = new Set<number>()

  for (const r of rows) {
    const v = Number(r.scheduled_value ?? 0)
    programadoTotal += v
    contratos.add(r.interadministrativo_id)
    if (r.destination === "BIENES_SERVICIOS")    programadoBienes += v
    else if (r.destination === "CUOTA_GERENCIA") programadoCuota  += v
    else                                         programadoMixto  += v
  }

  return { programadoTotal, programadoBienes, programadoCuota, programadoMixto, contratosConCronograma: contratos.size }
}

// ── Facturación KPIs ─────────────────────────────────────────────────────────

export interface FacturacionDashboardKPIs {
  facturadoTotal:  number
  ingresadoTotal:  number
  pendienteTotal:  number
  facturadoBienes: number
  facturadoCuota:  number
}

export async function getFacturacionDashboardKPIs(): Promise<FacturacionDashboardKPIs> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  try {
    supabase = createSupabaseAdminClient()
  } catch {
    supabase = await createSupabaseServerClient()
  }

  const { data } = await supabase
    .from("interadmin_facturas" as never)
    .select("valor_cobrado, valor_ingresado, descuentos, destino")
    .limit(10000) as { data: Array<{ valor_cobrado: number; valor_ingresado: number; descuentos: number; destino: string }> | null }

  const rows = data ?? []
  let facturadoTotal = 0, ingresadoTotal = 0, facturadoBienes = 0, facturadoCuota = 0

  for (const r of rows) {
    const cobrado = Number(r.valor_cobrado ?? 0)
    facturadoTotal += cobrado
    ingresadoTotal += Number(r.valor_ingresado ?? 0)
    if (r.destino === "BIENES_SERVICIOS") facturadoBienes += cobrado
    else                                  facturadoCuota  += cobrado
  }

  return {
    facturadoTotal,
    ingresadoTotal,
    pendienteTotal:  Math.max(0, facturadoTotal - ingresadoTotal),
    facturadoBienes,
    facturadoCuota,
  }
}

// ── Funcionamiento KPIs ───────────────────────────────────────────────────────

export async function getFuncionamientoDashboardKPIs(): Promise<FuncionamientoDashboardKPIs> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select("estado, valor_final, valor_pagado, fecha_terminacion")
    .eq("tipo_contrato", "FUNCIONAMIENTO")
    .limit(5000)

  if (error) {
    console.warn("[getFuncionamientoDashboardKPIs]", error.message)
    return {
      totalContracts: 0, activeContracts: 0, suspendedContracts: 0, finishedContracts: 0,
      liquidatedContracts: 0, totalValue: 0, totalPaidValue: 0, avgValue: 0, soonExpiring: 0, expired: 0,
    }
  }

  const rows       = data ?? []
  const total      = rows.length
  const active     = rows.filter((r) => r.estado === "EN EJECUCIÓN").length
  const suspended  = rows.filter((r) => r.estado === "SUSPENDIDO").length
  const finished   = rows.filter((r) => r.estado === "TERMINADO" || r.estado === "CIERRE CONTRACTUAL").length
  const liquidated = rows.filter((r) => r.estado === "LIQUIDADO").length
  const totalVal   = rows.reduce((s, r) => s + Number(r.valor_final ?? 0), 0)
  const paidVal    = rows.reduce((s, r) => s + Number(r.valor_pagado ?? 0), 0)

  const today = new Date()
  const in30   = new Date(today); in30.setDate(in30.getDate() + 30)
  let soonExpiring = 0, expired = 0
  for (const r of rows) {
    if (!r.fecha_terminacion) continue
    const d = new Date(r.fecha_terminacion)
    if (d < today) expired++
    else if (d <= in30) soonExpiring++
  }

  return {
    totalContracts:     total,
    activeContracts:    active,
    suspendedContracts: suspended,
    finishedContracts:  finished,
    liquidatedContracts: liquidated,
    totalValue:         totalVal,
    totalPaidValue:     paidVal,
    avgValue:           total > 0 ? totalVal / total : 0,
    soonExpiring,
    expired,
  }
}
