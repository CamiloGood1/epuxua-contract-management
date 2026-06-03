-- Perfiles de usuario: el id NO se digita manualmente.
-- Siempre es auth.users.id (asignado por Supabase Auth).
-- Ejecutar en SQL Editor si ya tienes el DDL desplegado.

-- 1) Crear perfil del usuario autenticado (id = auth.uid())
CREATE OR REPLACE FUNCTION ensure_user_profile()
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
    'ESPECTADOR'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = now();

  SELECT * INTO v_result FROM user_profiles WHERE id = auth.uid();
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_user_profile() TO authenticated;

-- 2) Rellenar perfiles para usuarios Auth existentes (sin UUID manual)
CREATE OR REPLACE FUNCTION backfill_user_profiles_from_auth()
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
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    'ESPECTADOR'
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = au.id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3) Asignar rol por correo (SQL Editor / service role; no requiere copiar UUID)
CREATE OR REPLACE FUNCTION set_user_role_by_email(p_email text, p_role user_role_enum)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE user_profiles up
  SET role = p_role, updated_at = now()
  FROM auth.users au
  WHERE up.id = au.id
    AND lower(trim(au.email)) = lower(trim(p_email));

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Política: un usuario solo puede insertar SU propio perfil y siempre como ESPECTADOR
DROP POLICY IF EXISTS "profile_self_insert" ON user_profiles;
CREATE POLICY "profile_self_insert"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'ESPECTADOR');

-- Usuarios Auth ya creados antes del trigger:
SELECT backfill_user_profiles_from_auth();

-- Primer administrador (cambia el correo):
-- SELECT set_user_role_by_email('tu-correo@epuxua.co', 'ADMIN');
