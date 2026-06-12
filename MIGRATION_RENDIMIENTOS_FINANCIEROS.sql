-- ============================================================
-- EPUXUA V2: Rendimientos Financieros — Interadministrativos
-- Requiere: MIGRATION_FUENTES_FINANCIACION.sql
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Rendimientos (cabecera)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_financial_returns (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  funding_group_id        BIGINT        NOT NULL REFERENCES interadmin_funding_groups(id) ON DELETE RESTRICT,
  return_month            SMALLINT      NOT NULL CHECK (return_month BETWEEN 1 AND 12),
  return_year             SMALLINT      NOT NULL CHECK (return_year BETWEEN 2000 AND 2100),
  return_date             DATE          NOT NULL,
  gross_return_value      NUMERIC(20,2) NOT NULL CHECK (gross_return_value > 0),
  repayment_status        TEXT          NOT NULL DEFAULT 'PENDIENTE'
                          CHECK (repayment_status IN ('PENDIENTE', 'PARCIAL', 'DEVUELTO')),
  observations            TEXT,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_financial_return_period
    UNIQUE (funding_group_id, return_month, return_year)
);

CREATE INDEX IF NOT EXISTS idx_financial_returns_interadmin
  ON interadmin_financial_returns(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_financial_returns_group
  ON interadmin_financial_returns(funding_group_id);

CREATE INDEX IF NOT EXISTS idx_financial_returns_period
  ON interadmin_financial_returns(return_year DESC, return_month DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. Distribución automática por fuente
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_financial_return_distribution (
  id                       BIGSERIAL     PRIMARY KEY,
  financial_return_id      BIGINT        NOT NULL REFERENCES interadmin_financial_returns(id) ON DELETE CASCADE,
  interadministrativo_id   BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  funding_source_id        BIGINT        NOT NULL REFERENCES interadmin_funding_sources(id) ON DELETE RESTRICT,
  source_name              TEXT          NOT NULL,
  participation_percentage NUMERIC(8,4)  NOT NULL,
  distributed_value        NUMERIC(20,2) NOT NULL CHECK (distributed_value >= 0),
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_dist_return
  ON interadmin_financial_return_distribution(financial_return_id);

CREATE INDEX IF NOT EXISTS idx_return_dist_interadmin
  ON interadmin_financial_return_distribution(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_return_dist_source
  ON interadmin_financial_return_distribution(funding_source_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Devoluciones (estructura futura)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_financial_return_repayments (
  id                               BIGSERIAL     PRIMARY KEY,
  financial_return_distribution_id BIGINT        NOT NULL
                                   REFERENCES interadmin_financial_return_distribution(id) ON DELETE CASCADE,
  interadministrativo_id           BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  repayment_date                   DATE          NOT NULL,
  repayment_value                  NUMERIC(20,2) NOT NULL CHECK (repayment_value > 0),
  support_link                     TEXT,
  observations                     TEXT,
  status                           TEXT          NOT NULL DEFAULT 'REGISTRADO'
                                   CHECK (status IN ('REGISTRADO', 'CONFIRMADO', 'ANULADO')),
  user_id                          UUID,
  user_email                       TEXT,
  created_at                       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_repayments_dist
  ON interadmin_financial_return_repayments(financial_return_distribution_id);

CREATE INDEX IF NOT EXISTS idx_return_repayments_interadmin
  ON interadmin_financial_return_repayments(interadministrativo_id);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadmin_financial_returns              ENABLE ROW LEVEL SECURITY;
ALTER TABLE interadmin_financial_return_distribution  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interadmin_financial_return_repayments    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_returns_read"   ON interadmin_financial_returns;
DROP POLICY IF EXISTS "financial_returns_insert" ON interadmin_financial_returns;
DROP POLICY IF EXISTS "financial_returns_update" ON interadmin_financial_returns;
DROP POLICY IF EXISTS "financial_returns_delete" ON interadmin_financial_returns;

CREATE POLICY "financial_returns_read"   ON interadmin_financial_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "financial_returns_insert" ON interadmin_financial_returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "financial_returns_update" ON interadmin_financial_returns FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "financial_returns_delete" ON interadmin_financial_returns FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "return_dist_read"   ON interadmin_financial_return_distribution;
DROP POLICY IF EXISTS "return_dist_insert" ON interadmin_financial_return_distribution;
DROP POLICY IF EXISTS "return_dist_update" ON interadmin_financial_return_distribution;
DROP POLICY IF EXISTS "return_dist_delete" ON interadmin_financial_return_distribution;

CREATE POLICY "return_dist_read"   ON interadmin_financial_return_distribution FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "return_dist_insert" ON interadmin_financial_return_distribution FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "return_dist_update" ON interadmin_financial_return_distribution FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "return_dist_delete" ON interadmin_financial_return_distribution FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "return_repay_read"   ON interadmin_financial_return_repayments;
DROP POLICY IF EXISTS "return_repay_insert" ON interadmin_financial_return_repayments;
DROP POLICY IF EXISTS "return_repay_update" ON interadmin_financial_return_repayments;
DROP POLICY IF EXISTS "return_repay_delete" ON interadmin_financial_return_repayments;

CREATE POLICY "return_repay_read"   ON interadmin_financial_return_repayments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "return_repay_insert" ON interadmin_financial_return_repayments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "return_repay_update" ON interadmin_financial_return_repayments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "return_repay_delete" ON interadmin_financial_return_repayments FOR DELETE USING (auth.uid() IS NOT NULL);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'user_can_read_interadmin'
  ) THEN
    DROP POLICY IF EXISTS "financial_returns_read"   ON interadmin_financial_returns;
    DROP POLICY IF EXISTS "financial_returns_insert" ON interadmin_financial_returns;
    DROP POLICY IF EXISTS "financial_returns_update" ON interadmin_financial_returns;
    DROP POLICY IF EXISTS "financial_returns_delete" ON interadmin_financial_returns;
    CREATE POLICY "financial_returns_read"  ON interadmin_financial_returns FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id));
    CREATE POLICY "financial_returns_write" ON interadmin_financial_returns FOR ALL TO authenticated USING (user_can_write_interadmin(interadministrativo_id)) WITH CHECK (user_can_write_interadmin(interadministrativo_id));

    DROP POLICY IF EXISTS "return_dist_read"   ON interadmin_financial_return_distribution;
    DROP POLICY IF EXISTS "return_dist_insert" ON interadmin_financial_return_distribution;
    DROP POLICY IF EXISTS "return_dist_update" ON interadmin_financial_return_distribution;
    DROP POLICY IF EXISTS "return_dist_delete" ON interadmin_financial_return_distribution;
    CREATE POLICY "return_dist_read"  ON interadmin_financial_return_distribution FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id));
    CREATE POLICY "return_dist_write" ON interadmin_financial_return_distribution FOR ALL TO authenticated USING (user_can_write_interadmin(interadministrativo_id)) WITH CHECK (user_can_write_interadmin(interadministrativo_id));

    DROP POLICY IF EXISTS "return_repay_read"   ON interadmin_financial_return_repayments;
    DROP POLICY IF EXISTS "return_repay_insert" ON interadmin_financial_return_repayments;
    DROP POLICY IF EXISTS "return_repay_update" ON interadmin_financial_return_repayments;
    DROP POLICY IF EXISTS "return_repay_delete" ON interadmin_financial_return_repayments;
    CREATE POLICY "return_repay_read"  ON interadmin_financial_return_repayments FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id));
    CREATE POLICY "return_repay_write" ON interadmin_financial_return_repayments FOR ALL TO authenticated USING (user_can_write_interadmin(interadministrativo_id)) WITH CHECK (user_can_write_interadmin(interadministrativo_id));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Vistas KPI
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_interadmin_financial_returns_kpis AS
SELECT
  r.interadministrativo_id,
  COUNT(*)                                                          AS total_registros,
  COALESCE(SUM(r.gross_return_value), 0)                            AS rendimientos_acumulados,
  COALESCE(SUM(CASE WHEN r.return_year = EXTRACT(YEAR FROM CURRENT_DATE)::INT
    THEN r.gross_return_value ELSE 0 END), 0)                       AS rendimientos_anio_actual,
  COALESCE(SUM(CASE
    WHEN r.return_year = EXTRACT(YEAR FROM CURRENT_DATE)::INT
     AND r.return_month = EXTRACT(MONTH FROM CURRENT_DATE)::INT
    THEN r.gross_return_value ELSE 0 END), 0)                       AS rendimientos_mes_actual,
  COALESCE(SUM(CASE WHEN r.repayment_status IN ('PENDIENTE', 'PARCIAL')
    THEN r.gross_return_value ELSE 0 END), 0)                       AS pendiente_por_devolver,
  COUNT(*) FILTER (WHERE r.repayment_status = 'PENDIENTE')          AS registros_pendientes,
  COUNT(*) FILTER (WHERE r.repayment_status = 'PARCIAL')            AS registros_parciales
FROM interadmin_financial_returns r
GROUP BY r.interadministrativo_id;

CREATE OR REPLACE VIEW v_interadmin_financial_returns_by_source AS
SELECT
  d.interadministrativo_id,
  d.source_name,
  COUNT(DISTINCT d.financial_return_id)                             AS cantidad_distribuciones,
  COALESCE(SUM(d.distributed_value), 0)                            AS valor_acumulado,
  ROUND(AVG(d.participation_percentage), 2)                        AS participacion_promedio
FROM interadmin_financial_return_distribution d
GROUP BY d.interadministrativo_id, d.source_name
ORDER BY valor_acumulado DESC;

CREATE OR REPLACE VIEW v_interadmin_financial_returns_detail AS
SELECT
  r.id,
  r.interadministrativo_id,
  r.funding_group_id,
  g.group_name                                                      AS origen_recursos,
  r.return_month,
  r.return_year,
  r.return_date,
  r.gross_return_value,
  r.repayment_status,
  r.observations,
  r.user_email,
  r.created_at,
  COUNT(d.id)                                                       AS cantidad_fuentes,
  COALESCE(SUM(d.distributed_value), 0)                             AS total_distribuido
FROM interadmin_financial_returns r
JOIN interadmin_funding_groups g ON g.id = r.funding_group_id
LEFT JOIN interadmin_financial_return_distribution d ON d.financial_return_id = r.id
GROUP BY r.id, r.interadministrativo_id, r.funding_group_id, g.group_name,
         r.return_month, r.return_year, r.return_date, r.gross_return_value,
         r.repayment_status, r.observations, r.user_email, r.created_at;

GRANT SELECT ON v_interadmin_financial_returns_kpis TO authenticated;
GRANT SELECT ON v_interadmin_financial_returns_by_source TO authenticated;
GRANT SELECT ON v_interadmin_financial_returns_detail TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. Verificación
-- ─────────────────────────────────────────────────────────────

SELECT 'interadmin_financial_returns' AS tabla, COUNT(*) AS registros FROM interadmin_financial_returns
UNION ALL
SELECT 'interadmin_financial_return_distribution', COUNT(*) FROM interadmin_financial_return_distribution
UNION ALL
SELECT 'interadmin_financial_return_repayments', COUNT(*) FROM interadmin_financial_return_repayments;
