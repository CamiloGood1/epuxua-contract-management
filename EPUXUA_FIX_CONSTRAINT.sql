-- ============================================================
-- EPUXUA — Fix: constraint incorrecto en contractors
-- Ejecutar en Supabase SQL Editor ANTES de volver a importar
-- ============================================================
-- Problema: UNIQUE NULLS NOT DISTINCT (document_number, document_type)
-- hace que todos los contratistas sin CC/NIT (385 registros)
-- colisionen entre sí → solo el primero queda, los demás se pierden
-- → FK violation en contracts.
--
-- Fix: reemplazar por índice parcial (solo único cuando hay documento).
-- ============================================================

BEGIN;

-- 1. Limpiar todo lo importado hasta ahora (para reimportar limpio)
DELETE FROM payments;
DELETE FROM mipymes_stats;
DELETE FROM contract_policies;
DELETE FROM contract_extensions;
DELETE FROM contract_amendments;
DELETE FROM budget_commitments;
DELETE FROM invoice_payment_details;
DELETE FROM interadmin_contract_details;
DELETE FROM contracts;
DELETE FROM contractors;
DELETE FROM supervisors;

-- 2. Eliminar el constraint incorrecto
ALTER TABLE contractors
  DROP CONSTRAINT IF EXISTS uq_contractors_document;

-- 3. Crear índice parcial correcto:
--    único SOLO cuando document_number existe (no NULL).
--    Contratistas sin documento no compiten entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contractors_document
  ON contractors (document_number, document_type)
  WHERE document_number IS NOT NULL;

-- 4. UNIQUE en contracts: (número, año, tipo) — no solo (número, año)
--    El esquema antiguo (uq_contract_number_year) impide 140-2024 DIRECTO + INTERADMIN.
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS uq_contract_number_year;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contract_number_year_key;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS uq_contract_number_year_type;
DROP INDEX IF EXISTS uq_contract_number_year_type;

CREATE UNIQUE INDEX uq_contract_number_year_type
  ON contracts (contract_number, year, contract_type);

COMMIT;

-- Verificar que quedó limpio
SELECT
  (SELECT COUNT(*) FROM contractors) AS contractors,
  (SELECT COUNT(*) FROM contracts)   AS contracts,
  (SELECT COUNT(*) FROM payments)    AS payments;
