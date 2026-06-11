-- ============================================================
-- EPUXUA: Facturación y Recaudo — Interadministrativos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla de facturas
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interadmin_facturas (
  id                      BIGSERIAL     PRIMARY KEY,
  interadministrativo_id  BIGINT        NOT NULL REFERENCES interadministrativos(id) ON DELETE CASCADE,
  numero_factura          TEXT          NOT NULL,
  fecha_remision          DATE          NOT NULL,
  fecha_ingreso           DATE,
  destino                 TEXT          NOT NULL CHECK (destino IN ('BIENES_SERVICIOS','CUOTA_GERENCIA')),
  valor_cobrado           NUMERIC(20,2) NOT NULL CHECK (valor_cobrado > 0),
  valor_ingresado         NUMERIC(20,2) DEFAULT 0,
  descuentos              NUMERIC(20,2) DEFAULT 0,
  estado                  TEXT          NOT NULL CHECK (estado IN ('FACTURADO','COBRADO','INGRESADO')),
  user_id                 UUID,
  user_email              TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_factura_contrato UNIQUE (interadministrativo_id, numero_factura)
);

CREATE INDEX IF NOT EXISTS idx_facturas_interadmin
  ON interadmin_facturas(interadministrativo_id);

CREATE INDEX IF NOT EXISTS idx_facturas_estado
  ON interadmin_facturas(estado);

CREATE INDEX IF NOT EXISTS idx_facturas_fecha_remision
  ON interadmin_facturas(fecha_remision DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE interadmin_facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facturas_read"   ON interadmin_facturas;
CREATE POLICY "facturas_read"   ON interadmin_facturas FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "facturas_insert" ON interadmin_facturas;
CREATE POLICY "facturas_insert" ON interadmin_facturas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "facturas_update" ON interadmin_facturas;
CREATE POLICY "facturas_update" ON interadmin_facturas FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "facturas_delete" ON interadmin_facturas;
CREATE POLICY "facturas_delete" ON interadmin_facturas FOR DELETE USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- 3. Vista de KPIs por contrato
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_interadmin_facturacion_kpis AS
SELECT
  interadministrativo_id,
  COUNT(*)                                                          AS total_facturas,
  COALESCE(SUM(valor_cobrado), 0)                                   AS facturado_total,
  COALESCE(SUM(valor_ingresado), 0)                                 AS ingresado_total,
  COALESCE(SUM(valor_cobrado - COALESCE(descuentos,0)), 0)          AS valor_neto_total,
  COALESCE(SUM(CASE WHEN destino='BIENES_SERVICIOS' THEN valor_cobrado ELSE 0 END), 0) AS facturado_bienes,
  COALESCE(SUM(CASE WHEN destino='CUOTA_GERENCIA'   THEN valor_cobrado ELSE 0 END), 0) AS facturado_cuota,
  COALESCE(SUM(CASE WHEN destino='BIENES_SERVICIOS' THEN valor_ingresado ELSE 0 END), 0) AS ingresado_bienes,
  COALESCE(SUM(CASE WHEN destino='CUOTA_GERENCIA'   THEN valor_ingresado ELSE 0 END), 0) AS ingresado_cuota,
  MAX(fecha_ingreso)                                                AS ultimo_pago,
  COUNT(*) FILTER (WHERE estado = 'FACTURADO')                      AS facturas_pendientes,
  COUNT(*) FILTER (WHERE estado = 'COBRADO')                        AS facturas_cobradas,
  COUNT(*) FILTER (WHERE estado = 'INGRESADO')                      AS facturas_ingresadas,
  COUNT(*) FILTER (
    WHERE estado IN ('FACTURADO','COBRADO')
    AND fecha_remision < CURRENT_DATE - INTERVAL '30 days'
  )                                                                 AS facturas_vencidas_30d
FROM interadmin_facturas
GROUP BY interadministrativo_id;

-- ─────────────────────────────────────────────────────────────
-- 4. Vista global para dashboard
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_facturacion_dashboard AS
SELECT
  COALESCE(SUM(valor_cobrado), 0)                                   AS facturado_total,
  COALESCE(SUM(valor_ingresado), 0)                                 AS ingresado_total,
  COALESCE(SUM(valor_cobrado - COALESCE(descuentos,0)), 0)          AS valor_neto_total,
  COALESCE(SUM(valor_cobrado) - SUM(COALESCE(valor_ingresado,0)), 0) AS pendiente_total,
  COALESCE(SUM(CASE WHEN destino='BIENES_SERVICIOS' THEN valor_cobrado ELSE 0 END), 0) AS facturado_bienes,
  COALESCE(SUM(CASE WHEN destino='CUOTA_GERENCIA'   THEN valor_cobrado ELSE 0 END), 0) AS facturado_cuota,
  COALESCE(SUM(CASE WHEN destino='BIENES_SERVICIOS' THEN valor_ingresado ELSE 0 END), 0) AS ingresado_bienes,
  COALESCE(SUM(CASE WHEN destino='CUOTA_GERENCIA'   THEN valor_ingresado ELSE 0 END), 0) AS ingresado_cuota
FROM interadmin_facturas;

-- ─────────────────────────────────────────────────────────────
-- 5. Verificación
-- ─────────────────────────────────────────────────────────────

SELECT 'interadmin_facturas' AS tabla, COUNT(*) AS registros FROM interadmin_facturas
UNION ALL
SELECT 'v_interadmin_facturacion_kpis', COUNT(*) FROM v_interadmin_facturacion_kpis
UNION ALL
SELECT 'v_facturacion_dashboard', COUNT(*) FROM v_facturacion_dashboard;
