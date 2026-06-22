-- ============================================================
-- MIGRATION_DERIVADOS_V2.sql
-- Módulo de Contratos Derivados – Expediente Completo
-- Ejecutar en Supabase SQL Editor
-- NO elimina ni modifica tablas existentes.
-- ============================================================

-- ── 1. contract_adiciones ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_adiciones (
  id                      BIGSERIAL PRIMARY KEY,
  contrato_id             BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_adicion          INT NOT NULL,
  fecha_adicion           DATE NOT NULL,
  valor_adicion           NUMERIC(20,2) NOT NULL DEFAULT 0,
  valor_bienes_servicios  NUMERIC(20,2),
  valor_cuota_gerencia    NUMERIC(20,2),
  motivo                  TEXT,
  numero_cdp              TEXT,
  fecha_cdp               DATE,
  numero_rp               TEXT,
  fecha_rp                DATE,
  link_documental         TEXT,
  observaciones           TEXT,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_id, numero_adicion)
);

-- ── 2. contract_prorrogas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_prorrogas (
  id                        BIGSERIAL PRIMARY KEY,
  contrato_id               BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_prorroga           INT NOT NULL,
  fecha_suscripcion         DATE NOT NULL,
  nueva_fecha_terminacion   DATE NOT NULL,
  plazo_prorroga            TEXT,
  justificacion             TEXT,
  user_id                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_id, numero_prorroga)
);

-- ── 3. contract_suspensiones ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_suspensiones (
  id                BIGSERIAL PRIMARY KEY,
  contrato_id       BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_suspension INT NOT NULL,
  fecha_suscripcion DATE,
  inicio_suspension DATE NOT NULL,
  fin_suspension    DATE,
  plazo_suspension  TEXT,
  motivo            TEXT,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_id, numero_suspension)
);

-- ── 4. contract_reinicios ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_reinicios (
  id              BIGSERIAL PRIMARY KEY,
  contrato_id     BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_reinicio INT NOT NULL,
  fecha_reinicio  DATE NOT NULL,
  fecha_suscripcion DATE,
  motivo          TEXT,
  observaciones   TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_id, numero_reinicio)
);

-- ── 5. contract_aclaratorios ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_aclaratorios (
  id                  BIGSERIAL PRIMARY KEY,
  contrato_id         BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_aclaratorio  INT NOT NULL,
  fecha_suscripcion   DATE NOT NULL,
  motivo              TEXT,
  descripcion         TEXT,
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_id, numero_aclaratorio)
);

-- ── 6. contract_pagos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_pagos (
  id                          BIGSERIAL PRIMARY KEY,
  contrato_id                 BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_pago                 INT NOT NULL,
  fecha_pago                  DATE NOT NULL,
  valor_pagado                NUMERIC(20,2) NOT NULL DEFAULT 0,
  numero_orden_pago           TEXT,
  numero_factura_contratista  TEXT,
  descuentos                  NUMERIC(20,2) NOT NULL DEFAULT 0,
  valor_neto_girado           NUMERIC(20,2),
  observaciones               TEXT,
  enlace_soporte              TEXT,
  factura_interadmin_id       BIGINT REFERENCES interadmin_facturas(id) ON DELETE SET NULL,
  user_id                     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_id, numero_pago)
);

-- ── 7. contract_tasks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_tasks (
  id                      BIGSERIAL PRIMARY KEY,
  contrato_id             BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  nombre                  TEXT NOT NULL,
  descripcion             TEXT NOT NULL,
  fecha_compromiso        DATE NOT NULL,
  prioridad               TEXT NOT NULL DEFAULT 'MEDIA'
                            CHECK (prioridad IN ('BAJA','MEDIA','ALTA','CRITICA')),
  responsable             TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'PENDIENTE'
                            CHECK (status IN ('PENDIENTE','EN_PROCESO','COMPLETADA')),
  fecha_completada        DATE,
  enlace_evidencia_cierre TEXT,
  comentario_cierre       TEXT,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. contract_derivado_change_log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_derivado_change_log (
  id              BIGSERIAL PRIMARY KEY,
  contrato_id     BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  field_name      TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  changed_by      TEXT,
  changed_by_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at triggers ──────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS '
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    ';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_adiciones_updated_at') THEN
    CREATE TRIGGER trg_contract_adiciones_updated_at
      BEFORE UPDATE ON contract_adiciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_prorrogas_updated_at') THEN
    CREATE TRIGGER trg_contract_prorrogas_updated_at
      BEFORE UPDATE ON contract_prorrogas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_suspensiones_updated_at') THEN
    CREATE TRIGGER trg_contract_suspensiones_updated_at
      BEFORE UPDATE ON contract_suspensiones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_reinicios_updated_at') THEN
    CREATE TRIGGER trg_contract_reinicios_updated_at
      BEFORE UPDATE ON contract_reinicios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_aclaratorios_updated_at') THEN
    CREATE TRIGGER trg_contract_aclaratorios_updated_at
      BEFORE UPDATE ON contract_aclaratorios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_pagos_updated_at') THEN
    CREATE TRIGGER trg_contract_pagos_updated_at
      BEFORE UPDATE ON contract_pagos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_tasks_updated_at') THEN
    CREATE TRIGGER trg_contract_tasks_updated_at
      BEFORE UPDATE ON contract_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contract_adiciones_contrato    ON contract_adiciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_prorrogas_contrato    ON contract_prorrogas(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_suspensiones_contrato ON contract_suspensiones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_reinicios_contrato    ON contract_reinicios(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_aclaratorios_contrato ON contract_aclaratorios(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_pagos_contrato        ON contract_pagos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_tasks_contrato        ON contract_tasks(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_derivado_change_log_contrato   ON contract_derivado_change_log(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contract_derivado_change_log_at         ON contract_derivado_change_log(changed_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE contract_adiciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_prorrogas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_suspensiones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_reinicios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_aclaratorios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_pagos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_derivado_change_log    ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier usuario autenticado (idempotente)
DROP POLICY IF EXISTS "select_contract_adiciones"            ON contract_adiciones;
DROP POLICY IF EXISTS "select_contract_prorrogas"            ON contract_prorrogas;
DROP POLICY IF EXISTS "select_contract_suspensiones"         ON contract_suspensiones;
DROP POLICY IF EXISTS "select_contract_reinicios"            ON contract_reinicios;
DROP POLICY IF EXISTS "select_contract_aclaratorios"         ON contract_aclaratorios;
DROP POLICY IF EXISTS "select_contract_pagos"                ON contract_pagos;
DROP POLICY IF EXISTS "select_contract_tasks"                ON contract_tasks;
DROP POLICY IF EXISTS "select_contract_derivado_change_log"  ON contract_derivado_change_log;

CREATE POLICY "select_contract_adiciones"     ON contract_adiciones     FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_prorrogas"     ON contract_prorrogas     FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_suspensiones"  ON contract_suspensiones  FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_reinicios"     ON contract_reinicios     FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_aclaratorios"  ON contract_aclaratorios  FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_pagos"         ON contract_pagos         FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_tasks"         ON contract_tasks         FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_contract_derivado_change_log"    ON contract_derivado_change_log    FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE: roles con escritura (ADMIN, GERENTE, GERENTE_PROYECTO)
-- La lógica de asignación se valida en el servidor; aquí abrimos a autenticados
-- para que el service role y las server actions funcionen.
DROP POLICY IF EXISTS "write_contract_adiciones"            ON contract_adiciones;
DROP POLICY IF EXISTS "write_contract_prorrogas"            ON contract_prorrogas;
DROP POLICY IF EXISTS "write_contract_suspensiones"         ON contract_suspensiones;
DROP POLICY IF EXISTS "write_contract_reinicios"            ON contract_reinicios;
DROP POLICY IF EXISTS "write_contract_aclaratorios"         ON contract_aclaratorios;
DROP POLICY IF EXISTS "write_contract_pagos"                ON contract_pagos;
DROP POLICY IF EXISTS "write_contract_tasks"                ON contract_tasks;
DROP POLICY IF EXISTS "write_contract_derivado_change_log"  ON contract_derivado_change_log;

CREATE POLICY "write_contract_adiciones"     ON contract_adiciones     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_prorrogas"     ON contract_prorrogas     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_suspensiones"  ON contract_suspensiones  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_reinicios"     ON contract_reinicios     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_aclaratorios"  ON contract_aclaratorios  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_pagos"         ON contract_pagos         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_tasks"         ON contract_tasks         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "write_contract_derivado_change_log"    ON contract_derivado_change_log    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Verificación ──────────────────────────────────────────────────────────────

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'contract_adiciones','contract_prorrogas','contract_suspensiones',
    'contract_reinicios','contract_aclaratorios','contract_pagos',
    'contract_tasks','contract_derivado_change_log'
  )
ORDER BY table_name;
