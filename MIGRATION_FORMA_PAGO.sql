-- ============================================================
-- EPUXUA: Forma de Pago Contractual — Interadministrativos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla de hitos de pago
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contract_payment_schedule (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  milestone_number        INT           NOT NULL CHECK (milestone_number > 0),
  milestone_name          TEXT          NOT NULL,
  destination             TEXT          NOT NULL CHECK (destination IN ('BIENES_SERVICIOS','CUOTA_GERENCIA','MIXTO')),
  percentage              NUMERIC(5,2)  CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
  scheduled_value         NUMERIC(20,2) NOT NULL CHECK (scheduled_value > 0),
  payment_condition       TEXT          NOT NULL,
  observations            TEXT,
  created_by              TEXT,
  created_by_id           UUID,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_milestone_per_contract UNIQUE (interadministrativo_id, milestone_number)
);

-- Campo reservado para futura relación con facturas
ALTER TABLE contract_payment_schedule
  ADD COLUMN IF NOT EXISTS payment_schedule_id BIGINT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_cps_interadmin
  ON contract_payment_schedule(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_cps_milestone_number
  ON contract_payment_schedule(interadministrativo_id, milestone_number);

-- ─────────────────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE contract_payment_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cps_read"   ON contract_payment_schedule;
CREATE POLICY "cps_read"   ON contract_payment_schedule FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cps_insert" ON contract_payment_schedule;
CREATE POLICY "cps_insert" ON contract_payment_schedule FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cps_update" ON contract_payment_schedule;
CREATE POLICY "cps_update" ON contract_payment_schedule FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cps_delete" ON contract_payment_schedule;
CREATE POLICY "cps_delete" ON contract_payment_schedule FOR DELETE USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- 3. Vista de resumen por contrato
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_cps_summary AS
SELECT
  interadministrativo_id,
  COUNT(*)                                                                           AS total_hitos,
  COALESCE(SUM(scheduled_value), 0)                                                 AS programado_total,
  COALESCE(SUM(CASE WHEN destination = 'BIENES_SERVICIOS' THEN scheduled_value ELSE 0 END), 0) AS programado_bienes,
  COALESCE(SUM(CASE WHEN destination = 'CUOTA_GERENCIA'   THEN scheduled_value ELSE 0 END), 0) AS programado_cuota,
  COALESCE(SUM(CASE WHEN destination = 'MIXTO'            THEN scheduled_value ELSE 0 END), 0) AS programado_mixto,
  COALESCE(SUM(percentage), 0)                                                      AS suma_pct
FROM contract_payment_schedule
GROUP BY interadministrativo_id;

-- ─────────────────────────────────────────────────────────────
-- 4. Vista global para dashboard
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_cps_dashboard AS
SELECT
  COALESCE(SUM(scheduled_value), 0)                                                 AS programado_total,
  COALESCE(SUM(CASE WHEN destination = 'BIENES_SERVICIOS' THEN scheduled_value ELSE 0 END), 0) AS programado_bienes,
  COALESCE(SUM(CASE WHEN destination = 'CUOTA_GERENCIA'   THEN scheduled_value ELSE 0 END), 0) AS programado_cuota,
  COALESCE(SUM(CASE WHEN destination = 'MIXTO'            THEN scheduled_value ELSE 0 END), 0) AS programado_mixto,
  COUNT(DISTINCT interadministrativo_id)                                             AS contratos_con_cronograma
FROM contract_payment_schedule;

-- ─────────────────────────────────────────────────────────────
-- 5. Verificación
-- ─────────────────────────────────────────────────────────────

SELECT 'contract_payment_schedule' AS objeto, COUNT(*) AS filas FROM contract_payment_schedule
UNION ALL
SELECT 'v_cps_summary',   COUNT(*) FROM v_cps_summary
UNION ALL
SELECT 'v_cps_dashboard', COUNT(*) FROM v_cps_dashboard;
