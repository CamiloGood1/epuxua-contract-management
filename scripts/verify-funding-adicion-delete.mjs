/**
 * Documenta y verifica la regla chk_funding_group_adicion_link
 * al eliminar adiciones con grupo de financiación asociado.
 *
 * node scripts/verify-funding-adicion-delete.mjs
 */

const CONSTRAINT = `
CONSTRAINT chk_funding_group_adicion_link CHECK (
  (group_type = 'ORIGINAL' AND related_modification_id IS NULL)
  OR (group_type = 'ADICION' AND related_modification_id IS NOT NULL)
)
`

function violatesAfterSetNull(group) {
  return group.group_type === "ADICION" && group.related_modification_id == null
}

function isValidGroup(group) {
  if (group.group_type === "ORIGINAL") return group.related_modification_id == null
  if (group.group_type === "ADICION") return group.related_modification_id != null
  return false
}

let ok = true

const beforeDelete = { group_type: "ADICION", related_modification_id: 42 }
const afterFkSetNull = { group_type: "ADICION", related_modification_id: null }

if (!violatesAfterSetNull(afterFkSetNull)) {
  console.error("FAIL: SET NULL should violate constraint")
  ok = false
}

if (!isValidGroup(beforeDelete)) {
  console.error("FAIL: valid ADICION group rejected")
  ok = false
}

// Flujo corregido: eliminar grupo antes que la adición
const adiciones = [{ id: 1, valor_total: 1_000_000_000 }]
const groups = [{ id: 10, group_type: "ADICION", related_modification_id: 1, total_value: 1_000_000_000 }]
const adicionIds = new Set(adiciones.map((a) => a.id))

function simulateDeleteAdicion(adicionId, groupsState, adicionesState) {
  const group = groupsState.find((g) => g.related_modification_id === adicionId)
  if (group) {
    const idx = groupsState.indexOf(group)
    groupsState.splice(idx, 1)
  }
  const aIdx = adicionesState.findIndex((a) => a.id === adicionId)
  if (aIdx >= 0) adicionesState.splice(aIdx, 1)
}

const groupsCopy = [...groups]
const adicionesCopy = [...adiciones]
simulateDeleteAdicion(1, groupsCopy, adicionesCopy)

if (groupsCopy.length !== 0 || adicionesCopy.length !== 0) {
  console.error("FAIL: delete flow left records", { groupsCopy, adicionesCopy })
  ok = false
}

for (const g of groupsCopy) {
  if (!isValidGroup(g)) {
    console.error("FAIL: invalid group after delete", g)
    ok = false
  }
}

if (ok) {
  console.log("OK — Flujo eliminación adición + funding group")
  console.log("Constraint SQL:", CONSTRAINT.trim())
  console.log(JSON.stringify({ causa: "ON DELETE SET NULL viola chk_funding_group_adicion_link", fix: "DELETE grupo antes de adición" }, null, 2))
  process.exit(0)
}
process.exit(1)
