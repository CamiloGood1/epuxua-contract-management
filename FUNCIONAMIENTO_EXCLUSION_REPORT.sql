-- =============================================================================
-- TAREA 7 — REPORTE CONTRATOS EXCLUIDOS DEL MÓDULO FUNCIONAMIENTO
-- Fecha: 2026-06-09
-- Contratos que estaban en la lógica anterior (project_type=FUNCIONAMIENTO)
-- pero NO cumplen la definición oficial:
--   contract_type = 'DIRECTO' AND resource_type = 'FUNCIONAMIENTO' AND parent_contract_id IS NULL
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- Sección 1: Listado completo de contratos excluidos agrupados por tipo de recurso
SELECT
  c.contract_number,
  c.year,
  c.resource_type,
  c.contract_type,
  c.status,
  ROUND(c.initial_value::numeric) AS valor_inicial,
  ROUND(c.paid_value::numeric) AS valor_pagado,
  p.project_code AS proyecto_contenedor,
  s.full_name AS supervisor,
  ct.full_name AS contratista,
  c.object
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
LEFT JOIN supervisors s ON s.id = c.supervisor_id
LEFT JOIN contractors ct ON ct.id = c.contractor_id
WHERE NOT (
  c.contract_type = 'DIRECTO'
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL
)
ORDER BY
  CASE c.resource_type
    WHEN 'INVERSIÓN' THEN 1
    WHEN 'TRASNFERENCIAS MUNICIPALES' THEN 2
    WHEN 'TRANSFERENCIAS MUNICIPALES' THEN 2
    WHEN 'SISTEMAS' THEN 3
    WHEN 'ALMACEN' THEN 4
    WHEN 'ELEMENTOS FERRETERIA' THEN 5
    WHEN 'GALERIA' THEN 6
    WHEN 'SERVICIO DE VIGILANCIA' THEN 7
    WHEN 'BIENESTAR' THEN 8
    ELSE 9
  END,
  c.year,
  c.contract_number;


-- Sección 2: Resumen por tipo de recurso
SELECT
  COALESCE(c.resource_type, 'SIN CLASIFICAR') AS tipo_recurso,
  COUNT(*) AS total_contratos,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS activos,
  COUNT(CASE WHEN c.status IN ('TERMINADO','TERMINADO_ANTICIPADAMENTE','CIERRE_CONTRACTUAL','ACTA_NO_EJECUCION','NO_SUSCRIPCION') THEN 1 END) AS finalizados,
  COUNT(CASE WHEN c.status IN ('LIQUIDADO','DECLARADO_FALLIDO') THEN 1 END) AS liquidados,
  ROUND(SUM(c.initial_value)::numeric / 1000000, 2) AS valor_total_millones
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
WHERE NOT (
  c.contract_type = 'DIRECTO'
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL
)
GROUP BY c.resource_type
ORDER BY total_contratos DESC;


-- Sección 3: ¿Dónde deberían vivir estos contratos?
-- Análisis de reclasificación sugerida para Fase 2
SELECT
  COALESCE(c.resource_type, 'SIN CLASIFICAR') AS tipo_recurso_actual,
  CASE
    WHEN c.resource_type = 'INVERSIÓN' THEN 'INVERSION — módulo propio o sección en dashboard'
    WHEN c.resource_type ILIKE '%TRANSFERENCIAS%' THEN 'TRANSFERENCIAS_MUNICIPALES — módulo propio'
    WHEN c.resource_type = 'SISTEMAS' THEN 'OTROS — módulo operación o funcionamiento'
    WHEN c.resource_type = 'ALMACEN' THEN 'OTROS — módulo operación o funcionamiento'
    WHEN c.resource_type = 'ELEMENTOS FERRETERIA' THEN 'OTROS — módulo operación'
    WHEN c.resource_type = 'GALERIA' THEN 'OTROS — módulo operación'
    WHEN c.resource_type = 'SERVICIO DE VIGILANCIA' THEN 'OTROS — módulo operación'
    WHEN c.resource_type = 'BIENESTAR' THEN 'FUNCIONAMIENTO o BIENESTAR — revisar'
    WHEN c.resource_type LIKE 'SGO-%' THEN 'OPERACION_COMERCIAL — revisar manualmente'
    ELSE 'PENDIENTE CLASIFICACIÓN'
  END AS destino_sugerido_fase2,
  COUNT(*) AS total,
  COUNT(CASE WHEN c.status = 'EN_EJECUCION' THEN 1 END) AS activos
FROM contracts c
JOIN projects p ON p.id = c.project_id AND p.project_type = 'FUNCIONAMIENTO'
WHERE NOT (
  c.contract_type = 'DIRECTO'
  AND c.resource_type = 'FUNCIONAMIENTO'
  AND c.parent_contract_id IS NULL
)
GROUP BY c.resource_type
ORDER BY activos DESC, total DESC;
