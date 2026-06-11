-- ============================================================
-- EPUXUA: Migración formulario Interadministrativo v2
-- Fecha: 2026-06-10
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. NUEVOS ESTADOS
-- El campo `estado` en la tabla `interadministrativos` es un
-- ENUM de PostgreSQL. Agregar los 4 estados faltantes.
-- Si el tipo ENUM tiene un nombre distinto, buscar con:
--   SELECT typname FROM pg_type WHERE typname ILIKE '%estado%';
-- ─────────────────────────────────────────────────────────────

ALTER TYPE estado_interadministrativo ADD VALUE IF NOT EXISTS 'PLANEACIÓN';
ALTER TYPE estado_interadministrativo ADD VALUE IF NOT EXISTS 'CONTRATACIÓN';
ALTER TYPE estado_interadministrativo ADD VALUE IF NOT EXISTS 'SUSPENDIDO';
ALTER TYPE estado_interadministrativo ADD VALUE IF NOT EXISTS 'TERMINADO ANTICIPADAMENTE';

-- ─────────────────────────────────────────────────────────────
-- ALTERNATIVA: Si el campo es TEXT (no ENUM), ignorar lo de
-- arriba y usar este CHECK en su lugar:
-- ALTER TABLE interadministrativos
--   DROP CONSTRAINT IF EXISTS check_estado_interadmin;
-- ALTER TABLE interadministrativos
--   ADD CONSTRAINT check_estado_interadmin CHECK (
--     estado IN (
--       'PLANEACIÓN','CONTRATACIÓN','EN EJECUCIÓN',
--       'SUSPENDIDO','TERMINADO','LIQUIDADO',
--       'TERMINADO ANTICIPADAMENTE'
--     )
--   );
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 2. NUEVAS COLUMNAS EN interadministrativos
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadministrativos
  ADD COLUMN IF NOT EXISTS categoria          TEXT,
  ADD COLUMN IF NOT EXISTS pct_cuota_gerencia NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS link_secop         TEXT,
  ADD COLUMN IF NOT EXISTS link_documentacion TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA DE AUDITORÍA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_audit_log (
  id            BIGSERIAL     PRIMARY KEY,
  interadmin_id BIGINT        REFERENCES interadministrativos(id) ON DELETE SET NULL,
  id_contrato   TEXT          NOT NULL,
  action        TEXT          NOT NULL,   -- CREATE | UPDATE | DELETE
  field_name    TEXT,                     -- NULL para CREATE
  old_value     TEXT,
  new_value     TEXT,
  user_id       UUID,
  user_email    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_interadmin_id
  ON interadmin_audit_log(interadmin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_id_contrato
  ON interadmin_audit_log(id_contrato);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON interadmin_audit_log(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS en la tabla de auditoría
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadmin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_read_staff" ON interadmin_audit_log;
CREATE POLICY "audit_log_read_staff" ON interadmin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('ADMIN', 'GERENTE', 'GERENTE_PROYECTO')
    )
  );

DROP POLICY IF EXISTS "audit_log_insert_auth" ON interadmin_audit_log;
CREATE POLICY "audit_log_insert_auth" ON interadmin_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- 5. VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────────────────────

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'interadministrativos'
  AND column_name IN ('categoria','pct_cuota_gerencia','link_secop','link_documentacion','estado')
ORDER BY column_name;

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'interadmin_audit_log'
) AS audit_table_exists;
