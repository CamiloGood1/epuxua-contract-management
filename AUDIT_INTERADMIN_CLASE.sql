-- =============================================================================
-- EPUXUA — AUDITORÍA UNIVERSO OFICIAL INTERADMINISTRATIVOS
-- Fecha: 2026-06-09
-- Regla oficial: Solo "CONTRATO INTERADMINISTRATIVO" (excluir COMODATO y otros)
-- PROBLEMA CRÍTICO: contract_class = 'Contrato Interadministrativo' en TODOS
--   los registros importados. El COMODATO se perdió durante la migración.
--   Identificación temporal vía texto del objeto (object ILIKE '%omodato%').
-- NO MODIFICA datos. Solo consultas de lectura.
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO 0 — Confirmar que contract_class no distingue COMODATO en BD
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  contract_class,
  COUNT(*) AS cantidad
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO'
GROUP BY contract_class
ORDER BY cantidad DESC;
-- Esperado: 1 sola fila 'Contrato Interadministrativo' (65 registros)
-- Esto confirma que el campo NO distingue COMODATO vs Contrato Interadministrativo.


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 1 — Los 9 COMODATO identificados (por objeto)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Identificación temporal vía ILIKE '%omodato%' hasta que contract_class sea corregido.

SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status                                              AS estado_contrato,
  p.lifecycle_status                                    AS ciclo_vida_proyecto,
  c.contract_class                                      AS clase_en_bd,
  'COMODATO'                                            AS clase_real_excel,
  LEFT(c.object, 100)                                   AS objeto_resumido,
  c.initial_value + c.total_additions_value             AS valor_final
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
LEFT JOIN v_interadmin_projects p         ON p.primary_contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.object ILIKE '%omodato%'
ORDER BY c.year, c.contract_number;

-- Conteo por estado
SELECT
  status,
  COUNT(*) AS cantidad
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO'
  AND object ILIKE '%omodato%'
GROUP BY status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 2 — Los 56 CONTRATO INTERADMINISTRATIVO puros (sin COMODATO)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status                                              AS estado_contrato,
  p.lifecycle_status                                    AS ciclo_vida_proyecto,
  c.initial_value + c.total_additions_value             AS valor_final,
  c.end_date,
  CASE
    WHEN c.status = 'EN_EJECUCION'
     AND p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
      THEN '✓ CORRECTO — cuenta en KPI'
    WHEN c.status != 'EN_EJECUCION'
     AND p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
      THEN '⚠ PHANTOM — lifecycle activo pero contrato ' || c.status::text
    ELSE '— No cuenta en KPI actual'
  END AS clasificacion_kpi
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
LEFT JOIN v_interadmin_projects p         ON p.primary_contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.object NOT ILIKE '%omodato%'
ORDER BY c.year DESC, c.contract_number;

-- Resumen por estado
SELECT
  status,
  COUNT(*) AS cantidad
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO'
  AND object NOT ILIKE '%omodato%'
GROUP BY status
ORDER BY cantidad DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 3 — Descomposición de los 54 active_projects actuales
-- ═══════════════════════════════════════════════════════════════════════════════
-- Muestra exactamente cuántos pertenecen a cada clase real

SELECT
  CASE
    WHEN c.object ILIKE '%omodato%' THEN 'COMODATO'
    ELSE 'CONTRATO INTERADMINISTRATIVO'
  END                                                   AS clase_real,
  c.status                                              AS estado_contrato,
  COUNT(*)                                              AS cantidad,
  string_agg(c.contract_number, ', ' ORDER BY c.contract_number) AS contratos
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
GROUP BY clase_real, c.status
ORDER BY clase_real, cantidad DESC;

-- Resumen por clase
SELECT
  CASE
    WHEN c.object ILIKE '%omodato%' THEN 'COMODATO'
    ELSE 'CONTRATO INTERADMINISTRATIVO'
  END                                                   AS clase_real,
  COUNT(*)                                              AS active_projects_actual,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS con_contrato_activo,
  COUNT(CASE WHEN c.status != 'EN_EJECUCION' THEN 1 END) AS phantom_lifecycle
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
GROUP BY clase_real
ORDER BY clase_real;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 4 — Lista detallada de los 21 registros que inflan el KPI
-- ═══════════════════════════════════════════════════════════════════════════════
-- Los 21 = 9 COMODATO + 12 phantom CONTRATO INTERADMINISTRATIVO
-- (12 = 13 TERMINADO - 1 offset por el contrato faltante en Excel)

SELECT
  c.contract_number                                     AS numero_contrato,
  c.year                                                AS año,
  icd.secretaria                                        AS entidad,
  CASE
    WHEN c.object ILIKE '%omodato%' THEN 'COMODATO'
    ELSE 'CONTRATO INTERADMINISTRATIVO'
  END                                                   AS clase_real,
  c.status                                              AS estado_contrato,
  p.lifecycle_status                                    AS lifecycle_proyecto,
  CASE
    WHEN c.object ILIKE '%omodato%' AND c.status = 'EN_EJECUCION'
      THEN 'EXCLUIR — Es COMODATO, no Contrato Interadministrativo'
    WHEN c.object ILIKE '%omodato%' AND c.status != 'EN_EJECUCION'
      THEN 'EXCLUIR — Es COMODATO + lifecycle desactualizado'
    WHEN c.object NOT ILIKE '%omodato%' AND c.status IN ('TERMINADO','TERMINADO_ANTICIPADAMENTE')
      THEN 'EXCLUIR — Contrato terminado, lifecycle_status no actualizado a LIQUIDACION'
    ELSE 'VERIFICAR'
  END                                                   AS motivo_exclusion
FROM v_interadmin_projects p
JOIN contracts c   ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  AND (
    c.object ILIKE '%omodato%'                          -- Son COMODATO
    OR c.status IN ('TERMINADO','TERMINADO_ANTICIPADAMENTE')  -- Phantom lifecycle
  )
ORDER BY
  CASE WHEN c.object ILIKE '%omodato%' THEN 1 ELSE 2 END,
  c.status,
  c.year DESC;

-- Conteo de los infladores
SELECT
  CASE
    WHEN c.object ILIKE '%omodato%' AND c.status = 'EN_EJECUCION'
      THEN 'COMODATO en ejecución'
    WHEN c.object ILIKE '%omodato%' AND c.status != 'EN_EJECUCION'
      THEN 'COMODATO con lifecycle desactualizado'
    WHEN c.object NOT ILIKE '%omodato%' AND c.status IN ('TERMINADO','TERMINADO_ANTICIPADAMENTE')
      THEN 'CONTRATO INTERADMIN con lifecycle desactualizado'
    ELSE 'Otro'
  END                                                   AS tipo_inflador,
  COUNT(*)                                              AS cantidad
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  AND (c.object ILIKE '%omodato%' OR c.status IN ('TERMINADO','TERMINADO_ANTICIPADAMENTE'))
GROUP BY tipo_inflador
ORDER BY cantidad DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 5 — KPIs recalculados con el universo oficial (CONTRATO INTERADMIN puro)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Universo correcto:
--   contract_type = 'INTERADMINISTRATIVO'
--   AND object NOT ILIKE '%omodato%'       (mientras contract_class no sea corregido)

SELECT
  -- Proyectos
  COUNT(*)                                                          AS total_projects,
  COUNT(CASE WHEN p.lifecycle_status IN
    ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
    AND c.status = 'EN_EJECUCION'                        THEN 1 END) AS active_projects_corregido,
  COUNT(CASE WHEN p.lifecycle_status = 'CERRADO'         THEN 1 END) AS closed_projects,

  -- Valores financieros (solo sobre el universo oficial)
  COALESCE(SUM(c.initial_value + c.total_additions_value), 0)        AS total_value,
  COALESCE(SUM(icd.mandate_pool_initial + icd.mandate_pool_additions), 0) AS executed_value,
  COALESCE(SUM(c.paid_value), 0)                                     AS paid_value,

  -- Contratos derivados del universo oficial
  COALESCE((
    SELECT COUNT(*)
    FROM contracts d
    JOIN contracts parent ON d.parent_contract_id = parent.id
    WHERE d.contract_type = 'DERIVADO'
      AND parent.contract_type = 'INTERADMINISTRATIVO'
      AND parent.object NOT ILIKE '%omodato%'
  ), 0)                                                              AS total_derived_contracts,

  -- Proyectos con alertas
  COUNT(CASE WHEN p.active_alerts_count > 0               THEN 1 END) AS projects_with_alerts
FROM v_interadmin_projects p
JOIN contracts c   ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.object NOT ILIKE '%omodato%';  -- ← FILTRO OFICIAL

-- Comparativa antes/después
SELECT
  'ANTES (v_dashboard_interadmin actual)'                AS version,
  total_projects, active_projects, closed_projects,
  total_value, executed_value, paid_value,
  total_derived_contracts, projects_with_alerts
FROM v_dashboard_interadmin

UNION ALL

SELECT
  'DESPUÉS (universo oficial sin COMODATO)'              AS version,
  COUNT(*)                                               AS total_projects,
  COUNT(CASE WHEN p.lifecycle_status IN
    ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
    AND c.status = 'EN_EJECUCION'                        THEN 1 END) AS active_projects,
  COUNT(CASE WHEN p.lifecycle_status = 'CERRADO'         THEN 1 END) AS closed_projects,
  COALESCE(SUM(c.initial_value + c.total_additions_value), 0)        AS total_value,
  COALESCE(SUM(icd.mandate_pool_initial + icd.mandate_pool_additions), 0) AS executed_value,
  COALESCE(SUM(c.paid_value), 0)                                     AS paid_value,
  0::bigint                                              AS total_derived_contracts,
  COUNT(CASE WHEN p.active_alerts_count > 0             THEN 1 END) AS projects_with_alerts
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.object NOT ILIKE '%omodato%';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 6 — Lógica propuesta para v_dashboard_interadmin (REVISIÓN OFICIAL)
-- ═══════════════════════════════════════════════════════════════════════════════
-- CONDICIÓN PREVIA OBLIGATORIA ANTES DE IMPLEMENTAR:
--   Actualizar contract_class = 'Comodato' en los 9 contratos COMODATO.
--   Sin ese UPDATE, la vista debe usar object ILIKE '%omodato%' como workaround temporal.
--
-- LÓGICA PROPUESTA (post-corrección de contract_class):
--
-- CREATE OR REPLACE VIEW v_dashboard_interadmin
-- WITH (security_invoker = true)
-- AS
-- SELECT
--   COUNT(*)
--     AS total_projects,
--   COUNT(CASE WHEN
--       p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
--       AND c.status = 'EN_EJECUCION'          -- contrato efectivamente activo
--       AND c.contract_class != 'Comodato'     -- excluir comodatos
--     THEN 1 END)
--     AS active_projects,
--   COUNT(CASE WHEN p.lifecycle_status = 'CERRADO' THEN 1 END)
--     AS closed_projects,
--   COALESCE(SUM(
--     CASE WHEN c.contract_class != 'Comodato'
--     THEN c.initial_value + c.total_additions_value ELSE 0 END
--   ), 0)                                        AS total_value,
--   COALESCE(SUM(
--     CASE WHEN c.contract_class != 'Comodato'
--     THEN icd.mandate_pool_initial + icd.mandate_pool_additions ELSE 0 END
--   ), 0)                                        AS executed_value,
--   COALESCE(SUM(
--     CASE WHEN c.contract_class != 'Comodato' THEN c.paid_value ELSE 0 END
--   ), 0)                                        AS paid_value,
--   ... (derivados y alertas igual que antes)
-- FROM v_interadmin_projects p
-- JOIN contracts c ON c.id = p.primary_contract_id
-- LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id;
--
-- active_projects ESPERADO POST-CORRECCIÓN: 33 (alineado con Excel)
-- (32 BD + 1 contrato CIERRE_CONTRACTUAL que debe ser revisado)

-- Validación de la lógica propuesta (con workaround temporal por object):
SELECT
  COUNT(CASE WHEN
      p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
      AND c.status = 'EN_EJECUCION'
      AND c.object NOT ILIKE '%omodato%'
    THEN 1 END)                                AS active_projects_propuesto,
  -- Comparar vs Excel: debe dar 32 (BD) o 33 cuando se resuelva el contrato faltante
  33                                           AS excel_truth,
  COUNT(CASE WHEN
      p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
      AND c.status = 'EN_EJECUCION'
      AND c.object NOT ILIKE '%omodato%'
    THEN 1 END) - 33                           AS diferencia_vs_excel
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id;
