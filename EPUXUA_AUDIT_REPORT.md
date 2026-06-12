# EPUXUA — Informe Arquitectónico de Auditoría
**Fecha:** 2026-06-09  
**Versión:** 1.0  
**Estado:** PENDIENTE DE APROBACIÓN — No ejecutar cambios hasta aprobación

---

## 1. Resumen Ejecutivo

La auditoría identifica **4 problemas críticos**, **3 problemas medios** y **5 inconsistencias de datos** que explican la brecha entre el modelo de negocio (Excel), la base de datos (Supabase) y el frontend (Next.js). El modelo de datos V3 ya está parcialmente implementado y es sólido; la mayoría de cambios son de lógica de servicio y UI, no de esquema de BD.

**Lo que ya funciona correctamente:**
- Kanban filtra solo `INTERADMINISTRATIVO` ✓
- Módulo Funcionamiento: tabla, KPIs, búsqueda, detalle expandible ✓
- Formulario de creación funcionamiento tiene todos los campos del Excel ✓
- Jerarquía contractual (proyecto → contrato principal → derivados) en BD ✓
- Tipos TypeScript alineados con vistas de Supabase ✓

---

## 2. Auditoría del Modelo de Datos (BD + CSV)

### 2.1 Distribución real de contratos (clean_data/contracts.csv)

| `contract_type` | `resource_type` | Rol en negocio |
|-----------------|-----------------|----------------|
| `INTERADMINISTRATIVO` | — | Contrato principal interadmin (manda sobre un proyecto) |
| `DERIVADO` | — | Contrato derivado de un interadministrativo |
| `DIRECTO` | `FUNCIONAMIENTO` | **Contrato de funcionamiento** (apoyo operativo EPUXUA) |
| `DIRECTO` | `GASTO DE OPERACION COMERCIAL` | Operación comercial → **EXCLUIR del dashboard** |
| `TIENDA_VIRTUAL` | — | Acuerdo marco → **EXCLUIR del dashboard** |
| `PAGO_FACTURA` | — | PCF → **EXCLUIR del dashboard** |

> **Regla de negocio detectada:** Los contratos de Funcionamiento son `contract_type = 'DIRECTO'` con `resource_type = 'FUNCIONAMIENTO'` (o sin resource_type en los primeros años). No tienen `parent_contract_id`. Históricamente (2021-2024) se identifican por el campo `resource_type`; en 2025-2026 la BD ya tiene proyectos contenedor.

### 2.2 Inconsistencias enum detectadas

| Problema | Descripción |
|----------|-------------|
| `DERIVADO` como `contract_type` | En `contract.ts` está definido como tipo TS pero en el DDL original no existía como enum. En el CSV sí aparece como valor en BD. Confirmar estado real del enum en Supabase. |
| `contract_type_enum` vs datos | Memory dice: `DIRECTO, INTERADMINISTRATIVO, TIENDA_VIRTUAL, PAGO_FACTURA`. CSV muestra: también `DERIVADO`. El enum en BD debe incluir `DERIVADO`. |

### 2.3 Anomalías de datos (anomalies_log.csv)

| Tipo | Cantidad estimada | Detalle |
|------|-------------------|---------|
| `sin_fecha_fin` | 23+ contratos | Contratos EN_EJECUCION o activos sin fecha de terminación |
| `valor_cero` | 6+ contratos | `initial_value = 0` — posiblemente adiciones/prórrogas sin valor base |

**Contratos con `valor_cero`:** 045-2022, 044-2023, 068-2023, 069-2023, 082-2023, 029-2024, 097-2024
**Contratos con `sin_fecha_fin` activos (riesgo):** 001-2025 a 009-2025 y varios 2023-2024

### 2.4 Vistas SQL existentes

| Vista | Estado | Uso actual |
|-------|--------|------------|
| `v_contract_detail` | ✓ Activa | Funcionamiento, derivados, detalle contrato |
| `v_dashboard_kpis` | ✓ Existe | **HUÉRFANA** — `dashboard.service.ts` la consume pero la página dashboard NO usa ese servicio |
| `v_contract_tracking` | ✓ Existe | Seguimiento (pestaña en expediente) |
| `v_contract_alerts` | ✓ Existe | Alertas |
| `v_project_detail` | ✓ Activa | Lista proyectos, expediente, kanban |
| `v_project_kanban` | ✓ Activa | Kanban (solo interadmin) |
| `v_project_contract_tree` | ✓ Activa | Árbol contractual en expediente |
| `v_derived_contracts` | Herencia | Pendiente verificar si sigue activa |

---

## 3. Auditoría del Frontend

### 3.1 Inventario de páginas

| Ruta | Archivo | Estado | Problema |
|------|---------|--------|----------|
| `/` | `page.tsx` → `project-dashboard-view.tsx` | Funcional con bugs | Ver §3.2 |
| `/proyectos` | `proyectos/page.tsx` | Funcional | — |
| `/proyectos/[id]` | `proyectos/[id]/page.tsx` | Funcional | — |
| `/proyectos/kanban` | `kanban/page.tsx` | ✓ Correcto | Filtra solo INTERADMINISTRATIVO |
| `/proyectos/calendario` | `calendario/page.tsx` | Placeholder | Sin implementar |
| `/contratacion/derivados` | `derivados/page.tsx` | Pendiente verificar | — |
| `/contratacion/supervision` | `supervision/page.tsx` | Pendiente verificar | — |
| `/contratacion/contratos` | `contratos/page.tsx` | **Posible legacy** | Duplica `/contracts/` |
| `/contracts` | `contracts/page.tsx` | **Posible legacy** | Redundante con `/contratacion/contratos` |
| `/contracts/[id]` | `contracts/[id]/page.tsx` | **Posible legacy** | — |
| `/funcionamiento` | `funcionamiento/page.tsx` | Funcional con bugs | Ver §3.3 |
| `/documentos` | `documentos/page.tsx` | Placeholder | Sin implementar |
| `/indicadores` | `indicadores/page.tsx` | Funcional | — |
| `/alertas` | `alertas/page.tsx` | Funcional | — |
| `/seguimiento` | `seguimiento/page.tsx` | Funcional | — |
| `/api/reports/word/[projectId]` | `route.ts` | **STUB vacío** | Sin implementación |
| `/api/reports/ppt/[projectId]` | `route.ts` | **STUB vacío** | Sin implementación |

### 3.2 Problemas del Dashboard (`/`)

**CRÍTICO-1: Lógica de datos mezclada**
- La sección INTERADMINISTRATIVO cuenta **proyectos** (tabla `projects`), no contratos. Esto es correcto por diseño, pero el KPI "Contratos derivados" viene de `derived_count` en `v_project_detail` — verificar que este campo se calcula correctamente.
- La sección FUNCIONAMIENTO usa `computeFuncionamientoContractMetrics()` sobre contratos EN_EJECUCION — correcto.
- `dashboard.service.ts` → `getDashboardMetrics()` → `v_dashboard_kpis` **NO SE USA en ninguna página activa**. Es código muerto.

**CRÍTICO-2: Lista "Proyectos contenedor" de Funcionamiento es incorrecta**
- La lista de proyectos de la sección Funcionamiento muestra "proyectos contenedor" (FUNCIONAMIENTO-2025) y enlaza a `/proyectos/${p.id}`.
- Al abrirlo, carga la pantalla de expediente interadministrativo (con pestañas de seguimiento, árbol contractual, etc.) — interfaz incorrecta para contratos de funcionamiento.
- **Debe cambiar**: la lista debe mostrar los contratos activos, no los proyectos contenedor. El link "Ver árbol →" debe ir a `/funcionamiento`.

**CRÍTICO-3: KPIs de Funcionamiento: "Contratos activos" vs total correcto**
- `funcionamientoActiveContracts` solo tiene contratos `EN_EJECUCION` (filtrado en `page.tsx` línea 25).
- El KPI "Contratos activos" muestra ese subconjunto — correcto.
- Pero el filtro de año NO aplica a `funcionamientoActiveContracts` porque viene del servidor. Si el usuario filtra por año, los KPIs de Funcionamiento no se actualizan.

### 3.3 Problemas del Módulo Funcionamiento (`/funcionamiento`)

**CRÍTICO-4: Requiere "proyecto contenedor" — modelo incorrecto**
- `getFuncionamientoContracts()` hace 2 queries: busca `projects` con `project_type = "FUNCIONAMIENTO"`, luego contratos vinculados por `project_id`.
- Problema: si un contrato de funcionamiento histórico (2021-2024) NO tiene `project_id` vinculado a un proyecto FUNCIONAMIENTO, **no aparece en el módulo**.
- Los contratos migrados del Excel tienen `contract_type = 'DIRECTO'` + `resource_type = 'FUNCIONAMIENTO'` pero probablemente sin `project_id` configurado.
- El módulo puede estar mostrando **0 contratos históricos** o un subconjunto incompleto.

**CRÍTICO-5: Modal de nuevo contrato exige proyecto contenedor**
- `NewFuncionamientoContractModal` exige seleccionar un "Año de funcionamiento" (proyecto contenedor) antes de crear el contrato.
- El modelo de negocio dice: Funcionamiento no tiene jerarquía de proyecto.
- **El proyecto contenedor es una abstracción técnica innecesaria** que complica la UX.

### 3.4 Otros problemas detectados

**MEDIO-1: `v_dashboard_kpis` es código muerto**
- `src/services/dashboard.service.ts` existe y consume `v_dashboard_kpis`
- Ninguna página lo importa actualmente
- Eliminar o reconectar

**MEDIO-2: Páginas de contracts legacy**
- `/contracts/page.tsx` y `/contracts/[id]/page.tsx` parecen ser páginas legacy
- `/contratacion/contratos/page.tsx` también — verificar si tienen implementación real o son placeholders
- El Sidebar NO lista `/contracts/` — es navegación huérfana

**MEDIO-3: Sidebar: rutas de contratación**
- El sidebar muestra "Derivados" → `/contratacion/derivados` y "Supervisión" → `/contratacion/supervision`
- Según el modelo de negocio, los derivados son una sub-vista de proyectos interadministrativos, no una sección separada
- Considerar reorganizar la navegación

---

## 4. ERD Actualizado — Modelo Definitivo

```
┌─────────────────────────────────────────────────────┐
│                 DOMINIO INTERADMINISTRATIVOS          │
│                                                       │
│  projects (project_type = 'INTERADMINISTRATIVO')     │
│    │                                                  │
│    ├── primary_contract_id ──────────┐               │
│    │                                 ▼               │
│    │                         contracts               │
│    │                     (contract_type =            │
│    │                      'INTERADMINISTRATIVO')      │
│    │                             │                   │
│    │                             │ parent_contract_id │
│    │                             ▼                   │
│    │                         contracts               │
│    │                     (contract_type = 'DERIVADO') │
│    │                             │                   │
│    │                             │ parent_contract_id │
│    │                             ▼                   │
│    │                      (sub-derivados, si aplica) │
│    │                                                 │
│    ├── project_assignments (gerentes, consultores)   │
│    ├── project_followups (seguimiento periódico)     │
│    ├── project_alerts (alertas activas)              │
│    └── project_documents (documentos SharePoint)    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 DOMINIO FUNCIONAMIENTO               │
│                                                      │
│  contracts (contract_type = 'DIRECTO',               │
│             parent_contract_id IS NULL)               │
│    │                                                 │
│    ├── payments (pagos individuales)                 │
│    ├── contract_amendments (adiciones)               │
│    ├── contract_extensions (prórrogas)               │
│    ├── contract_suspensions (suspensiones)           │
│    └── contract_policies (pólizas)                  │
│                                                      │
│  *** SIN project_id, SIN jerarquía de proyecto ***  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│             EXCLUIDOS DEL DASHBOARD                  │
│                                                      │
│  contracts (contract_type = 'TIENDA_VIRTUAL')       │
│  contracts (contract_type = 'PAGO_FACTURA')         │
│  contracts (resource_type = 'GASTO DE OPERACION..') │
└─────────────────────────────────────────────────────┘
```

---

## 5. SQL Propuesto

### 5.1 SQL de Validación (ejecutar primero, NO modifica datos)

```sql
-- ── 1. Verificar enum contract_type en BD ────────────────────────────────────
SELECT unnest(enum_range(NULL::contract_type_enum)) AS valor;

-- ── 2. Contratos por tipo y resource_type ────────────────────────────────────
SELECT 
  contract_type,
  resource_type,
  COUNT(*) AS total,
  COUNT(CASE WHEN parent_contract_id IS NULL THEN 1 END) AS sin_padre,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) AS sin_proyecto
FROM contracts
GROUP BY contract_type, resource_type
ORDER BY contract_type, resource_type;

-- ── 3. Contratos DIRECTO sin project_id (candidatos Funcionamiento huérfanos) ─
SELECT 
  c.contract_number, c.year, c.status, c.resource_type,
  c.contractor_id, c.initial_value
FROM contracts c
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.project_id IS NULL
ORDER BY c.year DESC, c.contract_number;

-- ── 4. Proyectos FUNCIONAMIENTO y sus contratos vinculados ───────────────────
SELECT 
  p.project_code, p.year,
  COUNT(c.id) AS contratos_vinculados,
  SUM(c.initial_value) AS valor_total
FROM projects p
LEFT JOIN contracts c ON c.project_id = p.id
WHERE p.project_type = 'FUNCIONAMIENTO'
GROUP BY p.id, p.project_code, p.year
ORDER BY p.year DESC;

-- ── 5. Contratos con valor_cero ───────────────────────────────────────────────
SELECT contract_number, year, contract_type, status, initial_value, object
FROM contracts
WHERE initial_value = 0
ORDER BY year DESC;

-- ── 6. Contratos EN_EJECUCION sin fecha_fin ───────────────────────────────────
SELECT contract_number, year, contract_type, status, start_date, end_date
FROM contracts
WHERE status = 'EN_EJECUCION'
  AND end_date IS NULL
ORDER BY year DESC;

-- ── 7. Contratos DERIVADO sin parent_contract_id (huérfanos) ─────────────────
SELECT contract_number, year, status, initial_value
FROM contracts
WHERE contract_type = 'DERIVADO'
  AND parent_contract_id IS NULL;

-- ── 8. Contratos INTERADMINISTRATIVO sin proyecto ─────────────────────────────
SELECT contract_number, year, status
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO'
  AND project_id IS NULL
  AND parent_contract_id IS NULL;

-- ── 9. Verificar v_dashboard_kpis ────────────────────────────────────────────
SELECT * FROM v_dashboard_kpis;

-- ── 10. Distribución supervisores (funcionamiento) ───────────────────────────
SELECT 
  s.full_name AS supervisor,
  COUNT(c.id) AS contratos,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS activos
FROM contracts c
JOIN supervisors s ON s.id = c.supervisor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
GROUP BY s.full_name
ORDER BY activos DESC;
```

### 5.2 SQL de Corrección (ejecutar SOLO después de aprobación)

```sql
-- ── CORRECCIÓN 1: Vincular contratos DIRECTO históricos a proyectos FUNC ──────
-- Primero crear proyectos contenedor para años que no existen
INSERT INTO projects (project_code, name, project_type, year, lifecycle_status, 
                       total_value, goods_services_value, management_fee_type,
                       management_fee_value, management_fee_amount, executed_value, paid_value)
SELECT DISTINCT
  'FUNCIONAMIENTO-' || c.year,
  'Contratos de Funcionamiento ' || c.year,
  'FUNCIONAMIENTO',
  c.year,
  'EJECUCION',
  0, 0, 'PORCENTAJE', 0, 0, 0, 0
FROM contracts c
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.project_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.project_type = 'FUNCIONAMIENTO' 
      AND p.year = c.year
  );

-- Luego vincular contratos a sus proyectos por año
UPDATE contracts c
SET project_id = p.id
FROM projects p
WHERE p.project_type = 'FUNCIONAMIENTO'
  AND p.year = c.year
  AND c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.project_id IS NULL;

-- ── CORRECCIÓN 2: Verificar que DERIVADO está en el enum ────────────────────
-- Si no existe, añadirlo (ATEN: requiere permisos de superusuario en Supabase)
-- ALTER TYPE contract_type_enum ADD VALUE IF NOT EXISTS 'DERIVADO';

-- ── CORRECCIÓN 3: Actualizar totales en proyectos FUNCIONAMIENTO ────────────
UPDATE projects p
SET 
  total_value = agg.total,
  goods_services_value = agg.total,
  paid_value = agg.pagado
FROM (
  SELECT 
    c.project_id,
    SUM(c.initial_value + c.total_additions_value) AS total,
    SUM(c.paid_value) AS pagado
  FROM contracts c
  WHERE c.project_id IS NOT NULL
  GROUP BY c.project_id
) agg
WHERE p.id = agg.project_id
  AND p.project_type = 'FUNCIONAMIENTO';
```

### 5.3 SQL de Nueva Vista (opcional — para eliminar la dependencia del proyecto contenedor)

```sql
-- Vista de contratos FUNCIONAMIENTO sin necesidad de proyecto contenedor
CREATE OR REPLACE VIEW v_funcionamiento_contracts AS
SELECT 
  c.*,
  s.full_name AS supervisor_name_computed,
  ct.full_name AS contractor_name_computed,
  ra.name AS area_name_computed,
  CURRENT_DATE - c.end_date::date AS days_past_end,
  c.end_date::date - CURRENT_DATE AS days_to_end
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
LEFT JOIN responsible_areas ra ON ra.id = c.responsible_area_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND (c.resource_type = 'FUNCIONAMIENTO' OR c.resource_type IS NULL 
       OR c.resource_type NOT ILIKE '%comercial%')
ORDER BY c.year DESC, c.contract_number;
```

---

## 6. Cambios Backend Propuestos

### 6.1 `src/services/funcionamiento.service.ts`

**Problema:** Query en 2 pasos a través de proyectos contenedor. Contratos históricos sin `project_id` no aparecen.

**Solución propuesta:** Query directa a contratos DIRECTO sin jerarquía de proyecto.

```typescript
// PROPUESTA: getFuncionamientoContracts() simplificado
export async function getFuncionamientoContracts(): Promise<FuncionamientoContract[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("v_contract_detail")
    .select("*")
    .eq("contract_type", "DIRECTO")
    .is("parent_contract_id", null)
    .not("contract_type", "in", '("TIENDA_VIRTUAL","PAGO_FACTURA")')
    .order("year", { ascending: false })
    .order("contract_number", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapToFuncionamientoContract)
}
```

> **Riesgo:** Contratos DIRECTO que son "Operación Comercial" se incluirían. Filtrar por `resource_type NOT ILIKE '%comercial%'` o agregar exclusión explícita.

### 6.2 `src/services/projects.actions.ts` — `createFuncionamientoContract()`

**Problema:** Requiere `project_id` (proyecto contenedor). 

**Opción A (conservadora):** Mantener el proyecto contenedor pero hacerlo transparente — crearlo automáticamente sin mostrárselo al usuario.

**Opción B (limpia):** Eliminar el `project_id` de contratos de funcionamiento. Requiere que la BD permita `project_id IS NULL` en contratos DIRECTO (probablemente ya lo permite).

**Recomendación:** Opción A — menos riesgo de romper RLS y vistas existentes.

### 6.3 `src/services/dashboard.service.ts`

**Problema:** El servicio existe pero `getDashboardMetrics()` no es usado por ninguna página.

**Propuesta:** Eliminar o refactorizar para exponer métricas diferenciadas:
- `getInteradminDashboardMetrics()` — desde `v_project_detail` WHERE `project_type = 'INTERADMINISTRATIVO'`
- `getFuncionamientoDashboardMetrics()` — desde `v_contract_detail` WHERE `contract_type = 'DIRECTO'`

---

## 7. Cambios Frontend Propuestos

### 7.1 Dashboard (`project-dashboard-view.tsx`)

| Cambio | Descripción | Impacto |
|--------|-------------|---------|
| **Lista Funcionamiento** | Cambiar la lista de "proyectos contenedor" por una lista de contratos activos | Medio |
| **Link Funcionamiento** | El botón "Ver árbol →" ya apunta a `/funcionamiento` ✓ | — |
| **Filtro año en Funcionamiento** | El filtro de año debe aplicar también a métricas de funcionamiento | Medio |
| **Eliminar "Proyectos contenedor"** | La sección Funcionamiento no debe mostrar `FUNCIONAMIENTO-2025` como si fuera un proyecto | Alto |

### 7.2 Módulo Funcionamiento

| Cambio | Descripción | Impacto |
|--------|-------------|---------|
| **Modal simplificado** | Eliminar el paso de "Año de funcionamiento" del modal de creación | Alto |
| **Tipo de contratación visible** | Agregar columna "Tipo" en la tabla (modalidad de selección) | Bajo |
| **CRP visible** | El CRP no aparece en el detalle expandible — agregar | Bajo |

### 7.3 Sidebar

| Cambio | Descripción | Recomendación |
|--------|-------------|---------------|
| Eliminar `/contratacion/contratos` si es legacy | Verificar si tiene implementación real | Baja prioridad |
| Añadir acceso rápido a "Nuevo Contrato Funcionamiento" | Botón en la sección Funcionamiento del sidebar | Deseable |

---

## 8. Módulos Word/PowerPoint

### Estado actual
- `/api/reports/word/[projectId]/route.ts` — **stub vacío** (sin implementación)
- `/api/reports/ppt/[projectId]/route.ts` — **stub vacío** (sin implementación)

### Propuesta de implementación

**Word:** Usar `docx` (npm) — librería pura JS sin dependencias nativas.
```
npm install docx
```

**PowerPoint:** Usar `pptxgenjs` (npm) — librería pura JS.
```
npm install pptxgenjs
```

**Estructura de informe Word para proyecto interadministrativo:**
1. Portada: nombre proyecto, código, secretaría, fecha
2. Información general: tipo, year, estado ciclo de vida
3. Contrato principal: número, contratista, fechas, valor
4. Contratos derivados: tabla con nombre/valor/estado/contratista
5. Resumen financiero: contratado / ejecutado / pagado / disponible
6. Seguimiento: últimos registros de project_followups
7. Alertas activas

**Estructura de presentación PPT para proyecto interadministrativo:**
1. Diapositiva 1: Portada corporativa
2. Diapositiva 2: Resumen ejecutivo (KPIs principales)
3. Diapositiva 3: Financiero (gráfica de barras: contratado vs pagado)
4. Diapositiva 4: Árbol contractual (tabla)
5. Diapositiva 5: Estado de seguimiento
6. Diapositiva 6: Alertas y riesgos

---

## 9. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Contratos DIRECTO históricos sin `project_id` no aparecen en Funcionamiento | **ALTA** | **ALTO** | Ejecutar SQL validación §5.1 consulta 3 antes de cualquier cambio |
| El enum `contract_type_enum` no incluye `DERIVADO` en la BD real | Media | Alto | Ejecutar §5.1 consulta 1 |
| RLS bloquea queries directas a contratos sin proyecto | Media | Medio | Probar con usuario autenticado desde audit_tmp.mjs |
| Modificar `getFuncionamientoContracts()` rompe el dashboard | Baja | Medio | El dashboard usa `computeFuncionamientoContractMetrics()` — solo cambia la fuente de datos |
| Proyecto contenedor requerido por alguna FK o trigger | Baja | Alto | Verificar con §5.1 consulta 4 |

---

## 10. Plan de Implementación por Fases

### FASE 0 — Validación (1-2 horas, sin cambios en código)
1. Ejecutar SQL de validación §5.1 en Supabase SQL Editor
2. Revisar resultados: ¿cuántos contratos DIRECTO sin `project_id`? ¿`DERIVADO` en enum?
3. Ejecutar `node audit_tmp.mjs <password>` para ver distribución actual de Funcionamiento
4. Documentar resultados en este informe antes de continuar

### FASE 1 — Backend Funcionamiento (2-3 horas)
1. Modificar `getFuncionamientoContracts()` para query directa (sin proyecto contenedor)
2. Modificar `createFuncionamientoContract()` — proyecto contenedor automático, transparente al usuario
3. Eliminar la sección "Año de funcionamiento" del modal de creación
4. Validar: página /funcionamiento muestra todos los contratos históricos

### FASE 2 — Dashboard (1-2 horas)
1. Cambiar la lista de la sección Funcionamiento: mostrar contratos activos, no proyectos
2. Conectar el filtro de año a las métricas de funcionamiento
3. Verificar que los KPIs de interadmin cuentan correctamente (proyectos, no contratos)

### FASE 3 — Word/PowerPoint (4-6 horas)
1. Instalar `docx` y `pptxgenjs`
2. Implementar `route.ts` de Word para proyectos interadministrativos
3. Implementar `route.ts` de PPT para proyectos interadministrativos
4. Añadir botones "Generar Word" y "Generar PPT" en el expediente de proyecto
5. Extender a contratos de funcionamiento

### FASE 4 — Limpieza (1 hora)
1. Eliminar `dashboard.service.ts` si queda huérfano
2. Verificar y eliminar páginas legacy en `/contracts/`
3. Reorganizar el sidebar si se decide

### FASE 5 — SQL de corrección (30 min, solo si necesario)
1. Ejecutar corrección §5.2 para vincular contratos históricos sin `project_id`
2. Recalcular totales en proyectos FUNCIONAMIENTO

---

## 11. Decisiones que Requieren Aprobación

Antes de ejecutar cualquier cambio, se requiere decisión sobre:

1. **¿Los contratos de Funcionamiento deben requerir `project_id`?**
   - **Opción A (recomendada):** Mantener proyecto contenedor pero transparente (creación automática en segundo plano)
   - **Opción B:** Eliminar completamente el `project_id` de contratos DIRECTO funcionamiento — requiere cambios en RLS y vistas

2. **¿`getFuncionamientoContracts()` debe consultar directamente contratos DIRECTO o mantener el paso por proyectos?**
   - El paso por proyectos funciona solo si todos los contratos históricos fueron migrados con `project_id`. Si hay huérfanos, la query directa es obligatoria.

3. **¿Se implementa Word/PPT en esta iteración o se deja para después?**
   - Requiere 4-6 horas adicionales de trabajo

4. **¿Se eliminan las páginas legacy `/contracts/` y `/contratacion/contratos/`?**
   - Solo si se confirma que no son accesibles desde ningún flujo activo

---

*Próximo paso: ejecutar las queries de validación §5.1 y reportar los resultados antes de iniciar cualquier implementación.*
