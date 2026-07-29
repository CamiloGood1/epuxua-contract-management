-- MIGRATION_CONTACT_CDP.sql
-- Agrega campos de contacto (dirección, teléfono, correo) a la tabla contratos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS telefono  TEXT,
  ADD COLUMN IF NOT EXISTS correo    TEXT;

-- Verificar columnas agregadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contratos'
  AND column_name IN ('direccion', 'telefono', 'correo')
ORDER BY column_name;
