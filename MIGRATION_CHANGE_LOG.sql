-- ============================================================
-- EPUXUA: Historial de Cambios en Contratos Interadministrativos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_change_log (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  field_name              TEXT          NOT NULL,
  old_value               TEXT,
  new_value               TEXT,
  changed_by              TEXT,
  changed_by_id           UUID,
  changed_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccl_interadmin ON contract_change_log(interadministrativo_id);
CREATE INDEX IF NOT EXISTS idx_ccl_changed_at ON contract_change_log(changed_at DESC);

ALTER TABLE contract_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccl_read"   ON contract_change_log;
CREATE POLICY "ccl_read"   ON contract_change_log FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ccl_insert" ON contract_change_log;
CREATE POLICY "ccl_insert" ON contract_change_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Historial nunca se elimina (sin DELETE policy)

-- Verificación
SELECT COUNT(*) AS filas FROM contract_change_log;
