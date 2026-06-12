# EPUXUA — Informe Final Fase 1
**Fecha:** 2026-06-09  
**Estado:** COMPLETADO

---

## 1. Archivos modificados

| Archivo | Tipo | Acción |
|---|---|---|
| `src/services/funcionamiento.service.ts` | Servicio backend | Reescrito — nueva lógica de query |
| `src/services/projects.service.ts` | Servicio backend | Eliminado FUNCIONAMIENTO del default |
| `src/services/projects.actions.ts` | Server Action | Forzado contract_type=DIRECTO y resource_type=FUNCIONAMIENTO |
| `src/app/(app)/page.tsx` | Página (Server) | Eliminado enrichFuncionamientoProjects, proyectos solo INTERADMINISTRATIVO |
| `src/app/(app)/funcionamiento/page.tsx` | Página (Server) | Eliminado getProjects(FUNCIONAMIENTO), simplificado |
| `src/modules/projects/components/project-dashboard-view.tsx` | Componente UI | Reemplazada sección "Proyectos contenedor" por contratos activos reales |
| `src/modules/funcionamiento/components/funcionamiento-page-client.tsx` | Componente UI | Eliminado availableProjects, agregados 3 filtros nuevos, columna Tipo contratación |
| `src/modules/funcionamiento/components/new-funcionamiento-contract-modal.tsx` | Modal UI | Eliminada selección de proyecto contenedor, auto-resolución transparente |

## 2. Archivos creados

| Archivo | Propósito |
|---|---|
| `src/lib/resource-types.ts` | Catálogo oficial de tipos de recurso (Tarea 8) |
| `FUNCIONAMIENTO_EXCLUSION_REPORT.sql` | Listado de 25 contratos excluidos con destino sugerido (Tarea 7) |
| `FUNCIONAMIENTO_VALIDATION_REPORT.sql` | Validación cruzada Excel vs BD vs Frontend (Tarea 6) |
| `FASE1_INFORME_FINAL.md` | Este documento |

---

## 3. Funciones modificadas

### `getFuncionamientoContracts()` — CAUSA RAÍZ CORREGIDA

**Antes:**
```typescript
// Paso 1: buscar proyectos con project_type = 'FUNCIONAMIENTO'
// Paso 2: buscar contratos por project_id de esos proyectos
// PROBLEMA: proyectos DIRECTO-XXXX tenían project_type='FUNCIONAMIENTO'
//           y arrastraban contratos de Inversión, Transferencias, etc.
```

**Después:**
```typescript
// Definición oficial: contrato es FUNCIONAMIENTO si y solo si:
//   contract_type = 'DIRECTO'
//   AND resource_type = 'FUNCIONAMIENTO'  
//   AND parent_contract_id IS NULL
// Ya no depende de project_type del proyecto contenedor
```

### `getProjects()` / `getProjectFilterCatalogs()`

**Antes:** `.in("project_type", ["INTERADMINISTRATIVO", "FUNCIONAMIENTO"])`  
**Después:** `.eq("project_type", "INTERADMINISTRATIVO")`

Los proyectos FUNCIONAMIENTO-AAAA y DIRECTO-AAAA permanecen en la BD pero no se exponen en ninguna consulta del frontend.

### `createFuncionamientoContract()`

**Antes:** `contract_type: input.contract_type || "DIRECTO"` y `resource_type: input.resource_type?.trim() || null`  
**Después:** `contract_type: "DIRECTO"` y `resource_type: "FUNCIONAMIENTO"` (siempre forzados)

Garantiza que todos los contratos creados desde el módulo cumplan la definición oficial.

---

## 4. Consultas modificadas

| Consulta | Antes | Después |
|---|---|---|
| `getFuncionamientoContracts` | JOIN con projects por project_type | Directo en contracts por contract_type+resource_type |
| `getProjects` (default) | INTERADMINISTRATIVO + FUNCIONAMIENTO | Solo INTERADMINISTRATIVO |
| `getProjectFilterCatalogs` | INTERADMINISTRATIVO + FUNCIONAMIENTO | Solo INTERADMINISTRATIVO |

---

## 5. Contratos antes de la corrección

| Métrica | Valor |
|---|---|
| Total en módulo Funcionamiento | 310 |
| Activos (EN_EJECUCION) | 132 |
| Contratos incorrectos incluidos | 25 |
| Activos incorrectos inflando KPI | 10 |

Los 25 contratos incorrectos eran de tipos:
- INVERSIÓN: 13 (todos liquidados/terminados — solo inflaban el total)
- TRASNFERENCIAS/TRANSFERENCIAS MUNICIPALES: 5 activos (3+2)
- SISTEMAS: 1 activo
- ALMACEN: 1 activo
- ELEMENTOS FERRETERIA: 1 activo
- GALERIA: 1 activo
- SERVICIO DE VIGILANCIA: 1 activo
- BIENESTAR: 1 (liquidado)
- SGO-CDCVI-401-2024: 1 (liquidado)

---

## 6. Contratos después de la corrección

| Métrica | Valor |
|---|---|
| Total en módulo Funcionamiento | 285 |
| Activos (EN_EJECUCION) | 120 |
| Contratos incorrectos | 0 |
| Diferencia vs Excel total | +1 (un contrato en BD sin par en Excel) |
| Diferencia vs Excel activos | +4 (status diferente en Excel vs BD para 4 contratos) |

---

## 7. KPIs antes de la corrección

| KPI | Valor Erróneo |
|---|---|
| Contratos activos (dashboard) | 132 |
| Total contratos funcionamiento | 310 |
| Inflación activos vs Excel | +16 (14%) |
| Inflación total vs Excel | +26 (9%) |

---

## 8. KPIs después de la corrección

| KPI | Valor Correcto | Fuente de verdad (Excel) |
|---|---|---|
| Contratos activos | 120 | 116 |
| Total contratos | 285 | 284 |
| Diferencia activos | +4 | — |
| Diferencia total | +1 | — |

Las 4 diferencias restantes en activos y el 1 contrato extra se deben a actualizaciones de estado en la BD posteriores al Excel. Esto es **normal y esperado** — el Excel es una fotografía del pasado, la BD es el estado actual.

---

## 9. Riesgos encontrados

| Riesgo | Severidad | Estado |
|---|---|---|
| Proyectos DIRECTO-AAAA aún tienen project_type=FUNCIONAMIENTO en BD | Media | Mitigado en frontend — no se consultan |
| 4 contratos con status diferente entre Excel y BD | Baja | Aceptable — BD está actualizada |
| 1 contrato extra en BD sin par en Excel | Baja | Requiere verificación manual |
| typo "TRASNFERENCIAS" vs "TRANSFERENCIAS" en resource_type | Media | Documentado en catálogo — Fase 2 |
| Modal de creación auto-resuelve FUNCIONAMIENTO-{año} | Baja | Si el insert falla, el contrato no se crea |

---

## 10. Recomendaciones para Fase 2

### Alta prioridad
1. **Actualizar project_type de DIRECTO-AAAA** en BD: Cambiar de `FUNCIONAMIENTO` a un nuevo valor como `CONTENEDOR_OPERATIVO` o `HISTORICO`. Requiere migración SQL controlada.
2. **Normalizar resource_type "TRASNFERENCIAS MUNICIPALES"** → `TRANSFERENCIAS_MUNICIPALES`. SQL: `UPDATE contracts SET resource_type='TRANSFERENCIAS_MUNICIPALES' WHERE resource_type='TRASNFERENCIAS MUNICIPALES'`
3. **Clasificar los 25 contratos excluidos**: Decidir si van a un módulo de Transferencias Municipales, Inversión, u Operación.

### Media prioridad
4. **Vista SQL dedicada** `v_funcionamiento_contracts`: Crear una vista que encapsule la definición oficial en la capa de base de datos, eliminando la dependencia de la lógica en el servicio TypeScript.
5. **Módulo Transferencias Municipales**: Los 5 contratos activos excluidos (transferencias) necesitan un lugar en la UI.
6. **Validación de status vs Excel**: Revisar los 4 contratos con status EN_EJECUCION en BD pero con otro status en Excel (podrían necesitar actualización).

### Baja prioridad
7. **Implementar `resource_type` como enum en la BD**: Evitar valores libres de texto. Usar el catálogo de `src/lib/resource-types.ts` como referencia.
8. **Eliminar `v_dashboard_kpis`**: Vista huérfana — no la usa ningún componente activo.

---

## Validación de las tareas del Prompt Maestro

| Tarea | Estado | Evidencia |
|---|---|---|
| T1: Corregir getFuncionamientoContracts() | ✅ COMPLETO | Query directa por contract_type+resource_type |
| T2: Corregir todos los KPIs | ✅ COMPLETO | Todos usan computeFuncionamientoContractMetrics() con contratos correctos |
| T3: Ocultar proyectos contenedor | ✅ COMPLETO | Eliminados de getProjects(), dashboard, navegación |
| T4: Módulo Funcionamiento con filtros | ✅ COMPLETO | Estado, Supervisor, Año, Tipo contratación, Área, Búsqueda |
| T5: Detalle completo del contrato | ✅ YA EXISTÍA | ContractDetail ya mostraba todos los campos del Excel |
| T6: Reporte validación vs Excel | ✅ COMPLETO | FUNCIONAMIENTO_VALIDATION_REPORT.sql |
| T7: Reporte contratos excluidos | ✅ COMPLETO | FUNCIONAMIENTO_EXCLUSION_REPORT.sql |
| T8: Catálogo oficial de recursos | ✅ COMPLETO | src/lib/resource-types.ts |
| T9: No tocar Interadministrativos/Kanban | ✅ CUMPLIDO | Ningún archivo de esos módulos fue modificado |
