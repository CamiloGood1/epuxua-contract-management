-- =============================================================================
-- EPUXUA — AUDITORÍA FASE 2: Identificar los 27 contratos incorrectos
-- y las 4 diferencias de status
-- Ejecutar en Supabase SQL Editor — una sección a la vez
-- =============================================================================


-- =============================================================================
-- QUERY 1: Los 27 contratos INCORRECTOS en el módulo Funcionamiento
-- (en proyectos FUNCIONAMIENTO pero NO son DIRECTO+FUNCIONAMIENTO)
-- Esperado: 27 filas — esto es lo que contamina el módulo y los KPIs
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.contract_type,
  c.resource_type,
  c.status,
  c.initial_value,
  c.parent_contract_id IS NOT NULL AS tiene_padre,
  p.project_code AS proyecto_contenedor,
  s.full_name AS supervisor,
  ct.full_name AS contratista
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
WHERE NOT (
  c.contract_type = 'DIRECTO'
  AND (c.resource_type = 'FUNCIONAMIENTO' OR c.resource_type IS NULL)
  AND c.parent_contract_id IS NULL
)
ORDER BY c.contract_type, c.resource_type, c.year, c.contract_number;


-- =============================================================================
-- QUERY 2: Resumen de los 27 — agrupado por tipo y resource_type
-- Para saber de dónde vienen
-- =============================================================================

SELECT
  c.contract_type,
  c.resource_type,
  COUNT(*) AS total,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS activos,
  p.project_code AS proyecto_ejemplo
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
WHERE NOT (
  c.contract_type = 'DIRECTO'
  AND (c.resource_type = 'FUNCIONAMIENTO' OR c.resource_type IS NULL)
  AND c.parent_contract_id IS NULL
)
GROUP BY c.contract_type, c.resource_type, p.project_code
ORDER BY total DESC;


-- =============================================================================
-- QUERY 3: Los 4 contratos con status diferente entre Excel y BD
-- (Excel dice 116 EN_EJECUCION, BD tiene 120)
-- Buscamos contratos FUNCIONAMIENTO en BD con EN_EJECUCION
-- que NO están en los 116 activos del Excel
-- Lista de los 116 del Excel para comparar:
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.status,
  c.initial_value,
  s.full_name AS supervisor
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.status = 'EN_EJECUCION'
  AND c.contract_number NOT IN (
    -- Los 116 activos del Excel (2024)
    '025-2024','029-2024','045-2024',
    -- Los 77 activos del Excel (2025)
    '001-2025','002-2025','003-2025','004-2025','005-2025',
    '008-2025','009-2025','011-2025','012-2025','017-2025',
    '021-2025','022-2025','026-2025','029-2025','030-2025',
    '032-2025','035-2025','037-2025','040-2025','043-2025',
    '046-2025','051-2025','052-2025','054-2025','055-2025',
    '057-2025','058-2025','062-2025','064-2025','065-2025',
    '072-2025','081-2025','082-2025','084-2025','085-2025',
    '086-2025','102-2025','105-2025','108-2025','110-2025',
    '111-2025','112-2025','116-2025','117-2025','118-2025',
    '119-2025','122-2025','139-2025','140-2025','141-2025',
    '142-2025','143-2025','144-2025','145-2025','147-2025',
    '148-2025','149-2025','152-2025','153-2025','157-2025',
    '159-2025','160-2025','161-2025','163-2025','165-2025',
    '173-2025','178-2025','182-2025','183-2025','184-2025',
    '185-2025','186-2025','190-2025','191-2025','195-2025',
    '200-2025','207-2025',
    -- Los 36 activos del Excel (2026)
    '001-2026','002-2026','003-2026','004-2026','005-2026',
    '006-2026','011-2026','028-2026','029-2026','032-2026',
    '033-2026','037-2026','040-2026','043-2026','046-2026',
    '049-2026','053-2026','054-2026','055-2026','056-2026',
    '058-2026','059-2026','060-2026','061-2026','063-2026',
    '065-2026','066-2026','068-2026','069-2026','071-2026',
    '072-2026','073-2026','074-2026','079-2026','080-2026',
    '081-2026'
  )
ORDER BY c.year, c.contract_number;


-- =============================================================================
-- QUERY 4: El 1 contrato extra en BD vs Excel
-- (BD tiene 285, Excel tiene 284 — encontrar el extra)
-- =============================================================================

SELECT
  c.contract_number,
  c.year,
  c.status,
  c.initial_value,
  c.contract_class,
  s.full_name AS supervisor,
  ct.full_name AS contratista,
  c.created_at
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.parent_contract_id IS NULL
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.contract_number NOT IN (
    -- Lista completa de 284 contratos del Excel
    '001-2021','002-2021','003-2021','010-2021','OC-003-2021',
    '001-2022','002-2022','007-2022','008-2022','010-2022','011-2022','013-2022',
    '021-2022','022-2022','030-2022','034-2022','035-2022','037-2022','039-2022',
    '042-2022','044-2022','046-2022','049-2022','052-2022','055-2022','056-2022',
    '057-2022','059-2022','061-2022',
    '001-2023','002-2023','003-2023','004-2023','005-2023','006-2023','007-2023',
    '008-2023','009-2023','010-2023','013-2023','014-2023','015-2023','016-2023',
    '017-2023','018-2023','019-2023','020-2023','021-2023','022-2023','023-2023',
    '026-2023','029-2023','030-2023','031-2023','032-2023','034-2023','035-2023',
    '036-2023','037-2023','042-2023','043-2023','045-2023','046-2023','047-2023',
    '048-2023','049-2023','050-2023','052-2023','054-2023','068-2023','069-2023',
    '070-2023','071-2023','072-2023','073-2023','074-2023','075-2023','076-2023',
    '077-2023','078-2023','079-2023','080-2023','082-2023','083-2023','084-2023',
    '085-2023','086-2023',
    '001-2024','002-2024','003-2024','004-2024','005-2024','006-2024','007-2024',
    '008-2024','009-2024','010-2024','011-2024','012-2024','013-2024','014-2024',
    '015-2024','016-2024','017-2024','018-2024','019-2024','020-2024','021-2024',
    '022-2024','023-2024','024-2024','025-2024','026-2024','027-2024','028-2024',
    '029-2024','030-2024','031-2024','032-2024','033-2024','034-2024','035-2024',
    '036-2024','037-2024','038-2024','039-2024','040-2024','042-2024','044-2024',
    '045-2024','067-2024','068-2024','069-2024','070-2024','071-2024','072-2024',
    '073-2024','074-2024','075-2024','076-2024','077-2024','078-2024','079-2024',
    '080-2024','081-2024','084-2024','086-2024','089-2024','090-2024','091-2024',
    '093-2024','094-2024','096-2024','106-2024','107-2024','113-2024','114-2024',
    '115-2024','116-2024','118-2024','119-2024','129-2024','132-2024','145-2024',
    '001-2025','002-2025','003-2025','004-2025','005-2025','008-2025','009-2025',
    '011-2025','012-2025','017-2025','021-2025','022-2025','026-2025','028-2025',
    '029-2025','030-2025','032-2025','035-2025','037-2025','038-2025','040-2025',
    '043-2025','046-2025','051-2025','052-2025','054-2025','055-2025','057-2025',
    '058-2025','062-2025','064-2025','065-2025','072-2025','081-2025','082-2025',
    '083-2025','084-2025','085-2025','086-2025','102-2025','105-2025','108-2025',
    '109-2025','110-2025','111-2025','112-2025','113-2025','116-2025','117-2025',
    '118-2025','119-2025','122-2025','139-2025','140-2025','141-2025','142-2025',
    '143-2025','144-2025','145-2025','147-2025','148-2025','149-2025','152-2025',
    '153-2025','157-2025','158-2025','159-2025','160-2025','161-2025','163-2025',
    '165-2025','170-2025','173-2025','178-2025','182-2025','183-2025','184-2025',
    '185-2025','186-2025','190-2025','191-2025','195-2025','200-2025','207-2025',
    '001-2026','002-2026','003-2026','004-2026','005-2026','006-2026','011-2026',
    '028-2026','029-2026','032-2026','033-2026','037-2026','040-2026','043-2026',
    '046-2026','049-2026','053-2026','054-2026','055-2026','056-2026','058-2026',
    '059-2026','060-2026','061-2026','063-2026','065-2026','066-2026','068-2026',
    '069-2026','071-2026','072-2026','073-2026','074-2026','079-2026','080-2026',
    '081-2026'
  )
ORDER BY c.created_at DESC;


-- =============================================================================
-- QUERY 5: Contratos huérfanos — en BD como FUNCIONAMIENTO pero SIN project_id
-- (Esperado: 0 — si hay alguno, es otro problema)
-- =============================================================================

SELECT
  COUNT(*) AS total_huerfanos,
  COUNT(CASE WHEN status = 'EN_EJECUCION' THEN 1 END) AS activos_huerfanos
FROM contracts
WHERE contract_type = 'DIRECTO'
  AND parent_contract_id IS NULL
  AND resource_type = 'FUNCIONAMIENTO'
  AND project_id IS NULL;


-- =============================================================================
-- QUERY 6: Validación final — tabla de 4 estados
-- Ejecutar al final para confirmar el diagnóstico completo
-- =============================================================================

WITH
  bd_func AS (
    SELECT id, contract_number, year, status, initial_value, project_id
    FROM contracts
    WHERE contract_type = 'DIRECTO'
      AND parent_contract_id IS NULL
      AND resource_type = 'FUNCIONAMIENTO'
  ),
  frontend_func AS (
    SELECT c.id, c.contract_number, c.year, c.status, c.contract_type, c.resource_type
    FROM contracts c
    JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
  ),
  incorrectos AS (
    SELECT c.id
    FROM contracts c
    JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
    WHERE NOT (
      c.contract_type = 'DIRECTO'
      AND (c.resource_type = 'FUNCIONAMIENTO' OR c.resource_type IS NULL)
      AND c.parent_contract_id IS NULL
    )
  )
SELECT
  (SELECT COUNT(*) FROM bd_func) AS B_total_en_bd,
  (SELECT COUNT(*) FROM bd_func WHERE status = 'EN_EJECUCION') AS B_activos_en_bd,
  (SELECT COUNT(*) FROM bd_func WHERE project_id IS NULL) AS B_sin_project_id,
  (SELECT COUNT(*) FROM frontend_func) AS C_total_frontend,
  (SELECT COUNT(*) FROM frontend_func WHERE status = 'EN_EJECUCION') AS C_activos_frontend,
  (SELECT COUNT(*) FROM incorrectos) AS incorrectos_en_modulo,
  (SELECT COUNT(*) FROM frontend_func WHERE status = 'EN_EJECUCION') - (SELECT COUNT(*) FROM bd_func WHERE status = 'EN_EJECUCION') AS kpi_inflacion_activos;
