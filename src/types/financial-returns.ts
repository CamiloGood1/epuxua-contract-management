// Rendimientos Financieros — cabecera, distribución automática y devoluciones

export type RepaymentStatus = "PENDIENTE" | "PARCIAL" | "DEVUELTO"

export interface FinancialReturn {
  id: number
  interadministrativo_id: number
  funding_group_id: number
  return_month: number
  return_year: number
  return_date: string
  gross_return_value: number
  repayment_status: RepaymentStatus
  observations: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface FinancialReturnDistribution {
  id: number
  financial_return_id: number
  interadministrativo_id: number
  funding_source_id: number
  source_name: string
  participation_percentage: number
  distributed_value: number
  created_at: string
}

export interface FinancialReturnDetail extends FinancialReturn {
  origen_recursos?: string
  cantidad_fuentes?: number
  total_distribuido?: number
}

export interface FinancialReturnsData {
  returns: FinancialReturn[]
  distributions: FinancialReturnDistribution[]
}

export interface FinancialReturnsKPIs {
  rendimientosAcumulados: number
  rendimientosAnioActual: number
  rendimientosMesActual: number
  pendientePorDevolver: number
  cantidadRegistros: number
  registrosPendientes: number
  principalBeneficiario: string | null
  valorPrincipalBeneficiario: number
  rendimientosDevueltos: number
}

export interface FinanciadorResumen {
  source_name: string
  valor_acumulado: number
  participacion_promedio: number
  cantidad_distribuciones: number
}

export const EMPTY_FINANCIAL_RETURNS: FinancialReturnsData = {
  returns: [],
  distributions: [],
}

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const

export const REPAYMENT_STATUS_LABEL: Record<RepaymentStatus, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL:   "Parcial",
  DEVUELTO:  "Devuelto",
}

export const REPAYMENT_STATUS_CFG: Record<RepaymentStatus, { bg: string; text: string }> = {
  PENDIENTE: { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700" },
  PARCIAL:   { bg: "bg-blue-50 border-blue-200",     text: "text-blue-700" },
  DEVUELTO:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month)
}

export function getDistributionsForReturn(
  distributions: FinancialReturnDistribution[],
  returnId: number,
): FinancialReturnDistribution[] {
  return distributions.filter((d) => d.financial_return_id === returnId)
}

export function calcFinancialReturnsKPIs(data: FinancialReturnsData): FinancialReturnsKPIs {
  const { returns, distributions } = data
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const rendimientosAcumulados = returns.reduce((s, r) => s + r.gross_return_value, 0)
  const rendimientosAnioActual = returns
    .filter((r) => r.return_year === currentYear)
    .reduce((s, r) => s + r.gross_return_value, 0)
  const rendimientosMesActual = returns
    .filter((r) => r.return_year === currentYear && r.return_month === currentMonth)
    .reduce((s, r) => s + r.gross_return_value, 0)
  const pendientePorDevolver = returns
    .filter((r) => r.repayment_status !== "DEVUELTO")
    .reduce((s, r) => s + r.gross_return_value, 0)
  const rendimientosDevueltos = returns
    .filter((r) => r.repayment_status === "DEVUELTO")
    .reduce((s, r) => s + r.gross_return_value, 0)
  const registrosPendientes = returns.filter((r) => r.repayment_status === "PENDIENTE").length

  const bySource = new Map<string, number>()
  for (const d of distributions) {
    bySource.set(d.source_name, (bySource.get(d.source_name) ?? 0) + d.distributed_value)
  }
  let principalBeneficiario: string | null = null
  let valorPrincipalBeneficiario = 0
  for (const [name, val] of bySource.entries()) {
    if (val > valorPrincipalBeneficiario) {
      principalBeneficiario = name
      valorPrincipalBeneficiario = val
    }
  }

  return {
    rendimientosAcumulados,
    rendimientosAnioActual,
    rendimientosMesActual,
    pendientePorDevolver,
    cantidadRegistros: returns.length,
    registrosPendientes,
    principalBeneficiario,
    valorPrincipalBeneficiario,
    rendimientosDevueltos,
  }
}

export function calcFinanciadorResumen(
  distributions: FinancialReturnDistribution[],
): FinanciadorResumen[] {
  const map = new Map<string, { total: number; pctSum: number; count: number; distCount: Set<number> }>()
  for (const d of distributions) {
    const cur = map.get(d.source_name) ?? { total: 0, pctSum: 0, count: 0, distCount: new Set() }
    cur.total += d.distributed_value
    cur.pctSum += d.participation_percentage
    cur.count += 1
    cur.distCount.add(d.financial_return_id)
    map.set(d.source_name, cur)
  }
  return [...map.entries()]
    .map(([source_name, v]) => ({
      source_name,
      valor_acumulado: v.total,
      participacion_promedio: v.count > 0 ? Math.round((v.pctSum / v.count) * 100) / 100 : 0,
      cantidad_distribuciones: v.distCount.size,
    }))
    .sort((a, b) => b.valor_acumulado - a.valor_acumulado)
}

export function computeDistributionRows(
  grossValue: number,
  sources: { id: number; source_name: string; participation_percentage: number }[],
): { funding_source_id: number; source_name: string; participation_percentage: number; distributed_value: number }[] {
  return sources.map((s) => ({
    funding_source_id: s.id,
    source_name: s.source_name,
    participation_percentage: s.participation_percentage,
    distributed_value: Math.round(grossValue * (s.participation_percentage / 100) * 100) / 100,
  }))
}
