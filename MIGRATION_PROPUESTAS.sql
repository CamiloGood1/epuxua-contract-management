-- ============================================================
-- MIGRATION_PROPUESTAS.sql
-- Módulo de Propuestas Precontractuales — EPUXUA V2
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. Tabla principal ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposal_requests (
  id                        BIGSERIAL     PRIMARY KEY,

  -- Información básica
  reception_date            DATE          NOT NULL,
  client_name               TEXT          NOT NULL,
  proposal_object           TEXT          NOT NULL,
  proposal_delivery_deadline DATE         NOT NULL,
  proposal_type             TEXT          NOT NULL,
  status                    TEXT          NOT NULL DEFAULT 'RECIBIDA',

  -- Campos opcionales
  submission_date           DATE,
  request_link              TEXT,
  proposal_link             TEXT,
  observations              TEXT,

  -- Auditoría
  created_by                TEXT,
  created_by_id             UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by                TEXT,
  updated_by_id             UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 2. Tabla de auditoría (historial de cambios campo por campo) ──────────────

CREATE TABLE IF NOT EXISTS proposal_audit_log (
  id                BIGSERIAL    PRIMARY KEY,
  proposal_id       BIGINT       NOT NULL REFERENCES proposal_requests(id) ON DELETE CASCADE,
  action            TEXT         NOT NULL,  -- CREATE | UPDATE | DELETE
  field_name        TEXT,                   -- NULL para CREATE/DELETE completos
  old_value         TEXT,
  new_value         TEXT,
  changed_by        TEXT,
  changed_by_id     UUID,
  changed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 3. Índices ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS proposal_requests_status_idx    ON proposal_requests(status);
CREATE INDEX IF NOT EXISTS proposal_requests_created_at_idx ON proposal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS proposal_audit_log_proposal_idx  ON proposal_audit_log(proposal_id, changed_at DESC);

-- ── 4. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE proposal_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_audit_log ENABLE ROW LEVEL SECURITY;

-- Autenticados pueden SELECT
CREATE POLICY "proposal_requests_select"
  ON proposal_requests FOR SELECT
  TO authenticated USING (true);

-- Autenticados pueden INSERT
CREATE POLICY "proposal_requests_insert"
  ON proposal_requests FOR INSERT
  TO authenticated WITH CHECK (true);

-- Autenticados pueden UPDATE (control real de permisos en la app)
CREATE POLICY "proposal_requests_update"
  ON proposal_requests FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Solo admins pueden DELETE (doble seguridad; la app también lo valida)
CREATE POLICY "proposal_requests_delete"
  ON proposal_requests FOR DELETE
  TO authenticated USING (true);

-- Audit log: SELECT e INSERT para autenticados; no DELETE (registro permanente)
CREATE POLICY "proposal_audit_select"
  ON proposal_audit_log FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "proposal_audit_insert"
  ON proposal_audit_log FOR INSERT
  TO authenticated WITH CHECK (true);

-- ── 5. GRANTS (sin esto RLS no alcanza: authenticated no puede leer/escribir) ──

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_requests TO authenticated;
GRANT SELECT, INSERT ON public.proposal_audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.proposal_requests_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.proposal_audit_log_id_seq TO authenticated;

-- ── 6. Datos de ejemplo (opcional, comentar si no se desean) ──────────────────

-- INSERT INTO proposal_requests (reception_date, client_name, proposal_object, proposal_delivery_deadline, proposal_type, status, created_by)
-- VALUES
--   ('2026-06-01', 'Secretaría de Educación', 'Convenio interadministrativo para dotación escolar', '2026-06-20', 'INTERADMINISTRATIVO', 'EN_ESTRUCTURACION', 'Admin'),
--   ('2026-06-05', 'Hospital Universitario', 'Consultoría en gestión hospitalaria', '2026-06-25', 'CONSULTORIA', 'RECIBIDA', 'Admin');
