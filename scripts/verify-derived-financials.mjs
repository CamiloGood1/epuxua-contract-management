/**
 * Verificación del caso de prueba EPUXUA V2 — ejecutar con:
 *   node scripts/verify-derived-financials.mjs
 */

function round2(n) {
  return Math.round(n * 100) / 100
}

function calc({ valorInicial, adiciones, pagos }) {
  const totalAdiciones = adiciones.reduce((s, a) => s + a, 0)
  const valorActual = valorInicial + totalAdiciones
  const valorPagado = pagos.reduce((s, p) => s + p, 0)
  const saldoPendiente = valorActual - valorPagado
  const pctEjecutado = valorActual > 0 ? round2((valorPagado / valorActual) * 100) : null
  return { valorActual, valorPagado, saldoPendiente, pctEjecutado }
}

const result = calc({
  valorInicial: 67_354_000,
  adiciones: [1_000_000_000],
  pagos: [200_000_000, 100_000_000],
})

const expected = {
  valorActual: 1_067_354_000,
  valorPagado: 300_000_000,
  saldoPendiente: 767_354_000,
  pctEjecutado: 28.11,
}

let ok = true
for (const [key, exp] of Object.entries(expected)) {
  if (result[key] !== exp) {
    console.error(`FAIL ${key}: got ${result[key]}, expected ${exp}`)
    ok = false
  }
}

if (ok) {
  console.log("OK — Caso de prueba EPUXUA V2")
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
} else {
  process.exit(1)
}
