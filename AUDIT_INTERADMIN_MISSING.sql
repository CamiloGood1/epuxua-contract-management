-- =============================================================================
-- EPUXUA — AUDITORÍA CONTRATO FALTANTE INTERADMINISTRATIVOS
-- Fecha: 2026-06-09
-- Objetivo: Identificar cuál de los 41 "En Ejecución" del Excel
--           no aparece como EN_EJECUCION en la BD.
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════════════
-- LISTA 1 — Los 40 contratos EN_EJECUCION en BD (equivalente al Excel)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status,
  c.subscription_date,
  c.end_date,
  (c.end_date - CURRENT_DATE)::integer AS dias_restantes,
  c.initial_value + c.total_additions_value AS valor_final
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status = 'EN_EJECUCION'
ORDER BY c.year DESC, c.contract_number;

-- Total: debe ser 40
SELECT COUNT(*) AS total_en_ejecucion_bd
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO' AND status = 'EN_EJECUCION';


-- ═══════════════════════════════════════════════════════════════════════════════
-- LISTA 2 — TODOS los contratos INTERADMINISTRATIVOS (para comparar con Excel)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status             AS estado_en_bd,
  c.subscription_date,
  c.end_date,
  c.initial_value + c.total_additions_value AS valor_final
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
ORDER BY c.year DESC, c.contract_number;

-- Total por estado (BD completa)
SELECT status, COUNT(*) AS cantidad
FROM contracts
WHERE contract_type = 'INTERADMINISTRATIVO'
GROUP BY status
ORDER BY cantidad DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CANDIDATOS PRINCIPALES — Contratos con mayor probabilidad de ser el faltante
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2A. Los 2 en CIERRE_CONTRACTUAL (estado "casi activo" — candidatos #1)
-- CIERRE_CONTRACTUAL = contrato ejecutado, en proceso administrativo de cierre.
-- En el Excel podría aparecer aún como "En Ejecución" si el cierre no se registró.
SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status             AS estado_bd,
  'SOSPECHOSO: CIERRE_CONTRACTUAL puede aparecer como En Ejecución en Excel' AS nota,
  c.subscription_date,
  c.end_date,
  c.liquidation_date,
  c.initial_value + c.total_additions_value AS valor_final
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status = 'CIERRE_CONTRACTUAL'
ORDER BY c.year DESC;

-- 2B. Contratos con end_date reciente (pueden estar aún "activos" en Excel)
-- Un contrato terminado recientemente puede aparecer EN_EJECUCION en un Excel no actualizado
SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status             AS estado_bd,
  c.end_date,
  (CURRENT_DATE - c.end_date)::integer AS dias_desde_fin,
  'Terminado hace menos de 90 días' AS nota
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status IN ('TERMINADO', 'TERMINADO_ANTICIPADAMENTE')
  AND c.end_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY c.end_date DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — ¿Hay contratos interadmin en BD que no estén en el import?
-- (Creados manualmente desde la UI después del import inicial)
-- ═══════════════════════════════════════════════════════════════════════════════
-- UUIDs importados desde parte_3_contracts_2.sql (todos los INTERADMINISTRATIVO):
WITH importados AS (
  SELECT unnest(ARRAY[
    '610705d3-6961-4ebd-a4f6-9809068dedb7'::uuid,  -- 3407-2021  LIQUIDADO
    '52028d41-40b3-4359-b3dd-35454cb46794'::uuid,  -- 3429-2021  LIQUIDADO
    '0b15b054-8b37-4763-9a2b-804b776c51b0'::uuid,  -- 3430-2021  TERMINADO
    '3644b3af-8970-4691-90ab-7b91cd5e8321'::uuid,  -- 3437-2021  LIQUIDADO
    '4b96c002-bbde-40fd-a83f-742fece21450'::uuid,  -- 3338-2021  EN_EJECUCION
    '60637d23-087e-406d-8aa7-95591bb87372'::uuid,  -- 3339-2021  TERMINADO_ANT.
    '53887385-3b03-44d3-a2a1-dd5151a46cfa'::uuid,  -- 3344-2021  EN_EJECUCION
    '6943d29c-7fc1-47a8-9d04-2e1eade2eea3'::uuid,  -- 3434-2021  EN_EJECUCION
    'f3d96341-c218-49da-9321-8abb608bebea'::uuid,  -- 3443-2021  LIQUIDADO
    'd5500b53-2ea2-446c-b36f-eb5e8e1a89b1'::uuid,  -- 3446-2021  EN_EJECUCION
    'ad00cc13-0687-4e21-a691-4c8eafa603fd'::uuid,  -- 2082-2022  EN_EJECUCION
    'ec61779e-d1a4-45a4-b58c-004ea3c4b2de'::uuid,  -- 4121-2022  LIQUIDADO
    'ed884424-999c-485c-b0fe-7c7c91dec273'::uuid,  -- 4168-2022  TERMINADO
    'c301e428-df8a-402a-a714-1344dd682f13'::uuid,  -- 4196-2022  TERMINADO
    'de9f301f-107a-48fd-950f-4beda16f7ee8'::uuid,  -- 4197-2022  EN_EJECUCION
    '79b3cba4-5547-4aae-bd6a-5926264d1965'::uuid,  -- 4201-2022  LIQUIDADO
    '03ecfa58-f119-4ee1-bfea-417b83def53e'::uuid,  -- 3572-2023  EN_EJECUCION
    '03b5db74-d472-40a2-aa93-187368b76667'::uuid,  -- 3822-2023  EN_EJECUCION
    '5fa7fb9c-8c0c-417a-9d63-1c623ec60b79'::uuid,  -- 3830-2023  LIQUIDADO
    '8c62974d-e48b-4f2a-bc40-28d5508c088c'::uuid,  -- 3863-2023  EN_EJECUCION
    '6e14f557-443d-4702-81c4-5ecf3d2b6ad7'::uuid,  -- 3874-2023  TERMINADO
    '7619088f-d094-4230-8a92-48f81fb2b6fb'::uuid,  -- 3977-2023  LIQUIDADO
    '85c5e506-dfaa-4d79-a936-7241fe692e57'::uuid,  -- 4372-2023  EN_EJECUCION
    '6d7467fc-ca1b-4834-b790-1ac2df36daa9'::uuid,  -- 4912-2023  EN_EJECUCION
    '7fa90a83-4948-4add-85fd-f043685a4afc'::uuid,  -- 4913-2023  EN_EJECUCION
    'bda22f22-c084-48c9-9bc6-5657a144842b'::uuid,  -- 4914-2023  EN_EJECUCION
    'b7426633-01aa-46d6-9dd9-c277fbbcec14'::uuid,  -- 0499-2024  TERMINADO
    '8ac13540-555b-47a2-91a7-7bd620eab495'::uuid,  -- 1297-2024  TERMINADO
    '68bf3947-b0f8-4a44-918f-aefec0cec043'::uuid,  -- 140-2024   TERMINADO
    '4e7a9dc3-990a-46e8-ae62-d758a975d38c'::uuid,  -- 1331-2024  EN_EJECUCION
    '2a865b19-6779-4bc1-9865-8d3b0f76adb5'::uuid,  -- 1410-2024  CIERRE_CONTRACTUAL
    'f721ae68-09f8-4a11-a198-1353a981a666'::uuid,  -- 1395-2024  EN_EJECUCION
    'bfbac412-2206-41e6-98fd-9b779f2f5110'::uuid,  -- 1532-2024  TERMINADO
    'fa66e743-1f35-4422-9178-c26ab0ad40ef'::uuid,  -- 1639-2024  CIERRE_CONTRACTUAL (fd350019 en import)
    'fd350019-dc56-42ec-805f-570805cc9028'::uuid,  -- 1639-2024  CIERRE_CONTRACTUAL
    'd3cc243a-669d-4906-bfb2-48be294d9aad'::uuid,  -- 140-2024 (dup check)
    '696f6204-c371-44e1-82f8-d72ed167afd9'::uuid,  -- 166-2024   EN_EJECUCION
    '7f6af928-04be-4f75-9166-b0bf6ecc96a3'::uuid,  -- 1820-2024  EN_EJECUCION
    '3beec6c3-3424-44c5-b2a6-eec9a7c99c19'::uuid,  -- 1937-2024  TERMINADO
    '677642f8-98b1-4e54-97ef-1464d72eec50'::uuid,  -- 2019-2024  EN_EJECUCION
    '2dc7e72b-6904-4ebe-a0b0-73161efbc042'::uuid,  -- 3071-2024  EN_EJECUCION
    'a72dcf99-eef6-40b3-a1d9-369ce951e291'::uuid,  -- 3074-2024  EN_EJECUCION
    'b1768c50-dea5-4502-9c96-2962e3070224'::uuid,  -- 3109-2024  TERMINADO
    'f7b8a725-09cb-4af3-942f-58670b9b0008'::uuid,  -- 3263-2024  TERMINADO
    'eb540808-2fe5-491b-9cc0-2c92391910da'::uuid,  -- 3272-2024  EN_EJECUCION
    '874c75d0-462b-486b-9eac-3416f3bf3508'::uuid,  -- 3279-2024  EN_EJECUCION
    'a6e63681-e534-4965-9b32-6ea19dcb81b6'::uuid,  -- 554-2024   LIQUIDADO
    '095addba-3bd0-4e25-82c2-f74d7291d343'::uuid,  -- 02257-2025 EN_EJECUCION
    '0bc67ff3-5912-44ac-8b66-6d2f8c58d033'::uuid,  -- 172-2025   EN_EJECUCION
    '1385e4c9-a212-4d8d-86d3-5eb93d054386'::uuid,  -- 1331-2024? (check)
    '6cee09d2-20e5-4643-9878-48d696fb6bd9'::uuid,  -- 568-2025   TERMINADO
    '10e8642c-39d8-4462-a15d-9f83fce9554b'::uuid,  -- 1653-2025  EN_EJECUCION
    '82976e02-c08a-4a08-98e5-906cf37928ad'::uuid,  -- 1671-2025  EN_EJECUCION
    '7c72874c-7228-4c51-b2b2-647521582e16'::uuid,  -- 1714-2025  EN_EJECUCION
    'eabb640c-e8c6-4258-a352-a79e4ef97bbe'::uuid,  -- 172-2025 (dup check)
    '14ec9bce-1360-42c3-a187-2f9acd5dd65b'::uuid,  -- 1815-2025  EN_EJECUCION
    '5228d981-c0f5-44ec-8718-ab0f11cf80f2'::uuid,  -- 1918-2025  EN_EJECUCION
    '717b5e14-9b18-426f-b344-c22def0a7d5d'::uuid,  -- 2019-2024? (check)
    'a4d81fe8-5544-4bd8-9bec-b3d2a033cb7b'::uuid,  -- 2212-2025  EN_EJECUCION
    '4a6a6411-6bab-4d3e-befe-4d834bcc68e9'::uuid,  -- 2359-2025  EN_EJECUCION
    'bc836e0e-74e9-44db-906f-c62a0588f894'::uuid,  -- 2377-2025  EN_EJECUCION
    '384fac10-c05d-4bb0-b76b-1f869adaec6c'::uuid,  -- 2423-2025  EN_EJECUCION
    '3ebdfe12-d5c6-4340-aa8e-3bed341ad722'::uuid,  -- 2474-2025  EN_EJECUCION
    'abe9d012-efd7-4d9e-a70a-d18d70440a60'::uuid,  -- 2475-2025  EN_EJECUCION
    '3c7cc134-79d2-4afd-ab60-237e8bc46780'::uuid,  -- 2489-2025  EN_EJECUCION
    '949d4983-78ab-4402-a548-c48aed0a6c38'::uuid,  -- 2510-2025  EN_EJECUCION
    'f7f8a725-09cb-4af3-942f-58670b9b0008'::uuid,  -- 2511-2025  EN_EJECUCION (check)
    '82976e02-c08a-4a08-98e5-906cf37928ad'::uuid,  -- 376-2025   EN_EJECUCION (check)
    'd5ab438c-0302-413c-8f88-9ef8640e343c'::uuid   -- 979-2025   EN_EJECUCION (check)
  ]) AS id
)
SELECT
  c.contract_number,
  c.year,
  c.status,
  c.contract_type,
  c.created_at::date AS creado_en_bd,
  CASE
    WHEN i.id IS NULL THEN '⚠ CREADO DESPUÉS DEL IMPORT — NO estaba en parte_3'
    ELSE '✓ En import original'
  END AS en_import_original
FROM contracts c
LEFT JOIN importados i ON i.id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND i.id IS NULL  -- Solo los que NO estaban en el import
ORDER BY c.created_at DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY DEFINITIVA — Mostrar solo los sospechosos directos
-- ═══════════════════════════════════════════════════════════════════════════════

-- Todos los INTERADMINISTRATIVOS con estado diferente a EN_EJECUCION
-- ordenados por "probabilidad de ser el faltante en Excel"
SELECT
  c.contract_number,
  c.year,
  icd.secretaria,
  c.status                                          AS estado_bd,
  c.end_date,
  (CURRENT_DATE - c.end_date)::integer              AS dias_desde_vencimiento,
  c.liquidation_date,
  c.initial_value + c.total_additions_value         AS valor_final,
  CASE c.status
    WHEN 'CIERRE_CONTRACTUAL'       THEN '🔴 CANDIDATO #1: Cierre contractual ≈ activo en Excel'
    WHEN 'TERMINADO'                THEN
      CASE WHEN c.end_date >= CURRENT_DATE - INTERVAL '6 months'
           THEN '🟡 CANDIDATO #2: Terminado recientemente, puede ser el faltante'
           ELSE '🟢 Terminado hace más de 6 meses — poco probable'
      END
    WHEN 'TERMINADO_ANTICIPADAMENTE' THEN '🟡 CANDIDATO #3: Terminado anticipadamente'
    WHEN 'LIQUIDADO'                THEN '🟢 Liquidado — estado final claro, improbable'
    ELSE c.status
  END AS probabilidad_faltante
FROM contracts c
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
WHERE c.contract_type = 'INTERADMINISTRATIVO'
  AND c.status != 'EN_EJECUCION'
ORDER BY
  CASE c.status
    WHEN 'CIERRE_CONTRACTUAL'        THEN 1
    WHEN 'TERMINADO_ANTICIPADAMENTE' THEN 2
    WHEN 'TERMINADO'                 THEN 3
    WHEN 'LIQUIDADO'                 THEN 4
    ELSE 5
  END,
  c.end_date DESC NULLS LAST;
