-- ============================================================
-- MIGRATION_CONTRACT_ADICIONES_EXT.sql
-- Añade columnas de presupuesto y detalle a contract_adiciones
-- Causa: el formulario de adiciones (derivado-modificaciones-tab,
--        contract-modificaciones.actions.ts) inserta campos CDP/RP,
--        valor bienes/servicios y observaciones que no están en
--        MIGRATION_DERIVADOS_V2.sql (CREATE TABLE base).
--
-- Ejecutar en: Supabase → SQL Editor
-- Requiere: MIGRATION_DERIVADOS_V2.sql (tabla contract_adiciones)
-- Es idempotente (ADD COLUMN IF NOT EXISTS)
-- ============================================================

ALTER TABLE contract_adiciones
  ADD COLUMN IF NOT EXISTS valor_bienes_servicios  NUMERIC(20,2),
  ADD COLUMN IF NOT EXISTS valor_cuota_gerencia    NUMERIC(20,2),
  ADD COLUMN IF NOT EXISTS numero_cdp              TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cdp               DATE,
  ADD COLUMN IF NOT EXISTS numero_rp               TEXT,
  ADD COLUMN IF NOT EXISTS fecha_rp                DATE,
  ADD COLUMN IF NOT EXISTS observaciones           TEXT;

-- ── Verificación ──────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'contract_adiciones'
  AND column_name IN (
    'valor_bienes_servicios',
    'valor_cuota_gerencia',
    'numero_cdp',
    'fecha_cdp',
    'numero_rp',
    'fecha_rp',
    'observaciones'
  )
ORDER BY column_name;
