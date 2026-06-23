/** Resumen financiero calculado dinámicamente (única fuente de verdad). */
export interface DerivedContractFinancials {
  valorInicial: number
  totalAdiciones: number
  valorActual: number
  valorPagado: number
  saldoPendiente: number
  pctEjecutado: number | null
}

type AdicionLike = { valor_adicion: number }
type PagoLike    = { valor_pagado: number; fecha_pago: string }

/** Pago válido: fecha y valor bruto positivo. */
export function isValidContractPago(pago: PagoLike): boolean {
  return Boolean(pago.fecha_pago?.trim()) && Number(pago.valor_pagado) > 0
}

export function sumAdiciones(adiciones: AdicionLike[]): number {
  return adiciones.reduce((s, a) => s + Number(a.valor_adicion ?? 0), 0)
}

export function sumPagosContratista(pagos: PagoLike[]): number {
  return pagos.filter(isValidContractPago).reduce((s, p) => s + Number(p.valor_pagado), 0)
}

export function calcPctEjecutado(valorPagado: number, valorActual: number): number | null {
  if (valorActual <= 0) return null
  return round2((valorPagado / valorActual) * 100)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** % ejecutado con 2 decimales para UI (ej. 28,11%). */
export function formatPctEjecutado(pct: number | null): string {
  if (pct == null) return "—"
  return pct.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"
}

export function calcDerivedContractFinancials(input: {
  valorInicial?: number | null
  adiciones?: AdicionLike[]
  pagos?: PagoLike[]
}): DerivedContractFinancials {
  const valorInicial = Number(input.valorInicial ?? 0)
  const totalAdiciones = sumAdiciones(input.adiciones ?? [])
  const valorActual = valorInicial + totalAdiciones
  const valorPagado = sumPagosContratista(input.pagos ?? [])
  const saldoPendiente = valorActual - valorPagado
  const pctEjecutado = calcPctEjecutado(valorPagado, valorActual)

  return {
    valorInicial,
    totalAdiciones,
    valorActual,
    valorPagado,
    saldoPendiente,
    pctEjecutado,
  }
}

/** Agrupa filas por contrato_id. */
export function groupByContratoId<T extends { contrato_id: number }>(rows: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const row of rows) {
    const list = map.get(row.contrato_id) ?? []
    list.push(row)
    map.set(row.contrato_id, list)
  }
  return map
}
