-- ============================================================
-- EPUXUA: Expediente Contractual v2 — Modificaciones
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Avance físico en tabla principal
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadministrativos
  ADD COLUMN IF NOT EXISTS avance_fisico_pct NUMERIC(5,2) DEFAULT 0
    CHECK (avance_fisico_pct >= 0 AND avance_fisico_pct <= 100);

-- ─────────────────────────────────────────────────────────────
-- 2. Adiciones
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_adiciones (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  numero_adicion          INTEGER       NOT NULL,
  fecha_adicion           DATE          NOT NULL,
  valor_total             NUMERIC(20,2),
  valor_cuota_gerencia    NUMERIC(20,2),
  valor_bienes_servicios  NUMERIC(20,2),
  motivo                  TEXT,
  link_documental         TEXT,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adiciones_interadmin
  ON interadmin_adiciones(interadministrativo_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Prórrogas
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_prorrogas (
  id                        BIGSERIAL   PRIMARY KEY,
  interadministrativo_id    BIGINT      NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  numero_prorroga           INTEGER     NOT NULL,
  fecha_suscripcion         DATE        NOT NULL,
  nueva_fecha_terminacion   DATE        NOT NULL,
  plazo_prorroga            TEXT,
  justificacion             TEXT,
  user_id                   UUID,
  user_email                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prorrogas_interadmin
  ON interadmin_prorrogas(interadministrativo_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Suspensiones
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_suspensiones (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  numero_suspension       INTEGER       NOT NULL,
  fecha_suscripcion       DATE,
  inicio_suspension       DATE          NOT NULL,
  fin_suspension          DATE,
  plazo_suspension        TEXT,
  motivo                  TEXT,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspensiones_interadmin
  ON interadmin_suspensiones(interadministrativo_id);

-- ─────────────────────────────────────────────────────────────
-- 5. Reinicios
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_reinicios (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  numero_reinicio         INTEGER       NOT NULL,
  fecha_reinicio          DATE          NOT NULL,
  fecha_suscripcion       DATE,
  motivo                  TEXT,
  observaciones           TEXT,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reinicios_interadmin
  ON interadmin_reinicios(interadministrativo_id);

-- ─────────────────────────────────────────────────────────────
-- 6. Aclaratorios
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_aclaratorios (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  numero_aclaratorio      INTEGER       NOT NULL,
  fecha_suscripcion       DATE          NOT NULL,
  motivo                  TEXT,
  descripcion             TEXT,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aclaratorios_interadmin
  ON interadmin_aclaratorios(interadministrativo_id);

-- ─────────────────────────────────────────────────────────────
-- 7. RLS en todas las tablas de modificaciones
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'interadmin_adiciones',
    'interadmin_prorrogas',
    'interadmin_suspensiones',
    'interadmin_reinicios',
    'interadmin_aclaratorios'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "read_auth"   ON %I', t);
    EXECUTE format('CREATE POLICY "read_auth"   ON %I FOR SELECT USING (auth.uid() IS NOT NULL)', t);

    EXECUTE format('DROP POLICY IF EXISTS "insert_auth" ON %I', t);
    EXECUTE format('CREATE POLICY "insert_auth" ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', t);

    EXECUTE format('DROP POLICY IF EXISTS "update_auth" ON %I', t);
    EXECUTE format('CREATE POLICY "update_auth" ON %I FOR UPDATE USING (auth.uid() IS NOT NULL)', t);

    EXECUTE format('DROP POLICY IF EXISTS "delete_auth" ON %I', t);
    EXECUTE format('CREATE POLICY "delete_auth" ON %I FOR DELETE USING (auth.uid() IS NOT NULL)', t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 8. Verificación
-- ─────────────────────────────────────────────────────────────

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN (
  'interadministrativos',
  'interadmin_adiciones',
  'interadmin_prorrogas',
  'interadmin_suspensiones',
  'interadmin_reinicios',
  'interadmin_aclaratorios'
)
AND column_name IN ('avance_fisico_pct', 'interadministrativo_id', 'numero_adicion', 'numero_prorroga', 'numero_suspension', 'numero_reinicio', 'numero_aclaratorio')
ORDER BY table_name, column_name;
