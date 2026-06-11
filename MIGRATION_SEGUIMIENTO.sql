-- ============================================================
-- EPUXUA: Módulo Seguimiento — Tareas y Evidencias
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla de Tareas
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_tasks (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  nombre                  TEXT          NOT NULL,
  descripcion             TEXT          NOT NULL,
  fecha_compromiso        DATE          NOT NULL,
  prioridad               TEXT          NOT NULL CHECK (prioridad IN ('BAJA','MEDIA','ALTA','CRITICA')),
  responsable             TEXT          NOT NULL,
  status                  TEXT          NOT NULL DEFAULT 'PENDIENTE'
                                          CHECK (status IN ('PENDIENTE','EN_PROCESO','COMPLETADA')),
  fecha_completada        DATE,
  enlace_evidencia_cierre TEXT,
  comentario_cierre       TEXT,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_interadmin
  ON interadmin_tasks(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON interadmin_tasks(status);

CREATE INDEX IF NOT EXISTS idx_tasks_fecha_compromiso
  ON interadmin_tasks(fecha_compromiso);

CREATE INDEX IF NOT EXISTS idx_tasks_responsable
  ON interadmin_tasks(responsable);

-- ─────────────────────────────────────────────────────────────
-- 2. Tabla de Evidencias de Avance
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_avances (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  fecha                   DATE          NOT NULL,
  descripcion             TEXT          NOT NULL,
  enlace_evidencia        TEXT          NOT NULL,
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avances_interadmin
  ON interadmin_avances(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_avances_fecha
  ON interadmin_avances(fecha DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS — Tareas
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadmin_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_read"   ON interadmin_tasks;
CREATE POLICY "tasks_read"   ON interadmin_tasks FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_insert" ON interadmin_tasks;
CREATE POLICY "tasks_insert" ON interadmin_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_update" ON interadmin_tasks;
CREATE POLICY "tasks_update" ON interadmin_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_delete" ON interadmin_tasks;
CREATE POLICY "tasks_delete" ON interadmin_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS — Avances
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadmin_avances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avances_read"   ON interadmin_avances;
CREATE POLICY "avances_read"   ON interadmin_avances FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "avances_insert" ON interadmin_avances;
CREATE POLICY "avances_insert" ON interadmin_avances FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "avances_update" ON interadmin_avances;
CREATE POLICY "avances_update" ON interadmin_avances FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "avances_delete" ON interadmin_avances;
CREATE POLICY "avances_delete" ON interadmin_avances FOR DELETE USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- 5. Vista KPIs globales (para dashboard y Kanban)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_tasks_kpis AS
SELECT
  COUNT(*)                                                                  AS total,
  COUNT(*) FILTER (WHERE status = 'PENDIENTE')                             AS pendientes,
  COUNT(*) FILTER (WHERE status = 'EN_PROCESO')                            AS en_proceso,
  COUNT(*) FILTER (WHERE status = 'COMPLETADA')                            AS completadas,
  COUNT(*) FILTER (
    WHERE status != 'COMPLETADA'
    AND fecha_compromiso < CURRENT_DATE
  )                                                                         AS vencidas,
  COUNT(*) FILTER (
    WHERE status != 'COMPLETADA'
    AND fecha_compromiso BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
  )                                                                         AS proximas_vencer,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'COMPLETADA')
    / NULLIF(COUNT(*), 0)
  , 1)                                                                      AS pct_cumplimiento
FROM interadmin_tasks;

-- KPIs por contrato
CREATE OR REPLACE VIEW v_tasks_kpis_por_contrato AS
SELECT
  interadministrativo_id,
  COUNT(*)                                                                  AS total,
  COUNT(*) FILTER (WHERE status = 'PENDIENTE')                             AS pendientes,
  COUNT(*) FILTER (WHERE status = 'EN_PROCESO')                            AS en_proceso,
  COUNT(*) FILTER (WHERE status = 'COMPLETADA')                            AS completadas,
  COUNT(*) FILTER (
    WHERE status != 'COMPLETADA'
    AND fecha_compromiso < CURRENT_DATE
  )                                                                         AS vencidas,
  COUNT(*) FILTER (
    WHERE status != 'COMPLETADA'
    AND fecha_compromiso BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
  )                                                                         AS proximas_vencer
FROM interadmin_tasks
GROUP BY interadministrativo_id;

-- ─────────────────────────────────────────────────────────────
-- 6. Vista Kanban global (join con id_contrato para display)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_tasks_kanban AS
SELECT
  t.*,
  i.id_contrato,
  i.objeto_contrato
FROM interadmin_tasks t
JOIN interadministrativos i ON i.id = t.interadministrativo_id
ORDER BY
  CASE t.status
    WHEN 'EN_PROCESO' THEN 0
    WHEN 'PENDIENTE'  THEN 1
    WHEN 'COMPLETADA' THEN 2
  END,
  t.fecha_compromiso ASC;

-- ─────────────────────────────────────────────────────────────
-- 7. Verificación
-- ─────────────────────────────────────────────────────────────

SELECT 'interadmin_tasks'         AS objeto, COUNT(*) AS filas FROM interadmin_tasks
UNION ALL
SELECT 'interadmin_avances',       COUNT(*) FROM interadmin_avances
UNION ALL
SELECT 'v_tasks_kpis',            COUNT(*) FROM v_tasks_kpis
UNION ALL
SELECT 'v_tasks_kpis_por_contrato', COUNT(*) FROM v_tasks_kpis_por_contrato
UNION ALL
SELECT 'v_tasks_kanban',           COUNT(*) FROM v_tasks_kanban;
