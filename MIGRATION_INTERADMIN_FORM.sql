-- ============================================================
-- EPUXUA: Migración formulario Interadministrativo v2
-- Fecha: 2026-06-10
-- El campo `estado` es TEXT — no hay ENUM que alterar.
-- Los nuevos valores (PLANEACIÓN, CONTRATACIÓN, etc.) se
-- insertan directamente como strings desde la aplicación.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. NUEVAS COLUMNAS EN interadministrativos
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadministrativos
  ADD COLUMN IF NOT EXISTS categoria          TEXT,
  ADD COLUMN IF NOT EXISTS pct_cuota_gerencia NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS link_secop         TEXT,
  ADD COLUMN IF NOT EXISTS link_documentacion TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA DE AUDITORÍA (opcional)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_audit_log (
  id            BIGSERIAL     PRIMARY KEY,
  interadmin_id BIGINT        REFERENCES interadministrativos(id) ON DELETE SET NULL,
  id_contrato   TEXT          NOT NULL,
  action        TEXT          NOT NULL,
  field_name    TEXT,
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
-- 3. RLS en la tabla de auditoría
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
-- 4. VERIFICACIÓN
-- ─────────────────────────────────────────────────────────────

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'interadministrativos'
  AND column_name IN ('categoria','pct_cuota_gerencia','link_secop','link_documentacion','estado')
ORDER BY column_name;
