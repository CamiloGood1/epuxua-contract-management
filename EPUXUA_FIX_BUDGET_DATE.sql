-- ============================================================
-- EPUXUA — Fix: budget_commitments.date nullable (opcional)
-- El DDL v2 permite NULL; esquemas antiguos pueden tener NOT NULL.
-- La parte 5 ya rellena fechas faltantes con subscription_date del contrato.
-- Ejecutar solo si quieres alinear el esquema con EPUXUA_DDL.sql v2.
-- ============================================================

ALTER TABLE budget_commitments
  ALTER COLUMN date DROP NOT NULL;
