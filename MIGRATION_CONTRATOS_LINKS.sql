-- ============================================================
-- MIGRATION_CONTRATOS_LINKS.sql
-- Añade columnas faltantes a la tabla contratos
-- Causa: columnas definidas en el frontend (TypeScript, servicios,
--        formularios) pero nunca creadas en la BD. PostgREST arroja
--        "Could not find the 'enlace_carpeta' column in the schema cache"
--        al intentar hacer UPDATE con estas columnas.
--
-- Ejecutar en: Supabase → SQL Editor
-- Es idempotente (ADD COLUMN IF NOT EXISTS)
-- ============================================================

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS enlace_carpeta           TEXT,
  ADD COLUMN IF NOT EXISTS link_ficha               TEXT,
  ADD COLUMN IF NOT EXISTS nit_identificacion        TEXT,
  ADD COLUMN IF NOT EXISTS numero_proceso_seleccion  TEXT,
  ADD COLUMN IF NOT EXISTS numero_poliza             TEXT,
  ADD COLUMN IF NOT EXISTS fecha_aprobacion_poliza   DATE;

-- ── Verificación ──────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'contratos'
  AND column_name IN (
    'enlace_carpeta',
    'link_ficha',
    'nit_identificacion',
    'numero_proceso_seleccion',
    'numero_poliza',
    'fecha_aprobacion_poliza'
  )
ORDER BY column_name;
