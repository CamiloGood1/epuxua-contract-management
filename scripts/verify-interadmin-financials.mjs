/**
 * Casos de prueba EPUXUA V2 — interadministrativos
 * node scripts/verify-interadmin-financials.mjs
 */

function calcValorOriginal({ valor_inicial, cuota_admin_inicial, total_contrato }) {
  const fromParts = (valor_inicial ?? 0) + (cuota_admin_inicial ?? 0)
  if (fromParts > 0) return fromParts
  return total_contrato ?? valor_inicial ?? 0
}

function calcFinancials(input) {
  const valorOriginal = calcValorOriginal(input)
  const totalAdiciones = (input.adiciones ?? []).reduce((s, a) => s + (a.valor_total ?? 0), 0)
  const valorTotalActual = valorOriginal + totalAdiciones

  const bienesOriginal = input.valor_inicial ?? 0
  const cuotaOriginal = input.cuota_admin_inicial ?? 0
  const adBienes = (input.adiciones ?? []).reduce((s, a) => s + (a.valor_bienes_servicios ?? 0), 0)
  const adCuota = (input.adiciones ?? []).reduce((s, a) => s + (a.valor_cuota_gerencia ?? 0), 0)
  const remainder = Math.max(0, totalAdiciones - adBienes - adCuota)

  return {
    valorOriginal,
    totalAdiciones,
    valorTotalActual,
    bienesServiciosVigente: bienesOriginal + adBienes + remainder,
    cuotaGerenciaVigente: cuotaOriginal + adCuota,
  }
}

function formatFacturadoSub(kpis, fin) {
  const { facturadoTotal, facturadoBienes, facturadoCuota } = kpis
  if (facturadoTotal <= 0) return undefined
  const hasBS = facturadoBienes > 0
  const hasCuota = facturadoCuota > 0
  if (hasBS && !hasCuota && fin.bienesServiciosVigente > 0) {
    const pct = Math.round((facturadoBienes / fin.bienesServiciosVigente) * 10000) / 100
    return `${pct}% de Bienes y Servicios`
  }
  if (hasCuota && !hasBS && fin.cuotaGerenciaVigente > 0) {
    const pct = Math.round((facturadoCuota / fin.cuotaGerenciaVigente) * 10000) / 100
    return `${pct}% de Cuota de Gerencia`
  }
  return "mixed"
}

let ok = true

// Caso 1: valor total actual
const fin1 = calcFinancials({
  valor_inicial: 9_000_000_000,
  cuota_admin_inicial: 1_000_000_000,
  adiciones: [{ valor_total: 1_000_000_000, valor_bienes_servicios: 1_000_000_000, valor_cuota_gerencia: 0 }],
})
if (fin1.valorTotalActual !== 11_000_000_000) {
  console.error("FAIL valor total:", fin1.valorTotalActual, "expected 11000000000")
  ok = false
}

// Caso 2: factura B/S no debe decir cuota
const fin2 = calcFinancials({
  valor_inicial: 10_000_000_000,
  cuota_admin_inicial: 564_000_000,
  adiciones: [],
})
const sub = formatFacturadoSub(
  { facturadoTotal: 1_000_000_000, facturadoBienes: 1_000_000_000, facturadoCuota: 0 },
  fin2,
)
if (!sub?.includes("Bienes y Servicios") || sub.includes("cuota")) {
  console.error("FAIL facturacion sub:", sub)
  ok = false
}
const wrongSub = `${Math.round(1_000_000_000 / 564_000_000 * 100)}% de cuota`
if (sub === wrongSub) {
  console.error("FAIL still using cuota base")
  ok = false
}

if (ok) {
  console.log("OK — Casos interadmin EPUXUA V2")
  console.log(JSON.stringify({ fin1, sub }, null, 2))
  process.exit(0)
} else {
  process.exit(1)
}
