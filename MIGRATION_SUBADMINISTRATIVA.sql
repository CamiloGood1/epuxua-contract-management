-- ============================================================
-- MIGRATION: Rol SUBADMINISTRATIVA
-- Descripción: Agrega el rol SUBADMINISTRATIVA a la tabla de
--              perfiles y actualiza las políticas RLS para que
--              solo ADMIN y SUBADMINISTRATIVA puedan escribir
--              en las tablas de fuentes de financiación y
--              rendimientos financieros.
--
-- Ejecutar en: Supabase SQL Editor (una vez, en orden)
-- ============================================================

-- 1. Si la columna "role" tiene un CHECK constraint que lista
--    los roles permitidos, amplíalo. Corre primero este bloque
--    para ver si existe:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
  AND contype = 'c';

-- Si aparece un CHECK sobre "role", sustitúyelo así
-- (ajusta el nombre real del constraint):
-- ALTER TABLE user_profiles
--   DROP CONSTRAINT user_profiles_role_check;
-- ALTER TABLE user_profiles
--   ADD CONSTRAINT user_profiles_role_check
--   CHECK (role IN (
--     'ADMIN','GERENTE','GERENTE_PROYECTO','DIRECTIVO',
--     'CONSULTOR_PROYECTO','ESPECTADOR','ESTRUCTURADOR',
--     'SUBADMINISTRATIVA'
--   ));

-- 2. Si "role" es un tipo ENUM de PostgreSQL, agregar el valor:
-- ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'SUBADMINISTRATIVA';

-- 3. Si es simplemente texto (TEXT / VARCHAR sin enum), no se
--    necesita ningún cambio de columna.

-- ============================================================
-- POLÍTICAS RLS — Fuentes de Financiación
-- ============================================================

-- Eliminar política de escritura existente si la hay
DROP POLICY IF EXISTS "financial_write_admin_subadmin" ON interadmin_funding_sources;
DROP POLICY IF EXISTS "financial_write_admin_subadmin" ON interadmin_funding_groups;

-- Política: Solo ADMIN, GERENTE y SUBADMINISTRATIVA pueden
-- INSERT / UPDATE / DELETE en fuentes de financiación.
-- La validación primaria está en el servidor (funding.actions.ts),
-- pero RLS agrega la segunda capa de defensa.

CREATE POLICY "financial_sources_write"
  ON interadmin_funding_sources
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('ADMIN', 'GERENTE', 'SUBADMINISTRATIVA')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('ADMIN', 'GERENTE', 'SUBADMINISTRATIVA')
  );

-- ============================================================
-- POLÍTICAS RLS — Rendimientos Financieros
-- ============================================================

DROP POLICY IF EXISTS "financial_returns_write" ON interadmin_financial_returns;
DROP POLICY IF EXISTS "financial_returns_dist_write" ON interadmin_financial_return_distribution;

CREATE POLICY "financial_returns_write"
  ON interadmin_financial_returns
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('ADMIN', 'GERENTE', 'SUBADMINISTRATIVA')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('ADMIN', 'GERENTE', 'SUBADMINISTRATIVA')
  );

CREATE POLICY "financial_returns_dist_write"
  ON interadmin_financial_return_distribution
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('ADMIN', 'GERENTE', 'SUBADMINISTRATIVA')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('ADMIN', 'GERENTE', 'SUBADMINISTRATIVA')
  );

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Para confirmar que el rol funciona, asigna el rol a un
-- usuario de prueba y verifica:
--
-- UPDATE user_profiles
--   SET role = 'SUBADMINISTRATIVA'
--   WHERE id = '<uuid-del-usuario>';
--
-- Luego inicia sesión con ese usuario y confirma:
--   ✓ Puede ver todos los contratos interadministrativos
--   ✓ Puede crear/editar Fuentes de Financiación
--   ✓ Puede crear/editar Rendimientos Financieros
--   ✗ No puede editar Información General del contrato
--   ✗ No puede editar Seguimiento, Modificaciones, Forma de Pago
--   ✗ No puede eliminar fuentes ni rendimientos (solo ADMIN)
-- ============================================================
