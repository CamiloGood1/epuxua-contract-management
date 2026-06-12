/**
 * EPUXUA — Auditoría Completa de Contratos de Funcionamiento
 *
 * Compara tres fuentes:
 *   [A] Excel (clean_data/contracts.csv) — fuente de verdad
 *   [B] Supabase BD — contratos DIRECTO con resource_type=FUNCIONAMIENTO
 *   [C] getFuncionamientoContracts() — lo que ve el módulo (via proyectos contenedor)
 *
 * Uso: node audit_funcionamiento.mjs <password>
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = 'https://vakiuatccfzgtjgrdoqt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZha2l1YXRjY2Z6Z3RqZ3Jkb3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjkzMjcsImV4cCI6MjA5NTUwNTMyN30.YjIISn-xSwvW1zQy3OlW6DV1v6yqqPa5x7lnAVe8WAU'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// ── Autenticación ─────────────────────────────────────────────────────────────
const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: 'camila.ruiz1019@gmail.com',
  password: process.argv[2] ?? ''
})
if (authError) { console.error('Auth error:', authError.message); process.exit(1) }
console.log('✓ Autenticado como:', auth.user?.email)

// ── Cargar CSV (fuente Excel) ─────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"' && !inQuotes) { inQuotes = true }
    else if (c === '"' && inQuotes) { inQuotes = false }
    else if (c === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += c }
  }
  result.push(current)
  return result
}

const csvLines = readFileSync(resolve('./clean_data/contracts.csv'), 'utf8').split('\n')
const header = csvLines[0].split(',')
const COL = {}
header.forEach((h, i) => COL[h.trim()] = i)

const csvContracts = []
for (let i = 1; i < csvLines.length; i++) {
  if (!csvLines[i].trim()) continue
  const row = parseCSVLine(csvLines[i])
  csvContracts.push({
    id: row[COL['id']] || '',
    number: row[COL['contract_number']] || '',
    year: parseInt(row[COL['year']]) || 0,
    type: row[COL['contract_type']] || '',
    resource_type: row[COL['resource_type']] || '',
    parent_ref: row[COL['parent_contract_ref']] || '',
    status: row[COL['status']] || '',
    supervisor: row[COL['supervisor_name']] || '',
    initial_value: parseFloat((row[COL['initial_value']] || '0').replace(',', '.')) || 0,
    object: (row[COL['object']] || '').substring(0, 70),
  })
}

// FUENTE A: Excel — contratos de funcionamiento
const excelFuncionamiento = csvContracts.filter(c =>
  c.type === 'DIRECTO' &&
  !c.parent_ref &&
  c.resource_type === 'FUNCIONAMIENTO'
)
const excelIds = new Set(excelFuncionamiento.map(c => c.id))
const excelNumbers = new Set(excelFuncionamiento.map(c => `${c.number}|${c.year}`))

console.log(`\n${'='.repeat(80)}`)
console.log('FUENTE A — EXCEL (clean_data/contracts.csv)')
console.log(`${'='.repeat(80)}`)
console.log(`Total contratos FUNCIONAMIENTO en Excel: ${excelFuncionamiento.length}`)

const excelByYear = {}
excelFuncionamiento.forEach(c => { excelByYear[c.year] = (excelByYear[c.year]||0)+1 })
console.log('Por año:', Object.entries(excelByYear).sort((a,b)=>a[0]-b[0]).map(([y,n])=>`${y}:${n}`).join(', '))

const excelByStatus = {}
excelFuncionamiento.forEach(c => { const s = c.status||'SIN_ESTADO'; excelByStatus[s]=(excelByStatus[s]||0)+1 })
console.log('Por estado:', JSON.stringify(excelByStatus))

// ── FUENTE B: Supabase BD directa ─────────────────────────────────────────────
console.log(`\n${'='.repeat(80)}`)
console.log('FUENTE B — SUPABASE: contratos DIRECTO con resource_type=FUNCIONAMIENTO')
console.log(`${'='.repeat(80)}`)

// B1: Query directa a contracts
const { data: bdDirecto, error: bdErr1 } = await supabase
  .from('contracts')
  .select('id, contract_number, year, contract_type, resource_type, status, project_id, parent_contract_id, supervisor_id, initial_value')
  .eq('contract_type', 'DIRECTO')
  .is('parent_contract_id', null)
  .limit(5000)

if (bdErr1) { console.error('Error BD B1:', bdErr1.message); process.exit(1) }

// Todos los DIRECTO sin padre
const bdTodosDirecto = bdDirecto || []
console.log(`Total contratos DIRECTO sin parent en BD: ${bdTodosDirecto.length}`)

// Por resource_type
const bdByResource = {}
bdTodosDirecto.forEach(c => {
  const k = c.resource_type || '(null)';
  bdByResource[k] = (bdByResource[k]||0)+1
})
console.log('Por resource_type en BD:')
Object.entries(bdByResource).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  "${k}": ${v}`))

// Funcionamiento estricto en BD
const bdFuncionamiento = bdTodosDirecto.filter(c => c.resource_type === 'FUNCIONAMIENTO')
const bdFuncionamientoIds = new Set(bdFuncionamiento.map(c => c.id))
const bdFuncionamientoNumbers = new Set(bdFuncionamiento.map(c => `${c.contract_number}|${c.year}`))

console.log(`\nContratos FUNCIONAMIENTO en BD (resource_type='FUNCIONAMIENTO'): ${bdFuncionamiento.length}`)

const bdByYear = {}
bdFuncionamiento.forEach(c => { bdByYear[c.year] = (bdByYear[c.year]||0)+1 })
console.log('Por año:', Object.entries(bdByYear).sort((a,b)=>a[0]-b[0]).map(([y,n])=>`${y}:${n}`).join(', '))

const bdByStatus = {}
bdFuncionamiento.forEach(c => { bdByStatus[c.status]=(bdByStatus[c.status]||0)+1 })
console.log('Por estado:', JSON.stringify(bdByStatus))

// Con y sin project_id
const bdConProyecto = bdFuncionamiento.filter(c => c.project_id)
const bdSinProyecto = bdFuncionamiento.filter(c => !c.project_id)
console.log(`\nCon project_id (vinculados a proyecto contenedor): ${bdConProyecto.length}`)
console.log(`Sin project_id (huérfanos): ${bdSinProyecto.length}`)

// ── FUENTE C: Lo que ve getFuncionamientoContracts() ─────────────────────────
console.log(`\n${'='.repeat(80)}`)
console.log('FUENTE C — LÓGICA FRONTEND: getFuncionamientoContracts()')
console.log('  (proyectos FUNCIONAMIENTO → contracts.project_id ∈ esos IDs)')
console.log(`${'='.repeat(80)}`)

// Paso 1: proyectos FUNCIONAMIENTO
const { data: proyectos, error: pErr } = await supabase
  .from('projects')
  .select('id, project_code, year, project_type')
  .eq('project_type', 'FUNCIONAMIENTO')

if (pErr) { console.error('Error proyectos:', pErr.message); process.exit(1) }
console.log(`Proyectos FUNCIONAMIENTO en BD: ${(proyectos||[]).length}`)
;(proyectos||[]).sort((a,b)=>a.year-b.year).forEach(p => {
  console.log(`  ${p.project_code} (id: ${p.id.substring(0,8)}...)`)
})

if (!proyectos || proyectos.length === 0) {
  console.log('\n⚠️  No hay proyectos FUNCIONAMIENTO → getFuncionamientoContracts() retorna []')
} else {
  const projectIds = proyectos.map(p => p.id)

  // Paso 2: contratos con esos project_ids
  const { data: cRefs, error: rErr } = await supabase
    .from('contracts')
    .select('id, project_id, contract_number, year, contract_type, status')
    .in('project_id', projectIds)
    .limit(5000)

  if (rErr) { console.error('Error cRefs:', rErr.message); process.exit(1) }

  const frontendContractIds = (cRefs||[]).map(r => r.id)
  const frontendIds = new Set(frontendContractIds)
  const frontendNumbers = new Set((cRefs||[]).map(c => `${c.contract_number}|${c.year}`))

  console.log(`\nContratos vinculados a proyectos FUNCIONAMIENTO (via project_id): ${frontendContractIds.length}`)

  if (frontendContractIds.length > 0) {
    // Paso 3: detalles via v_contract_detail
    const { data: details, error: dErr } = await supabase
      .from('v_contract_detail')
      .select('id, contract_number, year, contract_type, status, resource_type')
      .in('id', frontendContractIds)
      .limit(5000)
    if (dErr) { console.error('Error details:', dErr.message); process.exit(1) }

    const frontendByYear = {}
    ;(details||[]).forEach(c => { frontendByYear[c.year]=(frontendByYear[c.year]||0)+1 })
    console.log('Por año:', Object.entries(frontendByYear).sort((a,b)=>a[0]-b[0]).map(([y,n])=>`${y}:${n}`).join(', '))

    const frontendByStatus = {}
    ;(details||[]).forEach(c => { frontendByStatus[c.status]=(frontendByStatus[c.status]||0)+1 })
    console.log('Por estado:', JSON.stringify(frontendByStatus))

    const frontendByType = {}
    ;(details||[]).forEach(c => { frontendByType[c.contract_type]=(frontendByType[c.contract_type]||0)+1 })
    console.log('Por contract_type:', JSON.stringify(frontendByType))

    // ── COMPARATIVO A vs B vs C ─────────────────────────────────────────────
    console.log(`\n${'='.repeat(80)}`)
    console.log('COMPARATIVO — EXCEL [A] vs BD DIRECTA [B] vs FRONTEND [C]')
    console.log(`${'='.repeat(80)}`)
    console.log(`A (Excel):    ${excelFuncionamiento.length} contratos`)
    console.log(`B (BD):       ${bdFuncionamiento.length} contratos`)
    console.log(`C (Frontend): ${(details||[]).length} contratos`)

    // A ∩ B (en Excel Y en BD)
    const aInB = excelFuncionamiento.filter(c => bdFuncionamientoIds.has(c.id))
    // A - B (en Excel pero NO en BD)
    const aNotB = excelFuncionamiento.filter(c => !bdFuncionamientoIds.has(c.id))
    // B - A (en BD pero NO en Excel)
    const bNotA = bdFuncionamiento.filter(c => !excelIds.has(c.id))
    // B ∩ C (en BD Y en Frontend)
    const bInC = bdFuncionamiento.filter(c => frontendIds.has(c.id))
    // B - C (en BD pero NO visible en Frontend)
    const bNotC = bdFuncionamiento.filter(c => !frontendIds.has(c.id))
    // C - B (en Frontend pero NO en B — contratos de otro tipo en proyecto contenedor)
    const cNotB = (details||[]).filter(c => !bdFuncionamientoIds.has(c.id))

    console.log(`\n── A ∩ B  En Excel Y en BD (coincidencia): ${aInB.length}`)

    console.log(`\n── A - B  En Excel pero NO en BD (FALTANTES en BD): ${aNotB.length}`)
    if (aNotB.length > 0) {
      aNotB.sort((a,b)=>a.year-b.year||a.number.localeCompare(b.number)).forEach(c => {
        console.log(`  ⚠️  ${c.number} (${c.year}) | ${c.status} | $${c.initial_value.toLocaleString('es-CO')}`)
      })
    }

    console.log(`\n── B - A  En BD pero NO en Excel (SOBRANTES en BD): ${bNotA.length}`)
    if (bNotA.length > 0) {
      bNotA.sort((a,b)=>a.year-b.year).forEach(c => {
        console.log(`  🔵 ${c.contract_number} (${c.year}) | ${c.status} | BD id: ${c.id.substring(0,8)}`)
      })
    }

    console.log(`\n── B ∩ C  En BD Y visible en Frontend: ${bInC.length}`)

    console.log(`\n── B - C  En BD pero NO visible en Frontend (OCULTOS): ${bNotC.length}`)
    if (bNotC.length > 0) {
      bNotC.sort((a,b)=>a.year-b.year).forEach(c => {
        const proj = c.project_id ? 'con project_id' : 'SIN project_id ⚠️'
        console.log(`  🔴 ${c.contract_number} (${c.year}) | ${c.status} | ${proj}`)
      })
    }

    console.log(`\n── C - B  En Frontend pero tipo != FUNCIONAMIENTO (contratos extraños): ${cNotB.length}`)
    if (cNotB.length > 0) {
      cNotB.forEach(c => {
        console.log(`  ⚡ ${c.contract_number} (${c.year}) | type: ${c.contract_type} | resource: ${c.resource_type}`)
      })
    }

    // Sin project_id en BD
    console.log(`\n── B con project_id NULL (huérfanos en BD): ${bdSinProyecto.length}`)
    if (bdSinProyecto.length > 0) {
      bdSinProyecto.sort((a,b)=>a.year-b.year).forEach(c => {
        console.log(`  🟡 ${c.contract_number} (${c.year}) | ${c.status}`)
      })
    }
  } else {
    console.log('\n⚠️  No hay contratos vinculados a proyectos FUNCIONAMIENTO')
    console.log('    → getFuncionamientoContracts() retorna [] (módulo vacío)')

    // Comparativo A vs B sin frontend
    console.log(`\n${'='.repeat(80)}`)
    console.log('COMPARATIVO — EXCEL [A] vs BD DIRECTA [B]')
    console.log(`${'='.repeat(80)}`)
    console.log(`A (Excel): ${excelFuncionamiento.length}  |  B (BD): ${bdFuncionamiento.length}  |  C (Frontend): 0`)

    const aNotB = excelFuncionamiento.filter(c => !bdFuncionamientoIds.has(c.id))
    const bNotA = bdFuncionamiento.filter(c => !excelIds.has(c.id))

    console.log(`\nA ∩ B (coincidencia): ${excelFuncionamiento.length - aNotB.length}`)
    console.log(`A - B (Excel no en BD): ${aNotB.length}`)
    console.log(`B - A (BD no en Excel): ${bNotA.length}`)
    console.log(`B sin project_id: ${bdSinProyecto.length}`)

    if (aNotB.length > 0) {
      console.log('\nEn Excel pero NO en BD:')
      aNotB.forEach(c => console.log(`  ⚠️  ${c.number} (${c.year}) | ${c.status}`))
    }
    if (bNotA.length > 0) {
      console.log('\nEn BD pero NO en Excel:')
      bNotA.forEach(c => console.log(`  🔵 ${c.contract_number} (${c.year}) | ${c.status}`))
    }
  }
}

// ── ANÁLISIS DASHBOARD ────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(80)}`)
console.log('FUENTE D — DASHBOARD (contratos EN_EJECUCION que alimentan KPIs)')
console.log(`${'='.repeat(80)}`)

const excelActivos = excelFuncionamiento.filter(c => c.status === 'EN_EJECUCION')
const bdActivos = bdFuncionamiento.filter(c => c.status === 'EN_EJECUCION')

console.log(`Excel: ${excelActivos.length} contratos EN_EJECUCION`)
console.log(`BD directa: ${bdActivos.length} contratos EN_EJECUCION`)

const excelActivosNums = new Set(excelActivos.map(c => `${c.number}|${c.year}`))
const bdActivosNums = new Set(bdActivos.map(c => `${c.contract_number}|${c.year}`))

const activosFaltantesEnBD = excelActivos.filter(c => !bdFuncionamientoIds.has(c.id))
const activosSobrantesEnBD = bdActivos.filter(c => !excelIds.has(c.id))

console.log(`\nActivos en Excel pero NO en BD: ${activosFaltantesEnBD.length}`)
activosFaltantesEnBD.forEach(c => console.log(`  ⚠️  ${c.number} (${c.year}) | Supervisor: ${c.supervisor}`))

console.log(`\nActivos en BD pero NO en Excel: ${activosSobrantesEnBD.length}`)
activosSobrantesEnBD.forEach(c => console.log(`  🔵 ${c.contract_number} (${c.year}) | ${c.status}`))

// ── ENUM CHECK ────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(80)}`)
console.log('CHECK: contract_type DERIVADO en BD')
console.log(`${'='.repeat(80)}`)

const { data: derivados, error: drvErr } = await supabase
  .from('contracts')
  .select('id, contract_number, year, contract_type, parent_contract_id')
  .eq('contract_type', 'DERIVADO')
  .limit(10)

if (drvErr) {
  console.log('Error consultando DERIVADO (posible que el enum no exista):', drvErr.message)
} else {
  console.log(`Contratos con contract_type='DERIVADO': ${(derivados||[]).length} (muestra de 10)`)
  ;(derivados||[]).forEach(c => {
    console.log(`  ${c.contract_number} (${c.year}) | parent: ${c.parent_contract_id ? c.parent_contract_id.substring(0,8) : 'NULL'}`)
  })
}

// ── CONTRATOS NULL type ───────────────────────────────────────────────────────
console.log(`\n${'='.repeat(80)}`)
console.log('CHECK: Contratos con contract_type NULL en BD')
console.log(`${'='.repeat(80)}`)

const { data: nullType, error: ntErr } = await supabase
  .from('contracts')
  .select('id, contract_number, year, contract_type, resource_type, status')
  .is('contract_type', null)
  .limit(20)

if (ntErr) {
  console.log('Error:', ntErr.message)
} else {
  console.log(`Contratos con contract_type NULL: ${(nullType||[]).length}`)
  ;(nullType||[]).slice(0,10).forEach(c => {
    console.log(`  ${c.contract_number} (${c.year}) | resource: ${c.resource_type} | status: ${c.status}`)
  })
}

// ── RESUMEN EJECUTIVO ─────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(80)}`)
console.log('RESUMEN EJECUTIVO')
console.log(`${'='.repeat(80)}`)
console.log(`Excel [A]:    ${excelFuncionamiento.length} contratos FUNCIONAMIENTO (284 esperado)`)
console.log(`BD [B]:       ${bdFuncionamiento.length} contratos DIRECTO+FUNCIONAMIENTO en BD`)
console.log(`Frontend [C]: pendiente de contar arriba`)
console.log(`\nActivos Excel: ${excelActivos.length} | Activos BD: ${bdActivos.length}`)
console.log(`\nEscaneo completado: ${new Date().toISOString()}`)
