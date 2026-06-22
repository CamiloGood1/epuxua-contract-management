import type { Adicion } from "@/types/modificaciones"
import type { FacturacionKPIs } from "@/types/facturas"

/** Resumen financiero calculado dinámicamente para interadministrativos. */
export interface InteradminFinancials {
  valorOriginal: number
  totalAdiciones: number
  valorTotalActual: number
  bienesServiciosVigente: number
  cuotaGerenciaVigente: number
}

type AdicionLike = Pick<Adicion, "valor_total" | "valor_bienes_servicios" | "valor_cuota_gerencia">

export function sumAdicionesInteradmin(adiciones: AdicionLike[]): number {
  return adiciones.reduce((s, a) => s + Number(a.valor_total ?? 0), 0)
}

/** Valor contractual original (sin adiciones de la pestaña Modificaciones). */
export function calcValorOriginalInteradmin(input: {
  valor_inicial?: number | null
  cuota_admin_inicial?: number | null
  total_contrato?: number | null
}): number {
  const bienes = Number(input.valor_inicial ?? 0)
  const cuota  = Number(input.cuota_admin_inicial ?? 0)
  const fromParts = bienes + cuota
  if (fromParts > 0) return fromParts
  return Number(input.total_contrato ?? input.valor_inicial ?? 0)
}

export function calcInteradminFinancials(input: {
  valor_inicial?: number | null
  cuota_admin_inicial?: number | null
  total_contrato?: number | null
  /** Legacy — solo si no hay filas en interadmin_adiciones */
  adicion_legacy?: number | null
  adiciones?: AdicionLike[]
}): InteradminFinancials {
  const valorOriginal = calcValorOriginalInteradmin(input)
  const adiciones = input.adiciones ?? []

  let totalAdiciones = sumAdicionesInteradmin(adiciones)
  if (totalAdiciones === 0 && adiciones.length === 0) {
    totalAdiciones = Number(input.adicion_legacy ?? 0)
  }

  const adBienes = adiciones.reduce((s, a) => s + Number(a.valor_bienes_servicios ?? 0), 0)
  const adCuota  = adiciones.reduce((s, a) => s + Number(a.valor_cuota_gerencia ?? 0), 0)
  const adSplit  = adBienes + adCuota
  const adRemainder = Math.max(0, totalAdiciones - adSplit)

  const bienesOriginal = Number(input.valor_inicial ?? 0)
  const cuotaOriginal  = Number(input.cuota_admin_inicial ?? 0)

  const bienesServiciosVigente = bienesOriginal + adBienes + adRemainder
  const cuotaGerenciaVigente   = cuotaOriginal + adCuota
  const valorTotalActual       = valorOriginal + totalAdiciones

  return {
    valorOriginal,
    totalAdiciones,
    valorTotalActual,
    bienesServiciosVigente,
    cuotaGerenciaVigente,
  }
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatPctInteradmin(n: number | null): string {
  if (n == null) return "—"
  return n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"
}

/** Subtítulo del KPI Valor Facturado según destino de las facturas. */
export function formatFacturadoKpiSub(
  kpis: Pick<FacturacionKPIs, "facturadoTotal" | "facturadoBienes" | "facturadoCuota">,
  fin: Pick<InteradminFinancials, "bienesServiciosVigente" | "cuotaGerenciaVigente">,
): string | undefined {
  if (kpis.facturadoTotal <= 0) return undefined

  const hasBS    = kpis.facturadoBienes > 0
  const hasCuota = kpis.facturadoCuota > 0

  if (hasBS && !hasCuota && fin.bienesServiciosVigente > 0) {
    return `${formatPctInteradmin(roundPct((kpis.facturadoBienes / fin.bienesServiciosVigente) * 100))} de Bienes y Servicios`
  }

  if (hasCuota && !hasBS && fin.cuotaGerenciaVigente > 0) {
    return `${formatPctInteradmin(roundPct((kpis.facturadoCuota / fin.cuotaGerenciaVigente) * 100))} de Cuota de Gerencia`
  }

  const parts: string[] = []
  if (hasBS) {
    const pct = fin.bienesServiciosVigente > 0
      ? formatPctInteradmin(roundPct((kpis.facturadoBienes / fin.bienesServiciosVigente) * 100))
      : null
    parts.push(pct ? `B/S: ${pct}` : "B/S facturado")
  }
  if (hasCuota) {
    const pct = fin.cuotaGerenciaVigente > 0
      ? formatPctInteradmin(roundPct((kpis.facturadoCuota / fin.cuotaGerenciaVigente) * 100))
      : null
    parts.push(pct ? `Cuota: ${pct}` : "Cuota facturada")
  }

  return parts.length > 0 ? parts.join(" · ") : undefined
}

/** % recaudado sobre el valor contractual vigente. */
export function calcAvanceFinancieroRecaudo(
  ingresadoTotal: number,
  valorTotalActual: number,
): number {
  if (valorTotalActual <= 0) return 0
  return Math.min(100, Math.round((ingresadoTotal / valorTotalActual) * 100))
}
