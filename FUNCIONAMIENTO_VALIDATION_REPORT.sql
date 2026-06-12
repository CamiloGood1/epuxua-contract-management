-- =============================================================================
-- TAREA 6 — VALIDACIÓN FINAL: EXCEL vs SUPABASE vs FRONTEND CORREGIDO
-- Fecha: 2026-06-09
-- Objetivo: Confirmar que la corrección alineó los tres orígenes de datos
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- ── TABLA MAESTRA DE VALIDACIÓN ──────────────────────────────────────────────
-- Ejecutar todo de una vez para obtener el cuadro comparativo completo

WITH
  excel AS (
    -- Fuente de verdad: datos extraídos del CSV (284 contratos, 116 activos)
    SELECT 284 AS total, 116 AS en_ejecucion, 'A_Excel (CSV fuente verdad)' AS fuente
  ),
  bd_nueva_logica AS (
    -- NUEVA lógica: contract_type=DIRECTO + resource_type=FUNCIONAMIENTO + sin padre
    SELECT
      COUNT(*) AS total,
      COUNT(CASE WHEN status = 'EN_EJECUCION' THEN 1 END) AS en_ejecucion,
      'B_BD Nueva Lógica (corregida)' AS fuente
    FROM contracts
    WHERE contract_type = 'DIRECTO'
      AND resource_type = 'FUNCIONAMIENTO'
      AND parent_contract_id IS NULL
  ),
  bd_logica_anterior AS (
    -- ANTIGUA lógica: project_type=FUNCIONAMIENTO (incluía contratos incorrectos)
    SELECT
      COUNT(*) AS total,
      COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS en_ejecucion,
      'C_BD Lógica Anterior (errónea)' AS fuente
    FROM contracts c
    JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
  )
SELECT fuente, total, en_ejecucion
FROM excel
UNION ALL
SELECT fuente, total, en_ejecucion FROM bd_nueva_logica
UNION ALL
SELECT fuente, total, en_ejecucion FROM bd_logica_anterior
ORDER BY fuente;


-- ── CONTRATOS ACTIVOS: NUEVA LÓGICA ─────────────────────────────────────────
-- Los 120 contratos EN_EJECUCION que debe mostrar el módulo ahora

SELECT
  c.contract_number,
  c.year,
  c.status,
  c.resource_type,
  ROUND(c.initial_value::numeric) AS valor_inicial,
  s.full_name AS supervisor
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL
  AND c.status = 'EN_EJECUCION'
ORDER BY c.year DESC, c.contract_number;


-- ── CONTRATOS ACTIVOS: COMPARATIVO BD vs EXCEL ───────────────────────────────
-- Los 4 contratos EN_EJECUCION en BD pero NO en el Excel (status diferente en Excel)
-- Nota: BD=120, Excel=116. Diferencia de 4 contratos activos.

SELECT
  c.contract_number,
  c.year,
  c.status AS status_en_bd,
  'Ver Excel: posiblemente TERMINADO o LIQUIDADO' AS nota,
  s.full_name AS supervisor
FROM contracts c
LEFT JOIN supervisors s ON s.id = c.supervisor_id
WHERE c.contract_type = 'DIRECTO'
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL
  AND c.status = 'EN_EJECUCION'
  AND c.contract_number NOT IN (
    -- Los 116 contratos activos confirmados en el Excel (2021-2026)
    -- (lista completa en AUDIT_FASE2_QUERIES.sql — Query 3)
    -- Copiar aquí la lista de 116 números del Excel para la comparación exacta
    '025-2024','029-2024','045-2024',
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
    '001-2026','002-2026','003-2026','004-2026','005-2026',
    '006-2026','011-2026','028-2026','029-2026','032-2026',
    '033-2026','037-2026','040-2026','043-2026','046-2026',
    '049-2026','053-2026','054-2026','055-2026','056-2026',
    '058-2026','059-2026','060-2026','061-2026','063-2026',
    '065-2026','066-2026','068-2026','069-2026','071-2026',
    '072-2026','073-2026','074-2026','079-2026','080-2026',
    '081-2026'
  )
ORDER BY c.year DESC, c.contract_number;


-- ── VERIFICACIÓN FINAL: ¿Cuántos contratos incorrectos quedan visibles? ───────
-- Debe retornar 0 después de la corrección del backend

SELECT
  COUNT(*) AS contratos_incorrectos_visibles,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ CORRECCIÓN EXITOSA — Módulo limpio'
    ELSE '✗ AÚN HAY CONTRATOS INCORRECTOS — Revisar lógica'
  END AS resultado
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
WHERE NOT (
  c.contract_type = 'DIRECTO'
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL
);


-- ── IMPACTO KPI: Antes vs Después ────────────────────────────────────────────

SELECT
  'ANTES (lógica errónea)' AS escenario,
  COUNT(*) AS total_modulo,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS kpi_activos,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) - 116 AS inflacion_vs_excel
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
UNION ALL
SELECT
  'DESPUÉS (lógica corregida)' AS escenario,
  COUNT(*) AS total_modulo,
  COUNT(CASE WHEN status = 'EN_EJECUCION' THEN 1 END) AS kpi_activos,
  COUNT(CASE WHEN status = 'EN_EJECUCION' THEN 1 END) - 116 AS inflacion_vs_excel
FROM contracts
WHERE contract_type = 'DIRECTO'
  AND resource_type = 'FUNCIONAMIENTO'
  AND parent_contract_id IS NULL;
