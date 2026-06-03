-- ============================================================
-- EPUXUA — Fix: UNIQUE de contracts (2 columnas → 3 columnas)
-- Ejecutar en Supabase si parte 3 falla con:
--   duplicate key "uq_contract_number_year"
--   Key (contract_number, year)=(140-2024, 2024)
-- ============================================================
-- Causa: el esquema antiguo solo permite UN contrato por número+año.
-- El Excel tiene pares válidos con el mismo número y año pero distinto tipo:
--   140-2024 DIRECTO + 140-2024 INTERADMINISTRATIVO
--   172-2025 DIRECTO + 172-2025 INTERADMINISTRATIVO
--
-- No borra datos. Después de esto, re-ejecutar parte_3_contracts_2.sql
-- (si parte 3 falló dentro de un BEGIN, no insertó nada; si no, revisar conteos).
-- ============================================================

BEGIN;

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS uq_contract_number_year;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contract_number_year_key;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS uq_contract_number_year_type;

DROP INDEX IF EXISTS uq_contract_number_year_type;

CREATE UNIQUE INDEX uq_contract_number_year_type
  ON contracts (contract_number, year, contract_type);

COMMIT;

-- Comprobar que el índice nuevo existe
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'contracts'
  AND indexname = 'uq_contract_number_year_type';
