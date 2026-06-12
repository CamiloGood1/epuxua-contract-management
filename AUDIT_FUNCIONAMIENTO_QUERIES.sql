-- =============================================================================
-- EPUXUA — AUDITORÍA COMPLETA CONTRATOS FUNCIONAMIENTO
-- Fecha: 2026-06-09
-- Ejecutar en: Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Ejecutar UNA SECCIÓN A LA VEZ y copiar el resultado
-- =============================================================================


-- =============================================================================
-- SECCIÓN 1: INVENTARIO GENERAL EN BD
-- ¿Cuántos contratos hay y de qué tipo?
-- =============================================================================

SELECT
  contract_type,
  resource_type,
  COUNT(*) AS total,
  COUNT(CASE WHEN parent_contract_id IS NULL THEN 1 END) AS sin_padre,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) AS sin_proyecto,
  COUNT(CASE WHEN status = 'EN_EJECUCION' THEN 1 END) AS en_ejecucion
FROM contracts
GROUP BY contract_type, resource_type
ORDER BY contract_type, resource_type NULLS LAST;


-- =============================================================================
-- SECCIÓN 2: CONTRATOS DE FUNCIONAMIENTO EN BD (FUENTE B)
-- Definición: DIRECTO + sin parent + resource_type = 'FUNCIONAMIENTO'
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.contract_type,
  c.resource_type,
  c.status,
  c.initial_value,
  c.paid_value,
  c.project_id,
  CASE WHEN c.project_id IS NULL THEN 'HUÉRFANO ⚠️' ELSE 'vinculado' END AS estado_proyecto,
  s.full_name AS supervisor,
  ct.full_name AS contratista
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO'
ORDER BY c.year ASC, c.contract_number ASC;


-- =============================================================================
-- SECCIÓN 3: RESUMEN SECCIÓN 2 — TOTALES
-- =============================================================================

SELECT
  COUNT(*) AS total_bd,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) AS sin_project_id,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) AS con_project_id,
  COUNT(CASE WHEN status = 'EN_EJECUCION' THEN 1 END) AS en_ejecucion,
  COUNT(CASE WHEN status = 'TERMINADO' THEN 1 END) AS terminado,
  COUNT(CASE WHEN status = 'TERMINADO_ANTICIPADAMENTE' THEN 1 END) AS terminado_ant,
  COUNT(CASE WHEN status = 'CIERRE_CONTRACTUAL' THEN 1 END) AS cierre_contractual,
  COUNT(CASE WHEN status = 'LIQUIDADO' THEN 1 END) AS liquidado,
  COUNT(CASE WHEN status = 'SUSPENDIDO' THEN 1 END) AS suspendido,
  COUNT(CASE WHEN status = 'ACTA_NO_EJECUCION' THEN 1 END) AS acta_no_ejecucion,
  SUM(c.initial_value) AS valor_inicial_total
FROM contracts c
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO';


-- =============================================================================
-- SECCIÓN 4: RESUMEN POR AÑO — SECCIÓN 2
-- =============================================================================

SELECT
  c.year,
  COUNT(*) AS total,
  COUNT(CASE WHEN c.project_id IS NULL THEN 1 END) AS sin_project_id,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS activos,
  SUM(c.initial_value) AS valor_total
FROM contracts c
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO'
GROUP BY c.year
ORDER BY c.year;


-- =============================================================================
-- SECCIÓN 5: PROYECTOS CONTENEDOR FUNCIONAMIENTO (FUENTE C — paso 1)
-- =============================================================================

SELECT
  p.id,
  p.project_code,
  p.year,
  p.project_type,
  p.lifecycle_status,
  p.total_value,
  COUNT(c.id) AS contratos_vinculados,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS activos_vinculados
FROM projects p
LEFT JOIN contracts c ON c.project_id = p.id
WHERE p.project_type = 'FUNCIONAMIENTO'
GROUP BY p.id, p.project_code, p.year, p.project_type, p.lifecycle_status, p.total_value
ORDER BY p.year;


-- =============================================================================
-- SECCIÓN 6: CONTRATOS VISIBLES EN FRONTEND — getFuncionamientoContracts()
-- Contratos vinculados a proyectos FUNCIONAMIENTO via project_id
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.contract_type,
  c.resource_type,
  c.status,
  c.initial_value,
  p.project_code AS proyecto_contenedor,
  s.full_name AS supervisor,
  ct.full_name AS contratista
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
ORDER BY c.year ASC, c.contract_number ASC;


-- =============================================================================
-- SECCIÓN 7: CONTRATOS HUÉRFANOS — en BD como FUNCIONAMIENTO pero SIN project_id
-- ESTOS SON INVISIBLES EN EL MÓDULO FRONTEND
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.status,
  c.initial_value,
  c.resource_type,
  s.full_name AS supervisor,
  ct.full_name AS contratista
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.project_id IS NULL
ORDER BY c.year ASC, c.contract_number ASC;


-- =============================================================================
-- SECCIÓN 8: CONTRATOS VISIBLES EN FRONTEND PERO NO DEBERÍAN ESTARLO
-- Contratos en proyectos FUNCIONAMIENTO que NO son DIRECTO+FUNCIONAMIENTO
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.contract_type,
  c.resource_type,
  c.status,
  p.project_code AS proyecto_contenedor
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
WHERE NOT (c.contract_type = 'DIRECTO' AND c.resource_type = 'FUNCIONAMIENTO')
ORDER BY c.year, c.contract_number;


-- =============================================================================
-- SECCIÓN 9: CONTRATOS EN_EJECUCION DE FUNCIONAMIENTO — lo que alimenta el KPI
-- Comparativo: lo que BD tiene vs lo que ve el frontend
-- =============================================================================

-- 9A: Activos en BD (correctos)
SELECT
  'BD_DIRECTA' AS fuente,
  c.contract_number,
  c.year,
  c.status,
  c.initial_value,
  CASE WHEN c.project_id IS NULL THEN 'SIN_PROYECTO ⚠️' ELSE 'con_proyecto' END AS estado_proyecto,
  s.full_name AS supervisor
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.status = 'EN_EJECUCION'
ORDER BY c.year, c.contract_number;

-- 9B: Activos visibles en frontend (solo los que tienen project_id en proyecto FUNCIONAMIENTO)
SELECT
  'FRONTEND' AS fuente,
  c.contract_number,
  c.year,
  c.status,
  c.initial_value,
  p.project_code AS proyecto
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
WHERE c.status = 'EN_EJECUCION'
ORDER BY c.year, c.contract_number;


-- =============================================================================
-- SECCIÓN 10: CONTRATOS DIRECTO sin resource_type FUNCIONAMIENTO
-- Posibles contratos de funcionamiento mal clasificados
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.resource_type,
  c.status,
  c.initial_value,
  c.parent_contract_id,
  c.project_id
FROM contracts c
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND (c.resource_type IS NULL OR c.resource_type != 'FUNCIONAMIENTO')
ORDER BY c.resource_type NULLS FIRST, c.year, c.contract_number;


-- =============================================================================
-- SECCIÓN 11: CONTRATOS CON contract_type NULL o DESCONOCIDO
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.contract_type,
  c.resource_type,
  c.status,
  c.parent_contract_id IS NOT NULL AS tiene_padre,
  c.project_id IS NOT NULL AS tiene_proyecto
FROM contracts c
WHERE c.contract_type IS NULL
   OR c.contract_type NOT IN ('DIRECTO','INTERADMINISTRATIVO','DERIVADO','TIENDA_VIRTUAL','PAGO_FACTURA')
ORDER BY c.year, c.contract_number;


-- =============================================================================
-- SECCIÓN 12: CHECK ENUM — ¿Existe DERIVADO en el tipo?
-- =============================================================================

SELECT enumlabel AS valores_enum
FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'contract_type_enum'
ORDER BY enumsortorder;


-- =============================================================================
-- SECCIÓN 13: CONTRATOS DERIVADO — verificar que todos tienen parent
-- =============================================================================

SELECT
  COUNT(*) AS total_derivados,
  COUNT(CASE WHEN parent_contract_id IS NULL THEN 1 END) AS sin_padre_ANOMALIA,
  COUNT(CASE WHEN parent_contract_id IS NOT NULL THEN 1 END) AS con_padre_OK
FROM contracts
WHERE contract_type = 'DERIVADO';


-- =============================================================================
-- SECCIÓN 14: RESUMEN FINAL PARA EL INFORME
-- =============================================================================

SELECT
  'A_Excel_Funcionamiento' AS fuente,
  284 AS total,
  116 AS en_ejecucion,
  '2021-2026' AS rango_anos,
  'Fuente de verdad (CSV)' AS nota
UNION ALL
SELECT
  'B_BD_Funcionamiento' AS fuente,
  COUNT(*) AS total,
  COUNT(CASE WHEN status='EN_EJECUCION' THEN 1 END) AS en_ejecucion,
  MIN(year)::text || '-' || MAX(year)::text AS rango_anos,
  'Contratos DIRECTO+FUNCIONAMIENTO sin padre' AS nota
FROM contracts
WHERE contract_type='DIRECTO' AND parent_contract_id IS NULL AND resource_type='FUNCIONAMIENTO'
UNION ALL
SELECT
  'C_Frontend_Visible' AS fuente,
  COUNT(*) AS total,
  COUNT(CASE WHEN c.status='EN_EJECUCION' THEN 1 END) AS en_ejecucion,
  MIN(c.year)::text || '-' || MAX(c.year)::text AS rango_anos,
  'Contratos en project_id de proyectos FUNCIONAMIENTO' AS nota
FROM contracts c
JOIN projects p ON p.id=c.project_id AND p.project_type='FUNCIONAMIENTO'
UNION ALL
SELECT
  'DELTA_B_minus_C' AS fuente,
  (SELECT COUNT(*) FROM contracts WHERE contract_type='DIRECTO' AND parent_contract_id IS NULL AND resource_type='FUNCIONAMIENTO')
  - (SELECT COUNT(*) FROM contracts c JOIN projects p ON p.id=c.project_id AND p.project_type='FUNCIONAMIENTO') AS total,
  NULL AS en_ejecucion,
  NULL AS rango_anos,
  'Contratos invisibles en frontend = B - C' AS nota;
