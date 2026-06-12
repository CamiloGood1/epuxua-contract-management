-- =============================================================================
-- EPUXUA: Asignaciones de interadministrativos + RLS endurecido + invitaciones
-- Ejecutar COMPLETO en Supabase → SQL Editor → Run
-- Reemplaza las políticas permisivas de MIGRATION_INTERADMIN_RLS.sql
-- =============================================================================
--
-- PREREQUISITO: tabla interadministrativos (modelo interadmin activo).
-- Si user_profiles NO existe, la sección 0 la crea automáticamente.
-- Si ya desplegaste EPUXUA_DDL.sql, la sección 0 es idempotente (no duplica).
--
-- Invitaciones (Modelo C):
--   El ADMIN invita con auth.admin.inviteUserByEmail y user_metadata:
--   { "full_name": "...", "role": "GERENTE_PROYECTO" }
--   handle_new_user / ensure_user_profile usan ese rol al crear el perfil.
--   Si no hay role válido en metadata → ESPECTADOR.
--
-- Lectura ESPECTADOR/DIRECTIVO: ven TODOS los interadministrativos (solo lectura).
-- GERENTE_PROYECTO/CONSULTOR_PROYECTO: solo interadministrativos asignados.
-- ADMIN/GERENTE: ven y editan todos.
-- =============================================================================

-- ── 0. Bootstrap user_profiles (si no existe en el proyecto) ─────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE public.user_role_enum AS ENUM (
      'ADMIN',
      'GERENTE',
      'GERENTE_PROYECTO',
      'DIRECTIVO',
      'CONSULTOR_PROYECTO',
      'ESPECTADOR'
    );
  END IF;
END $$;

-- Ampliar enum legacy (EPUXUA_DDL antiguo solo tenía ADMIN, GERENTE, ESPECTADOR)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'GERENTE_PROYECTO'
  ) THEN
    ALTER TYPE public.user_role_enum ADD VALUE 'GERENTE_PROYECTO';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'DIRECTIVO'
  ) THEN
    ALTER TYPE public.user_role_enum ADD VALUE 'DIRECTIVO';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'CONSULTOR_PROYECTO'
  ) THEN
    ALTER TYPE public.user_role_enum ADD VALUE 'CONSULTOR_PROYECTO';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         uuid           PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  varchar(255)   NOT NULL,
  role       user_role_enum NOT NULL DEFAULT 'ESPECTADOR',
  active     boolean        NOT NULL DEFAULT true,
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

DROP TRIGGER IF EXISTS trg_profiles_upd ON public.user_profiles;
CREATE TRIGGER trg_profiles_upd
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Necesaria antes de políticas RLS sobre user_profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role user_role_enum;
BEGIN
  SELECT role INTO v_role FROM user_profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_self_select" ON public.user_profiles;
CREATE POLICY "profile_self_select"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "profile_self_insert" ON public.user_profiles;
CREATE POLICY "profile_self_insert"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'ESPECTADOR');

DROP POLICY IF EXISTS "profile_self_update" ON public.user_profiles;
CREATE POLICY "profile_self_update"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.backfill_user_profiles_from_auth()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  INSERT INTO user_profiles (id, full_name, role)
  SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Usuario'),
    'ESPECTADOR'::user_role_enum
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = au.id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

SELECT public.backfill_user_profiles_from_auth();

-- Primer administrador (descomenta y cambia el correo si acabas de crear user_profiles):
-- UPDATE user_profiles SET role = 'ADMIN'
-- WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower('tu-correo@epuxua.co'));

-- ── 1. Tabla interadmin_assignments ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.interadmin_assignments (
  id                     BIGSERIAL PRIMARY KEY,
  interadministrativo_id BIGINT NOT NULL REFERENCES public.interadministrativos(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assignment_role        TEXT NOT NULL DEFAULT 'GERENTE_PROYECTO'
                         CHECK (assignment_role IN ('GERENTE_PROYECTO', 'CONSULTOR_PROYECTO')),
  active                 BOOLEAN NOT NULL DEFAULT true,
  start_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date               DATE,
  assigned_by            UUID REFERENCES public.user_profiles(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_interadmin_assignment_active
  ON public.interadmin_assignments (interadministrativo_id, user_id, assignment_role)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_ia_assign_user
  ON public.interadmin_assignments (user_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_ia_assign_interadmin
  ON public.interadmin_assignments (interadministrativo_id)
  WHERE active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interadmin_assignments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.interadmin_assignments_id_seq TO authenticated;

-- ── 2. Helpers de rol y acceso ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.resolve_user_role_from_metadata(p_meta jsonb)
RETURNS user_role_enum
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := NULLIF(trim(p_meta->>'role'), '');
  IF v_role IN (
    'ADMIN', 'GERENTE', 'GERENTE_PROYECTO',
    'DIRECTIVO', 'CONSULTOR_PROYECTO', 'ESPECTADOR'
  ) THEN
    RETURN v_role::user_role_enum;
  END IF;
  RETURN 'ESPECTADOR';
END;
$$;

-- Reutiliza current_user_role() del DDL si existe; si no, la crea.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role user_role_enum;
BEGIN
  SELECT role INTO v_role FROM user_profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_assigned_to_interadmin(p_interadmin_id BIGINT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM interadmin_assignments ia
    WHERE ia.interadministrativo_id = p_interadmin_id
      AND ia.user_id = auth.uid()
      AND ia.active = true
  );
$$;

-- Escritura: ADMIN/GERENTE todos; GERENTE_PROYECTO solo asignados.
CREATE OR REPLACE FUNCTION public.user_can_write_interadmin(p_interadmin_id BIGINT)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role user_role_enum;
BEGIN
  v_role := current_user_role();
  IF v_role IN ('ADMIN', 'GERENTE') THEN
    RETURN true;
  END IF;
  IF v_role = 'GERENTE_PROYECTO' THEN
    RETURN user_is_assigned_to_interadmin(p_interadmin_id);
  END IF;
  RETURN false;
END;
$$;

-- Lectura: ADMIN/GERENTE/ESPECTADOR/DIRECTIVO todos; GERENTE_PROYECTO/CONSULTOR asignados.
CREATE OR REPLACE FUNCTION public.user_can_read_interadmin(p_interadmin_id BIGINT)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role user_role_enum;
BEGIN
  v_role := current_user_role();
  IF v_role IN ('ADMIN', 'GERENTE', 'ESPECTADOR', 'DIRECTIVO') THEN
    RETURN true;
  END IF;
  IF v_role IN ('GERENTE_PROYECTO', 'CONSULTOR_PROYECTO') THEN
    RETURN user_is_assigned_to_interadmin(p_interadmin_id);
  END IF;
  RETURN false;
END;
$$;

-- Alias solicitado en spec
CREATE OR REPLACE FUNCTION public.user_has_interadmin(p_interadmin_id BIGINT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_can_write_interadmin(p_interadmin_id);
$$;

GRANT EXECUTE ON FUNCTION public.resolve_user_role_from_metadata(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_assigned_to_interadmin(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_write_interadmin(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_interadmin(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_interadmin(BIGINT) TO authenticated;

-- ── 3. Invitaciones: rol al crear perfil ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    resolve_user_role_from_metadata(NEW.raw_user_meta_data)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth   auth.users%ROWTYPE;
  v_result user_profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_auth FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario de auth no encontrado';
  END IF;

  INSERT INTO user_profiles (id, full_name, role)
  VALUES (
    v_auth.id,
    COALESCE(v_auth.raw_user_meta_data->>'full_name', v_auth.email),
    resolve_user_role_from_metadata(v_auth.raw_user_meta_data)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = now();
  -- NO sobrescribir role en conflicto: solo full_name

  SELECT * INTO v_result FROM user_profiles WHERE id = auth.uid();
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Directorio de usuarios (solo ADMIN)
CREATE OR REPLACE FUNCTION public.get_user_directory()
RETURNS TABLE (
  id         uuid,
  full_name  varchar,
  role       user_role_enum,
  active     boolean,
  created_at timestamptz,
  email      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id, up.full_name, up.role, up.active, up.created_at, au.email::text
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.id
  WHERE current_user_role() = 'ADMIN'
  ORDER BY up.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_directory() TO authenticated;

-- ── 4. RLS interadministrativos (reemplaza políticas permisivas) ──────────────

ALTER TABLE public.interadministrativos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interadmin_select_auth" ON public.interadministrativos;
DROP POLICY IF EXISTS "interadmin_update_auth" ON public.interadministrativos;
DROP POLICY IF EXISTS "interadmin_insert_auth" ON public.interadministrativos;
DROP POLICY IF EXISTS "interadmin_delete_auth" ON public.interadministrativos;

CREATE POLICY "interadmin_select_scoped" ON public.interadministrativos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_can_read_interadmin(id));

CREATE POLICY "interadmin_insert_scoped" ON public.interadministrativos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('ADMIN', 'GERENTE'));

CREATE POLICY "interadmin_update_scoped" ON public.interadministrativos
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_can_write_interadmin(id))
  WITH CHECK (user_can_write_interadmin(id));

-- contratos: lectura amplia; escritura alineada con interadmin padre
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratos_select_auth" ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_auth" ON public.contratos;
DROP POLICY IF EXISTS "contratos_insert_auth" ON public.contratos;

CREATE POLICY "contratos_select_scoped" ON public.contratos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM interadministrativos i
      WHERE i.id_contrato = contratos.id_interadministrativo
        AND user_can_read_interadmin(i.id)
    )
  );

CREATE POLICY "contratos_update_scoped" ON public.contratos
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interadministrativos i
      WHERE i.id_contrato = contratos.id_interadministrativo
        AND user_can_write_interadmin(i.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interadministrativos i
      WHERE i.id_contrato = contratos.id_interadministrativo
        AND user_can_write_interadmin(i.id)
    )
  );

CREATE POLICY "contratos_insert_scoped" ON public.contratos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('ADMIN', 'GERENTE'));

-- ── 5. RLS interadmin_assignments ─────────────────────────────────────────────

ALTER TABLE public.interadmin_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ia_assign_select" ON public.interadmin_assignments;
DROP POLICY IF EXISTS "ia_assign_insert" ON public.interadmin_assignments;
DROP POLICY IF EXISTS "ia_assign_update" ON public.interadmin_assignments;
DROP POLICY IF EXISTS "ia_assign_delete" ON public.interadmin_assignments;

CREATE POLICY "ia_assign_select" ON public.interadmin_assignments
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "ia_assign_insert" ON public.interadmin_assignments
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('ADMIN', 'GERENTE'));

CREATE POLICY "ia_assign_update" ON public.interadmin_assignments
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (current_user_role() IN ('ADMIN', 'GERENTE'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'GERENTE'));

CREATE POLICY "ia_assign_delete" ON public.interadmin_assignments
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (current_user_role() IN ('ADMIN', 'GERENTE'));

-- ── 6. Tablas hijas críticas (facturas, modificaciones, seguimiento, forma pago) ─

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interadmin_facturas') THEN
    EXECUTE 'DROP POLICY IF EXISTS "facturas_read" ON public.interadmin_facturas';
    EXECUTE 'DROP POLICY IF EXISTS "facturas_insert" ON public.interadmin_facturas';
    EXECUTE 'DROP POLICY IF EXISTS "facturas_update" ON public.interadmin_facturas';
    EXECUTE 'DROP POLICY IF EXISTS "facturas_delete" ON public.interadmin_facturas';
    EXECUTE 'CREATE POLICY "facturas_read" ON public.interadmin_facturas FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id))';
    EXECUTE 'CREATE POLICY "facturas_insert" ON public.interadmin_facturas FOR INSERT TO authenticated WITH CHECK (user_can_write_interadmin(interadministrativo_id))';
    EXECUTE 'CREATE POLICY "facturas_update" ON public.interadmin_facturas FOR UPDATE TO authenticated USING (user_can_write_interadmin(interadministrativo_id))';
    EXECUTE 'CREATE POLICY "facturas_delete" ON public.interadmin_facturas FOR DELETE TO authenticated USING (user_can_write_interadmin(interadministrativo_id))';
  END IF;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT unnest(ARRAY[
      'interadmin_adiciones', 'interadmin_prorrogas', 'interadmin_suspensiones',
      'interadmin_reinicios', 'interadmin_aclaratorios',
      'interadmin_tasks', 'interadmin_avances', 'contract_payment_schedule'
    ]) AS tbl
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = r.tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_read" ON public.%I', r.tbl, r.tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', r.tbl, r.tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', r.tbl, r.tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', r.tbl, r.tbl);
      EXECUTE format(
        'CREATE POLICY "%s_read" ON public.%I FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id))',
        r.tbl, r.tbl
      );
      EXECUTE format(
        'CREATE POLICY "%s_write" ON public.%I FOR ALL TO authenticated USING (user_can_write_interadmin(interadministrativo_id)) WITH CHECK (user_can_write_interadmin(interadministrativo_id))',
        r.tbl, r.tbl
      );
    END IF;
  END LOOP;
END $$;

-- Auditoría: lectura autenticados; insert si puede escribir el interadmin
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contract_change_log') THEN
    EXECUTE 'DROP POLICY IF EXISTS "ccl_select_auth" ON public.contract_change_log';
    EXECUTE 'DROP POLICY IF EXISTS "ccl_insert_auth" ON public.contract_change_log';
    EXECUTE 'CREATE POLICY "ccl_select_auth" ON public.contract_change_log AS PERMISSIVE FOR SELECT TO authenticated USING (user_can_read_interadmin(interadministrativo_id))';
    EXECUTE 'CREATE POLICY "ccl_insert_auth" ON public.contract_change_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_can_write_interadmin(interadministrativo_id))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interadmin_audit_log') THEN
    EXECUTE 'DROP POLICY IF EXISTS "audit_select_auth" ON public.interadmin_audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_insert_auth" ON public.interadmin_audit_log';
    EXECUTE 'CREATE POLICY "audit_select_auth" ON public.interadmin_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (user_can_read_interadmin(interadmin_id))';
    EXECUTE 'CREATE POLICY "audit_insert_auth" ON public.interadmin_audit_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_can_write_interadmin(interadmin_id))';
  END IF;
END $$;

-- user_profiles: ADMIN puede actualizar roles y estado de cualquier usuario
DROP POLICY IF EXISTS "profiles_admin_update" ON public.user_profiles;
CREATE POLICY "profiles_admin_update" ON public.user_profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

-- ── 7. Verificación ───────────────────────────────────────────────────────────

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('interadministrativos', 'interadmin_assignments', 'contratos')
ORDER BY tablename, policyname;
