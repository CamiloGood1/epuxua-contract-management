-- =============================================================================
-- EPUXUA — AUDITORÍA DISCREPANCIA KPI INTERADMINISTRATIVOS
-- Fecha: 2026-06-09
-- Problema: Excel muestra 41 "En Ejecución" / BD reporta 54 active_projects
-- NO MODIFICAR datos. Solo consultas de lectura.
-- Ejecutar en Supabase SQL Editor — cada bloque por separado o todo de una vez.
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 0 — SQL EXACTO DE v_dashboard_interadmin (fuente del KPI)
-- ═══════════════════════════════════════════════════════════════════════════════
-- active_projects se calcula así:

/*
  SELECT
    COUNT(CASE WHEN lifecycle_status IN (
      'PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO'
    ) THEN 1 END) AS active_projects
  FROM v_interadmin_projects;

  Mide: PROYECTOS cuyo lifecycle_status es cualquiera de 4 fases.
  NO mide: contratos con status = 'EN_EJECUCION'.

  El Excel mide: CONTRATOS interadministrativos con columna Estado = "En Ejecución".
  → Unidades distintas. Eso explica la diferencia base.
*/

-- Comprobación de la definición actual
SELECT * FROM v_dashboard_interadmin;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 1 — Los 54 proyectos que v_dashboard_interadmin cuenta como "activos"
-- ═══════════════════════════════════════════════════════════════════════════════
-- Definición de "activo" en la BD:
-- lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')

SELECT
  p.id                 AS project_id,
  p.project_code       AS numero_contrato_interadmin,
  p.name               AS nombre_proyecto,
  icd.secretaria       AS entidad_secretaria,
  p.lifecycle_status   AS ciclo_vida_proyecto,
  c.status             AS estado_contrato_bd,
  p.year               AS año,
  p.project_type
FROM v_interadmin_projects p
LEFT JOIN contracts c     ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
ORDER BY
  p.lifecycle_status,
  p.year DESC,
  p.project_code;

-- Conteo por lifecycle_status
SELECT
  lifecycle_status,
  COUNT(*) AS total
FROM v_interadmin_projects
WHERE lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
GROUP BY lifecycle_status
ORDER BY lifecycle_status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 2 — Los 41 contratos del Excel con estado "En Ejecución"
-- ═══════════════════════════════════════════════════════════════════════════════
-- Equivalente BD: contract_type = 'INTERADMINISTRATIVO' AND status = 'EN_EJECUCION'
-- Nota: la hoja Excel "Contratos Interadministrativos" muestra contratos, no proyectos.

SELECT
  c.id                  AS contract_id,
  c.contract_number     AS numero_contrato,
  icd.secretaria        AS entidad,
  c.status              AS estado_contrato,
  c.year                AS año,
  c.contract_type,
  c.initial_value + c.total_additions_value AS valor_final,
  c.end_date            AS fecha_fin,
  (c.end_date - CURRENT_DATE)::integer      AS dias_restantes
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status = 'EN_EJECUCION'
ORDER BY c.year DESC, c.contract_number;

-- Conteo total
SELECT COUNT(*) AS contratos_en_ejecucion_excel_equivalente
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO'
  AND status = 'EN_EJECUCION';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 3 — Comparativo: en ambos, solo BD, solo Excel
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3A. INTERADMINISTRATIVOS con lifecycle "activo" Y contract status = EN_EJECUCION
--     (aparecen en AMBOS universos)
SELECT
  p.project_code       AS numero_contrato,
  icd.secretaria       AS entidad,
  p.lifecycle_status   AS ciclo_vida,
  c.status             AS estado_contrato,
  p.year
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  AND c.status = 'EN_EJECUCION'
ORDER BY p.year DESC, p.project_code;

SELECT COUNT(*) AS en_ambos_universos
FROM v_interadmin_projects p
JOIN contracts c ON c.id = p.primary_contract_id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  AND c.status = 'EN_EJECUCION';


-- 3B. SOLO EN BD (activos por lifecycle pero NO EN_EJECUCION en el contrato)
--     Estos son los 13 registros adicionales que NO aparecerían en el Excel con filtro EN_EJECUCION
SELECT
  p.project_code       AS numero_contrato,
  icd.secretaria       AS entidad,
  p.lifecycle_status   AS ciclo_vida_proyecto,
  c.status             AS estado_contrato_real,
  p.year,
  CASE
    WHEN c.id IS NULL          THEN 'SIN CONTRATO PRINCIPAL'
    WHEN c.status = 'SUSPENDIDO'               THEN 'Contrato suspendido pero proyecto activo'
    WHEN c.status IN ('TERMINADO','TERMINADO_ANTICIPADAMENTE') THEN 'Contrato terminado pero proyecto en lifecycle activo'
    WHEN c.status = 'LIQUIDADO'                THEN 'Contrato liquidado pero lifecycle no es CERRADO'
    WHEN c.status = 'CIERRE_CONTRACTUAL'       THEN 'En cierre pero lifecycle no es CERRADO'
    ELSE 'Otro estado: ' || c.status
  END AS razon_discrepancia
FROM v_interadmin_projects p
LEFT JOIN contracts c ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  AND (c.id IS NULL OR c.status != 'EN_EJECUCION')
ORDER BY p.lifecycle_status, p.year DESC, p.project_code;

SELECT COUNT(*) AS solo_en_bd_no_en_excel
FROM v_interadmin_projects p
LEFT JOIN contracts c ON c.id = p.primary_contract_id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  AND (c.id IS NULL OR c.status != 'EN_EJECUCION');


-- 3C. SOLO EN EXCEL (contract EN_EJECUCION pero proyecto en lifecycle NO activo)
--     Contratos EN_EJECUCION cuyo proyecto padre tiene lifecycle CERRADO o LIQUIDACION
SELECT
  c.contract_number    AS numero_contrato,
  icd.secretaria       AS entidad,
  c.status             AS estado_contrato,
  p.lifecycle_status   AS ciclo_vida_proyecto,
  c.year
FROM contracts c
LEFT JOIN v_interadmin_projects p ON p.primary_contract_id = c.id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status = 'EN_EJECUCION'
  AND (
    p.id IS NULL
    OR p.lifecycle_status NOT IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  )
ORDER BY c.year DESC, c.contract_number;

SELECT COUNT(*) AS solo_en_excel_no_en_bd
FROM contracts c
LEFT JOIN v_interadmin_projects p ON p.primary_contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status = 'EN_EJECUCION'
  AND (
    p.id IS NULL
    OR p.lifecycle_status NOT IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 4 — Todos los estados de contrato de proyectos en lifecycle "activo"
--           (muestra por qué hay 13 que no tienen status EN_EJECUCION)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  p.lifecycle_status           AS ciclo_vida_proyecto,
  COALESCE(c.status::text, 'SIN_CONTRATO_PRINCIPAL') AS estado_contrato,
  COUNT(*) AS cantidad,
  string_agg(p.project_code, ', ' ORDER BY p.project_code) AS contratos
FROM v_interadmin_projects p
LEFT JOIN contracts c ON c.id = p.primary_contract_id
WHERE p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
GROUP BY p.lifecycle_status, c.status
ORDER BY p.lifecycle_status, cantidad DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 5 — Tabla resumen completa de TODOS los INTERADMINISTRATIVOS
--           con ambas métricas: lifecycle_status (BD) y contract.status (Excel)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  p.project_code       AS numero_contrato,
  icd.secretaria       AS entidad,
  p.lifecycle_status   AS ciclo_vida_bd,
  c.status             AS estado_contrato_bd,
  p.year               AS año,
  CASE
    WHEN p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
      THEN 'SÍ cuenta en BD active_projects'
    ELSE 'NO cuenta en BD active_projects'
  END AS en_kpi_bd,
  CASE
    WHEN c.status = 'EN_EJECUCION'
      THEN 'SÍ en Excel (En Ejecución)'
    ELSE 'NO en Excel filtro En Ejecución'
  END AS en_excel_filtro,
  CASE
    WHEN p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
     AND c.status = 'EN_EJECUCION'    THEN '✓ AMBOS'
    WHEN p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
     AND c.status != 'EN_EJECUCION'   THEN '⚠ SOLO BD'
    WHEN p.lifecycle_status NOT IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
     AND c.status = 'EN_EJECUCION'    THEN '⚠ SOLO EXCEL'
    ELSE '— ninguno'
  END AS clasificacion
FROM v_interadmin_projects p
LEFT JOIN contracts c ON c.id = p.primary_contract_id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
ORDER BY clasificacion, p.year DESC, p.project_code;

-- Resumen de clasificación
SELECT
  CASE
    WHEN p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
     AND c.status = 'EN_EJECUCION'    THEN '✓ AMBOS'
    WHEN p.lifecycle_status IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
     AND (c.id IS NULL OR c.status != 'EN_EJECUCION') THEN '⚠ SOLO BD (extra en KPI)'
    WHEN (p.lifecycle_status NOT IN ('PLANEACION','CONTRATACION','EJECUCION','SEGUIMIENTO')
      OR p.id IS NULL)
     AND c.status = 'EN_EJECUCION'    THEN '⚠ SOLO EXCEL (faltante en KPI)'
    ELSE '— ninguno'
  END AS clasificacion,
  COUNT(*) AS cantidad
FROM v_interadmin_projects p
LEFT JOIN contracts c ON c.id = p.primary_contract_id
GROUP BY clasificacion
ORDER BY cantidad DESC;
