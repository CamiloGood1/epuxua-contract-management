-- ============================================================
-- EPUXUA V2: Fuentes de Financiación — Interadministrativos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Grupos de financiación (Bolsa Original + Adiciones)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_funding_groups (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  group_type              TEXT          NOT NULL CHECK (group_type IN ('ORIGINAL', 'ADICION')),
  group_name              TEXT          NOT NULL,
  related_modification_id BIGINT        REFERENCES interadmin_adiciones(id) ON DELETE SET NULL,
  total_value             NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_funding_group_adicion
    UNIQUE (related_modification_id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT chk_funding_group_adicion_link CHECK (
    (group_type = 'ORIGINAL' AND related_modification_id IS NULL)
    OR (group_type = 'ADICION' AND related_modification_id IS NOT NULL)
  )
);

-- Solo puede existir un grupo ORIGINAL por contrato
CREATE UNIQUE INDEX IF NOT EXISTS uq_funding_group_one_original
  ON interadmin_funding_groups (interadministrativo_id)
  WHERE group_type = 'ORIGINAL';

CREATE INDEX IF NOT EXISTS idx_funding_groups_interadmin
  ON interadmin_funding_groups(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_funding_groups_adicion
  ON interadmin_funding_groups(related_modification_id)
  WHERE related_modification_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Detalle de fuentes por grupo
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_funding_sources (
  id                       BIGSERIAL     PRIMARY KEY,
  funding_group_id         BIGINT        NOT NULL REFERENCES interadmin_funding_groups(id) ON DELETE CASCADE,
  interadministrativo_id   BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  source_name              TEXT          NOT NULL,
  source_value             NUMERIC(20,2) NOT NULL CHECK (source_value > 0),
  participation_percentage NUMERIC(8,4)  NOT NULL DEFAULT 0,
  observations             TEXT,
  user_id                  UUID,
  user_email               TEXT,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_sources_group
  ON interadmin_funding_sources(funding_group_id);

CREATE INDEX IF NOT EXISTS idx_funding_sources_interadmin
  ON interadmin_funding_sources(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_funding_sources_name
  ON interadmin_funding_sources(source_name);

-- ─────────────────────────────────────────────────────────────
-- 3. Trigger: recalcular participation_percentage automáticamente
--    Fórmula: source_value / total_value_grupo × 100
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalc_funding_source_percentages(p_group_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT total_value INTO v_total
  FROM interadmin_funding_groups
  WHERE id = p_group_id;

  IF v_total IS NULL OR v_total <= 0 THEN
    UPDATE interadmin_funding_sources
    SET participation_percentage = 0, updated_at = NOW()
    WHERE funding_group_id = p_group_id;
    RETURN;
  END IF;

  UPDATE interadmin_funding_sources
  SET
    participation_percentage = ROUND((source_value / v_total) * 100, 4),
    updated_at = NOW()
  WHERE funding_group_id = p_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_recalc_funding_percentages()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_id BIGINT;
BEGIN
  v_group_id := COALESCE(NEW.funding_group_id, OLD.funding_group_id);
  PERFORM recalc_funding_source_percentages(v_group_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_funding_sources_recalc ON interadmin_funding_sources;
CREATE TRIGGER trg_funding_sources_recalc
  AFTER INSERT OR UPDATE OR DELETE ON interadmin_funding_sources
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_funding_percentages();

CREATE OR REPLACE FUNCTION trg_recalc_funding_on_group_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.total_value IS DISTINCT FROM OLD.total_value THEN
    PERFORM recalc_funding_source_percentages(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funding_groups_recalc ON interadmin_funding_groups;
CREATE TRIGGER trg_funding_groups_recalc
  AFTER UPDATE OF total_value ON interadmin_funding_groups
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_funding_on_group_total();

-- ─────────────────────────────────────────────────────────────
-- 4. RLS (permisivo inicial; endurecer con MIGRATION_INTERADMIN_ASSIGNMENTS)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadmin_funding_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interadmin_funding_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_groups_read"   ON interadmin_funding_groups;
DROP POLICY IF EXISTS "funding_groups_insert" ON interadmin_funding_groups;
DROP POLICY IF EXISTS "funding_groups_update" ON interadmin_funding_groups;
DROP POLICY IF EXISTS "funding_groups_delete" ON interadmin_funding_groups;

CREATE POLICY "funding_groups_read"   ON interadmin_funding_groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "funding_groups_insert" ON interadmin_funding_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "funding_groups_update" ON interadmin_funding_groups FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "funding_groups_delete" ON interadmin_funding_groups FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "funding_sources_read"   ON interadmin_funding_sources;
DROP POLICY IF EXISTS "funding_sources_insert" ON interadmin_funding_sources;
DROP POLICY IF EXISTS "funding_sources_update" ON interadmin_funding_sources;
DROP POLICY IF EXISTS "funding_sources_delete" ON interadmin_funding_sources;

CREATE POLICY "funding_sources_read"   ON interadmin_funding_sources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "funding_sources_insert" ON interadmin_funding_sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "funding_sources_update" ON interadmin_funding_sources FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "funding_sources_delete" ON interadmin_funding_sources FOR DELETE USING (auth.uid() IS NOT NULL);

-- Endurecer RLS si existen funciones de asignación
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'user_can_read_interadmin'
  ) THEN
    DROP POLICY IF EXISTS "funding_groups_read"   ON interadmin_funding_groups;
    DROP POLICY IF EXISTS "funding_groups_insert" ON interadmin_funding_groups;
    DROP POLICY IF EXISTS "funding_groups_update" ON interadmin_funding_groups;
    DROP POLICY IF EXISTS "funding_groups_delete" ON interadmin_funding_groups;
    CREATE POLICY "funding_groups_read"   ON interadmin_funding_groups FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id));
    CREATE POLICY "funding_groups_write"  ON interadmin_funding_groups FOR ALL TO authenticated USING (user_can_write_interadmin(interadministrativo_id)) WITH CHECK (user_can_write_interadmin(interadministrativo_id));

    DROP POLICY IF EXISTS "funding_sources_read"   ON interadmin_funding_sources;
    DROP POLICY IF EXISTS "funding_sources_insert" ON interadmin_funding_sources;
    DROP POLICY IF EXISTS "funding_sources_update" ON interadmin_funding_sources;
    DROP POLICY IF EXISTS "funding_sources_delete" ON interadmin_funding_sources;
    CREATE POLICY "funding_sources_read"  ON interadmin_funding_sources FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id));
    CREATE POLICY "funding_sources_write" ON interadmin_funding_sources FOR ALL TO authenticated USING (user_can_write_interadmin(interadministrativo_id)) WITH CHECK (user_can_write_interadmin(interadministrativo_id));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Vistas
-- ─────────────────────────────────────────────────────────────

-- KPIs por contrato
CREATE OR REPLACE VIEW v_interadmin_funding_kpis AS
SELECT
  g.interadministrativo_id,
  COUNT(DISTINCT g.id)                                              AS total_grupos,
  COUNT(s.id)                                                       AS total_fuentes,
  COALESCE(SUM(s.source_value), 0)                                  AS valor_financiado_total,
  COUNT(DISTINCT s.source_name)                                     AS fuentes_distintas,
  COALESCE(SUM(CASE WHEN g.group_type = 'ORIGINAL' THEN s.source_value ELSE 0 END), 0) AS valor_bolsa_original,
  COALESCE(SUM(CASE WHEN g.group_type = 'ADICION'   THEN s.source_value ELSE 0 END), 0) AS valor_adiciones
FROM interadmin_funding_groups g
LEFT JOIN interadmin_funding_sources s ON s.funding_group_id = g.id
GROUP BY g.interadministrativo_id;

-- Resumen consolidado por nombre de fuente (todas las bolsas)
CREATE OR REPLACE VIEW v_interadmin_funding_consolidated AS
SELECT
  s.interadministrativo_id,
  s.source_name,
  COALESCE(SUM(s.source_value), 0)                                  AS total_aportado,
  ROUND(
    COALESCE(SUM(s.source_value), 0) * 100.0
    / NULLIF(
        (SELECT COALESCE(SUM(s2.source_value), 0)
         FROM interadmin_funding_sources s2
         WHERE s2.interadministrativo_id = s.interadministrativo_id),
        0
      ),
    4
  )                                                                 AS participacion_consolidada_pct
FROM interadmin_funding_sources s
GROUP BY s.interadministrativo_id, s.source_name
ORDER BY total_aportado DESC;

-- Detalle por grupo con totales y diferencia de validación
CREATE OR REPLACE VIEW v_interadmin_funding_group_summary AS
SELECT
  g.id                                                              AS funding_group_id,
  g.interadministrativo_id,
  g.group_type,
  g.group_name,
  g.related_modification_id,
  g.total_value,
  COALESCE(SUM(s.source_value), 0)                                  AS total_aportado,
  COALESCE(SUM(s.source_value), 0) - g.total_value                  AS diferencia,
  COUNT(s.id)                                                       AS num_fuentes,
  CASE
    WHEN g.total_value > 0
      AND ABS(COALESCE(SUM(s.source_value), 0) - g.total_value) < 0.01
    THEN true ELSE false
  END                                                               AS es_consistente
FROM interadmin_funding_groups g
LEFT JOIN interadmin_funding_sources s ON s.funding_group_id = g.id
GROUP BY g.id, g.interadministrativo_id, g.group_type, g.group_name,
         g.related_modification_id, g.total_value;

-- Principal financiador por contrato
CREATE OR REPLACE VIEW v_interadmin_funding_principal AS
SELECT DISTINCT ON (interadministrativo_id)
  interadministrativo_id,
  source_name                                                       AS principal_financiador,
  total_aportado                                                    AS valor_principal,
  participacion_consolidada_pct                                     AS participacion_principal_pct
FROM v_interadmin_funding_consolidated
ORDER BY interadministrativo_id, total_aportado DESC;

-- ─────────────────────────────────────────────────────────────
-- 6. Grants en vistas
-- ─────────────────────────────────────────────────────────────

GRANT SELECT ON v_interadmin_funding_kpis TO authenticated;
GRANT SELECT ON v_interadmin_funding_consolidated TO authenticated;
GRANT SELECT ON v_interadmin_funding_group_summary TO authenticated;
GRANT SELECT ON v_interadmin_funding_principal TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. Verificación
-- ─────────────────────────────────────────────────────────────

SELECT 'interadmin_funding_groups'  AS tabla, COUNT(*) AS registros FROM interadmin_funding_groups
UNION ALL
SELECT 'interadmin_funding_sources', COUNT(*) FROM interadmin_funding_sources
UNION ALL
SELECT 'v_interadmin_funding_kpis',  COUNT(*) FROM v_interadmin_funding_kpis;
