import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vakiuatccfzgtjgrdoqt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZha2l1YXRjY2Z6Z3RqZ3Jkb3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjkzMjcsImV4cCI6MjA5NTUwNTMyN30.YjIISn-xSwvW1zQy3OlW6DV1v6yqqPa5x7lnAVe8WAU'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Paso 1: Login para obtener sesión
const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: 'camila.ruiz1019@gmail.com',
  password: process.argv[2] ?? ''
})

if (authError) {
  console.error('Auth error:', authError.message)
  process.exit(1)
}
console.log('Autenticado como:', auth.user?.email)

// Paso 2: proyectos FUNCIONAMIENTO
const { data: projects, error: pe } = await supabase
  .from('projects')
  .select('id, project_code, year, project_type')
  .eq('project_type', 'FUNCIONAMIENTO')

if (pe) { console.error('Error proyectos:', pe.message); process.exit(1) }
console.log('\n=== PROYECTOS FUNCIONAMIENTO ===')
console.log(JSON.stringify(projects, null, 2))

const projectIds = projects.map(p => p.id)

// Paso 3: contratos vinculados
const { data: contractRefs, error: re } = await supabase
  .from('contracts')
  .select('id, project_id, contract_type, status, contract_number, year')
  .in('project_id', projectIds)
  .limit(5000)

if (re) { console.error('Error contractRefs:', re.message); process.exit(1) }
console.log(`\n=== CONTRATOS VINCULADOS (total: ${contractRefs.length}) ===`)

// Paso 4: detalles completos
const contractIds = contractRefs.map(r => r.id)
const { data: details, error: de } = await supabase
  .from('v_contract_detail')
  .select('id, contract_number, contractor_name, status, contract_type, year, start_date, end_date, selection_modality')
  .in('id', contractIds)
  .limit(5000)

if (de) { console.error('Error details:', de.message); process.exit(1) }

// Conteo por status
const byStatus = {}
for (const c of details) {
  byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
}
console.log('\n=== DISTRIBUCIÓN POR ESTADO (todos los contratos de FUNCIONAMIENTO) ===')
console.log(JSON.stringify(byStatus, null, 2))
console.log(`TOTAL contratos FUNCIONAMIENTO: ${details.length}`)

// Paso 5: los que cuentan como activos (EN_EJECUCION)
const activos = details.filter(c => c.status === 'EN_EJECUCION')
console.log(`\n=== CONTRATOS EN_EJECUCION (lo que cuenta en el KPI): ${activos.length} ===`)
console.log('\nID | N° Contrato | Contratista | Estado | Tipo | Año | Inicio | Fin')
console.log('-'.repeat(120))
for (const c of activos.sort((a,b) => a.contract_number.localeCompare(b.contract_number))) {
  console.log(`${c.id} | ${c.contract_number} | ${c.contractor_name} | ${c.status} | ${c.contract_type} | ${c.year} | ${c.start_date ?? 'N/A'} | ${c.end_date ?? 'N/A'}`)
}

// Paso 6: ver también por tipo de contrato
const byType = {}
for (const c of activos) {
  byType[c.contract_type] = (byType[c.contract_type] ?? 0) + 1
}
console.log('\n=== ACTIVOS POR TIPO DE CONTRATO ===')
console.log(JSON.stringify(byType, null, 2))

// Paso 7: verificar si hay duplicados de contract_number
const numeros = activos.map(c => c.contract_number)
const duplicados = numeros.filter((n, i) => numeros.indexOf(n) !== i)
console.log('\n=== N° DE CONTRATO DUPLICADOS ===', duplicados.length > 0 ? duplicados : 'Ninguno')

