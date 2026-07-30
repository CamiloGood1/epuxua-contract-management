-- Rendimientos Financieros: ciclo de vida completo
-- Ejecutar en Supabase SQL Editor.
-- Luego recargar caché del esquema: Project Settings → API → Reload schema.

ALTER TABLE interadmin_financial_returns
  ADD COLUMN IF NOT EXISTS documento_evidencia    TEXT,
  ADD COLUMN IF NOT EXISTS repayment_date         DATE,
  ADD COLUMN IF NOT EXISTS repayment_value        NUMERIC(20, 2),
  ADD COLUMN IF NOT EXISTS repayment_support_link TEXT,
  ADD COLUMN IF NOT EXISTS repayment_observations TEXT;
