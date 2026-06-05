-- PASO 1 de 2 — Ejecutar primero (solo esta sentencia).
-- Espera mensaje de éxito antes de correr EPUXUA_CONTRACT_HIERARCHY_2_UPDATE.sql

ALTER TYPE contract_type_enum ADD VALUE IF NOT EXISTS 'DERIVADO';
