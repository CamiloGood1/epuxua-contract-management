/**
 * Verifica la lógica de recálculo tras eliminar una adición.
 * node scripts/verify-interadmin-delete-adicion.mjs
 */

function calcTotal(adiciones) {
  return adiciones.reduce((s, a) => s + (a.valor_total ?? 0), 0)
}

const valorInicial = 10_000_000_000
const adiciones = [
  { id: 1, valor_total: 1_000_000_000 },
  { id: 2, valor_total: 500_000_000 },
]

const antes = valorInicial + calcTotal(adiciones)
const restantes = adiciones.filter((a) => a.id !== 1)
const despues = valorInicial + calcTotal(restantes)

let ok = true
if (antes !== 11_500_000_000) {
  console.error("FAIL antes:", antes)
  ok = false
}
if (despues !== 10_500_000_000) {
  console.error("FAIL despues:", despues)
  ok = false
}
if (restantes.length !== 1) {
  console.error("FAIL count:", restantes.length)
  ok = false
}

if (ok) {
  console.log("OK — Eliminar adición recalcula valor total")
  console.log(JSON.stringify({ antes, despues, restantes: restantes.length }, null, 2))
  process.exit(0)
}
process.exit(1)
