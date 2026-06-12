-- =============================================================================
-- EPUXUA — FASE 2A: Vistas SQL Definitivas
-- Fecha: 2026-06-09
-- Ejecutar en Supabase SQL Editor — TODO el archivo de una sola vez
-- Las 4 vistas encapsulan la lógica de negocio en la BD.
-- El frontend deja de tener lógica de clasificación distribuida en TypeScript.
-- =============================================================================

-- ── 1. v_funcionamiento_contracts ─────────────────────────────────────────────
-- Definición oficial de Funcionamiento encapsulada en SQL.
-- Fuente: contracts (filtro) + v_contract_detail (campos calculados).
-- El frontend hace SELECT * FROM v_funcionamiento_contracts sin WHERE de negocio.

CREATE OR REPLACE VIEW v_funcionamiento_contracts
WITH (security_invoker = true)
AS
SELECT
  vcd.*,
  c.project_id
FROM contracts c
JOIN v_contract_detail vcd ON vcd.id = c.id
WHERE
  c.contract_type    = 'DIRECTO'
  AND c.resource_type    = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL;

COMMENT ON VIEW v_funcionamiento_contracts IS
  'Contratos de Funcionamiento según definición oficial Fase 1:
   contract_type=DIRECTO AND resource_type=FUNCIONAMIENTO AND parent_contract_id IS NULL.
   No depende de projects.project_type. No incluye contratos de Inversión,
   Transferencias, Sistemas u otros tipos históricos erróneos.';


-- ── 2. v_dashboard_funcionamiento ─────────────────────────────────────────────
-- KPIs pre-computados para la sección Funcionamiento del Dashboard.
-- Siempre retorna exactamente 1 fila.

CREATE OR REPLACE VIEW v_dashboard_funcionamiento
WITH (security_invoker = true)
AS
SELECT
  -- Totales
  COUNT(*)                                                                  AS total_contracts,
  COUNT(CASE WHEN status = 'EN_EJECUCION'             THEN 1 END)          AS active_contracts,
  COUNT(CASE WHEN status = 'SUSPENDIDO'               THEN 1 END)          AS suspended_contracts,
  COUNT(CASE WHEN status IN (
    'TERMINADO','TERMINADO_ANTICIPADAMENTE',
    'CIERRE_CONTRACTUAL','ACTA_NO_EJECUCION','NO_SUSCRIPCION'
  )                                                   THEN 1 END)          AS finished_contracts,
  COUNT(CASE WHEN status IN ('LIQUIDADO','DECLARADO_FALLIDO')
                                                      THEN 1 END)          AS liquidated_contracts,
  -- Valores
  COALESCE(SUM(final_value),  0)                                           AS total_value,
  COALESCE(SUM(paid_value),   0)                                           AS total_paid_value,
  CASE
    WHEN COUNT(*) > 0 THEN ROUND((COALESCE(SUM(final_value), 0) / COUNT(*))::numeric, 0)
    ELSE 0
  END                                                                       AS avg_value,
  -- Alertas de vencimiento (solo activos)
  COUNT(CASE WHEN status = 'EN_EJECUCION'
               AND days_remaining IS NOT NULL
               AND days_remaining BETWEEN 1 AND 30    THEN 1 END)          AS soon_expiring,
  COUNT(CASE WHEN status = 'EN_EJECUCION'
               AND days_remaining IS NOT NULL
               AND days_remaining <= 0                THEN 1 END)          AS expired
FROM v_funcionamiento_contracts;

COMMENT ON VIEW v_dashboard_funcionamiento IS
  'KPIs agregados de la sección Funcionamiento. Siempre 1 fila.
   Construido sobre v_funcionamiento_contracts (definición oficial).';


-- ── 3. v_interadmin_projects ──────────────────────────────────────────────────
-- Proyectos Interadministrativos. Excluye FUNCIONAMIENTO, OPERACION_COMERCIAL,
-- TIENDA_VIRTUAL, PAGO_FACTURA y cualquier contenedor interno (DIRECTO-XXXX).
-- El frontend hace SELECT * FROM v_interadmin_projects sin filtros de tipo.

CREATE OR REPLACE VIEW v_interadmin_projects
WITH (security_invoker = true)
AS
SELECT *
FROM v_project_detail
WHERE project_type = 'INTERADMINISTRATIVO';

COMMENT ON VIEW v_interadmin_projects IS
  'Proyectos Interadministrativos del catálogo visible al usuario.
   Excluye todos los demás tipos: FUNCIONAMIENTO, OPERACION_COMERCIAL,
   TIENDA_VIRTUAL, PAGO_FACTURA. Los contenedores DIRECTO-XXXX y
   FUNCIONAMIENTO-XXXX NO aparecen aquí.';


-- ── 4. v_dashboard_interadmin ─────────────────────────────────────────────────
-- KPIs pre-computados para la sección Interadministrativos del Dashboard.
-- Siempre retorna exactamente 1 fila.

CREATE OR REPLACE VIEW v_dashboard_interadmin
WITH (security_invoker = true)
AS
SELECT
  COUNT(*)                                                                         AS total_projects,
  COUNT(CASE WHEN lifecycle_status IN (
    'PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO'
  )                                                              THEN 1 END)       AS active_projects,
  COUNT(CASE WHEN lifecycle_status = 'CERRADO'                  THEN 1 END)       AS closed_projects,
  COALESCE(SUM(total_value),    0)                                                 AS total_value,
  COALESCE(SUM(executed_value), 0)                                                 AS executed_value,
  COALESCE(SUM(paid_value),     0)                                                 AS paid_value,
  COALESCE(SUM(derived_count),  0)::bigint                                         AS total_derived_contracts,
  COUNT(CASE WHEN active_alerts_count > 0                       THEN 1 END)       AS projects_with_alerts
FROM v_interadmin_projects;

COMMENT ON VIEW v_dashboard_interadmin IS
  'KPIs agregados de la sección Interadministrativos. Siempre 1 fila.
   Construido sobre v_interadmin_projects.';


-- =============================================================================
-- VALIDACIÓN: Ejecutar después de crear las vistas para confirmar que
-- retornan datos correctos
-- =============================================================================

-- Verificar v_funcionamiento_contracts
SELECT
  COUNT(*) AS total,
  COUNT(CASE WHEN status='EN_EJECUCION' THEN 1 END) AS activos
FROM v_funcionamiento_contracts;
-- Esperado: total≈285, activos≈120

-- Verificar v_dashboard_funcionamiento
SELECT * FROM v_dashboard_funcionamiento;
-- Esperado: 1 fila, total_contracts≈285, active_contracts≈120

-- Verificar v_interadmin_projects
SELECT COUNT(*) AS total_interadmin FROM v_interadmin_projects;
-- Esperado: solo proyectos INTERADMINISTRATIVO

-- Verificar v_dashboard_interadmin
SELECT * FROM v_dashboard_interadmin;
-- Esperado: 1 fila con KPIs de proyectos interadministrativos
