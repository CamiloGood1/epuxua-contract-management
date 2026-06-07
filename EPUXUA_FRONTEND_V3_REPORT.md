# EPUXUA Frontend V3 — Informe técnico

**Versión:** 1.0  
**Fecha:** 2026-06-07  
**Estado:** Fase 2 frontend implementada (núcleo proyecto-centrado)  
**Stack:** Next.js 16 · TypeScript · Tailwind · Supabase (vistas V3)

---

## Resumen ejecutivo

Se implementó la evolución frontend de **contrato-centrado → proyecto-centrado**: nueva navegación, servicios sobre vistas V3, expediente de proyecto con pestañas, Kanban con persistencia de `lifecycle_status`, dashboard por proyectos y módulos financieros/documentos/indicadores/alertas básicos.

**Sin cambios en base de datos** — solo lectura/UPDATE de columnas existentes (`projects.lifecycle_status`).

---

## Componentes creados

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `lifecycle-badge.tsx` | `src/modules/projects/components/` | Badge de ciclo de vida (Kanban) |
| `contract-tree.tsx` | `src/modules/projects/components/` | Árbol PRINCIPAL → DERIVADO → OPERATIVO |
| `projects-filters.tsx` | `src/modules/projects/components/` | Filtros + `applyProjectFilters` |
| `projects-table.tsx` | `src/modules/projects/components/` | Tabla vista general con paginación client-side |
| `project-kanban.tsx` | `src/modules/projects/components/` | Kanban drag-and-drop 6 columnas |
| `project-expediente.tsx` | `src/modules/projects/components/` | Expediente con 7 pestañas |
| `project-dashboard-view.tsx` | `src/modules/projects/components/` | Dashboard KPIs + gráficos recharts |
| `indicators-page-client.tsx` | `src/modules/projects/components/` | Indicadores globales con filtros |
| `project-alerts-page-client.tsx` | `src/modules/projects/components/` | Alertas por proyecto/severidad |
| `placeholder-page.tsx` | `src/components/ui/` | Página placeholder reutilizable |

### Librerías de módulo

| Archivo | Propósito |
|---------|-----------|
| `lifecycle.ts` | Config visual estados Kanban |
| `project-type.ts` | Etiquetas `project_type_enum` |
| `access.ts` | Control lectura/escritura por rol |

---

## Servicios y tipos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/types/project.ts` | Tipos V3: `ProjectDetail`, `ProjectKanbanCard`, árbol, financiero, alertas |
| `src/services/projects.service.ts` | `v_project_detail`, `v_project_kanban`, `v_project_dashboard`, `v_project_contract_tree`, followups, assignments, indicators |
| `src/services/project-financial.service.ts` | `v_project_financial`, `payments`, `budget_commitments` |
| `src/services/project-documents.service.ts` | `documents` con `project_id`, URLs SharePoint/SECOP |
| `src/services/projects.actions.ts` | Server action `updateProjectLifecycle` → UPDATE `projects` |
| `src/services/user.service.ts` | `user_profiles` + `getProjectAlerts` (`v_project_alerts` con fallback) |

---

## Páginas creadas

| Ruta | Estado | Descripción |
|------|--------|-------------|
| `/` | **Rediseñada** | Dashboard proyecto (`v_project_dashboard` + lista reciente) |
| `/proyectos` | **Nueva** | Vista general — tabla con filtros y paginación |
| `/proyectos/kanban` | **Nueva** | Kanban con DnD y persistencia |
| `/proyectos/calendario` | Placeholder | Fase 3 |
| `/proyectos/[id]` | **Nueva** | Expediente (pestañas: Resumen, Estructura, Financiero, Seguimiento, Documentos, Indicadores, Alertas) |
| `/contratacion/contratos` | Redirect | → `/contracts` (legacy durante transición) |
| `/contratacion/supervision` | Placeholder | Fase 3 |
| `/financiero/presupuesto` | **Básica** | Tabla `budget_commitments` por proyecto |
| `/financiero/pagos` | **Básica** | Tabla global `payments` |
| `/financiero/facturacion` | Placeholder | Fase 3 |
| `/documentos` | **Básica** | Documentos agrupados por tipo, enlaces externos |
| `/indicadores` | **Nueva** | `project_indicators` con filtros |
| `/alertas` | **Actualizada** | Alertas project-aware (`v_project_alerts` o fallback) |
| `/administracion/usuarios` | Placeholder | Fase 4 |
| `/administracion/configuracion` | Placeholder | Fase 4 |

---

## Páginas modificadas

| Ruta | Cambio |
|------|--------|
| `/` | De `DashboardPage` contract-centric a `ProjectDashboardView` |
| `/alertas` | De `AlertsPageClient` (contratos) a `ProjectAlertsPageClient` |
| `Sidebar.tsx` | Nuevo árbol de navegación V3 con secciones colapsables |

---

## Rutas legacy (mantenidas, no eliminadas)

| Ruta | Estado | Deprecación sugerida |
|------|--------|---------------------|
| `/contracts` | Activa | Redirigir a `/proyectos` en Fase 5 |
| `/contracts/[id]` | Activa | Enlazada desde árbol contractual del expediente |
| `/contratos-derivados` | Activa | Sustituida por pestaña Estructura en expediente |
| `/seguimiento` | Activa | Sustituida por `/proyectos/kanban` |

---

## Vistas y tablas Supabase consumidas

| Recurso | Uso |
|---------|-----|
| `v_project_detail` | Lista proyectos, expediente, filtros |
| `v_project_kanban` | Tarjetas Kanban |
| `v_project_dashboard` | KPIs dashboard `/` |
| `v_project_contract_tree` | Pestaña Estructura Contractual |
| `v_project_financial` | Pestaña Financiero (fallback: `v_project_detail`) |
| `v_project_alerts` | Alertas globales y por proyecto (fallback: `active_alerts_count`) |
| `projects` | UPDATE `lifecycle_status` (Kanban) |
| `project_followups` | Pestaña Seguimiento |
| `project_assignments` + `user_profiles` | Equipo del proyecto |
| `project_indicators` | Indicadores global y por proyecto |
| `payments` | Pagos por proyecto y módulo `/financiero/pagos` |
| `budget_commitments` | Módulo `/financiero/presupuesto` |
| `documents` | Metadatos SharePoint/SECOP (`file_name`, `sharepoint_url`, `secop_document_url`) |
| `user_profiles` | Rol actual para control de acceso frontend |

**Vistas legacy aún usadas:** `v_contract_detail`, `v_contract_tracking`, `v_dashboard_kpis` (solo por rutas `/contracts/*` no migradas).

---

## Control de acceso (frontend)

| Rol | Edición Kanban / acciones |
|-----|---------------------------|
| `ADMIN`, `GERENTE`, `GERENTE_PROYECTO` | Permitido |
| `DIRECTIVO`, `CONSULTOR_PROYECTO`, `ESPECTADOR` | Solo lectura |

Implementado en `access.ts` + `getCurrentUserProfile()`. **Pendiente:** filtrar proyectos visibles por asignación (`user_has_project`) en UI; hoy depende de RLS en Supabase.

---

## Pendientes

| # | Item | Fase |
|---|------|------|
| 1 | Exportación Excel/PDF real en `/proyectos` | 2 |
| 2 | Calendario de proyectos | 3 |
| 3 | Supervisión contractual | 3 |
| 4 | Facturación | 3 |
| 5 | Admin usuarios + asignaciones (`project-assignment-manager`) | 4 |
| 6 | Configuración sistema | 4 |
| 7 | Redirect permanente `/contracts` → `/proyectos` | 5 |
| 8 | Eliminar rutas/componentes legacy listados abajo | 5 |
| 9 | Conectar pestañas contract-detail (pagos/adiciones/prórrogas BD) | 2.5 |
| 10 | Badge dinámico de alertas en Sidebar | 3 |
| 11 | Validar columnas exactas de vistas V3 en Supabase (tipos inferidos del doc arquitectura) | — |
| 12 | Sidebar: mostrar nombre/rol real del usuario autenticado | 4 |

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Columnas de vistas V3 difieren del tipado TypeScript | Servicios usan `select("*")`; ajustar `project.ts` tras inspeccionar vista real en Supabase |
| `v_project_alerts` no desplegada | Fallback sintético desde `active_alerts_count` |
| `v_project_financial` ausente | Fallback a campos de `v_project_detail` |
| `project_indicators` / `project_followups` vacíos | UI muestra estados vacíos correctamente |
| `documents.name` vs `file_name` | Servicio mapea `file_name` → `name` en frontend |
| RLS puede ocultar filas sin error claro | Mensajes de error en páneas server; revisar grants (`EPUXUA_VIEWS_GRANTS.sql`) |
| Kanban UPDATE falla por rol | UI revierte estado local; mensaje solo lectura para DIRECTIVO/CONSULTOR |

---

## Legacy — deprecar (no eliminado)

### Páginas
- `src/app/(app)/contracts/page.tsx`
- `src/app/(app)/contracts/[id]/page.tsx`
- `src/app/(app)/contratos-derivados/page.tsx`
- `src/app/(app)/seguimiento/page.tsx`

### Componentes
- `src/components/dashboard/DashboardPage.tsx` (reemplazado por `ProjectDashboardView`)
- `src/modules/contracts/components/contracts-grid.tsx`
- `src/modules/contracts/components/contracts-page-header.tsx`
- `src/modules/alerts/components/alerts-page-client.tsx` (reemplazado)
- `src/modules/seguimiento/components/seguimiento-page-client.tsx`

### Servicios / queries
- `getDashboardMetrics()` → `v_dashboard_kpis` (usar `getProjectDashboardMetrics`)
- `getContracts()` como entrada principal del dashboard (usar `getProjects()`)
- `getContractTracking()` para seguimiento legacy

---

## Verificación

```bash
npm run build   # ✓ exit 0
npm run lint    # ejecutar en CI local
```

---

## Mapa de navegación objetivo (implementado)

```
Dashboard (/)
Proyectos
  ├ Vista General (/proyectos)
  ├ Kanban (/proyectos/kanban)
  └ Calendario (/proyectos/calendario) [placeholder]
Contratación
  ├ Contratos (/contratacion/contratos → /contracts)
  └ Supervisión [placeholder]
Financiero
  ├ Presupuesto
  ├ Pagos
  └ Facturación [placeholder]
Documentos · Indicadores · Alertas
Administración
  ├ Usuarios [placeholder]
  └ Configuración [placeholder]
```

Expediente: `/proyectos/[id]` — Resumen · Estructura · Financiero · Seguimiento · Documentos · Indicadores · Alertas.
