-- =============================================================================
-- EPUXUA: Permisos para editar interadministrativos desde la app
-- Ejecutar COMPLETO en Supabase → SQL Editor → Run
-- =============================================================================

-- ── 1. GRANTS (sin esto RLS no alcanza: el rol authenticated no puede escribir) ──

GRANT SELECT, INSERT, UPDATE ON public.interadministrativos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contratos TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Tablas de auditoría (opcionales — crear con MIGRATION_CHANGE_LOG.sql y MIGRATION_INTERADMIN_FORM.sql)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contract_change_log') THEN
    EXECUTE 'GRANT SELECT, INSERT ON public.contract_change_log TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interadmin_audit_log') THEN
    EXECUTE 'GRANT SELECT, INSERT ON public.interadmin_audit_log TO authenticated';
  END IF;
END $$;

-- ── 2. interadministrativos ────────────────────────────────────────────────────

ALTER TABLE public.interadministrativos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas que puedan bloquear (nombres comunes)
DROP POLICY IF EXISTS "interadmin_select_auth"     ON public.interadministrativos;
DROP POLICY IF EXISTS "interadmin_update_auth"     ON public.interadministrativos;
DROP POLICY IF EXISTS "interadmin_insert_auth"     ON public.interadministrativos;
DROP POLICY IF EXISTS "interadmin_delete_auth"     ON public.interadministrativos;
DROP POLICY IF EXISTS "authenticated_read"         ON public.interadministrativos;
DROP POLICY IF EXISTS "authenticated_write"        ON public.interadministrativos;
DROP POLICY IF EXISTS "Enable read for authenticated users"   ON public.interadministrativos;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.interadministrativos;

CREATE POLICY "interadmin_select_auth" ON public.interadministrativos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "interadmin_insert_auth" ON public.interadministrativos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "interadmin_update_auth" ON public.interadministrativos
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── 3. contratos (sync al cambiar N° de contrato) ───────────────────────────

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratos_select_auth" ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_auth" ON public.contratos;
DROP POLICY IF EXISTS "contratos_insert_auth" ON public.contratos;

CREATE POLICY "contratos_select_auth" ON public.contratos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "contratos_update_auth" ON public.contratos
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── 4. Historial de cambios (auditoría al guardar — opcional) ────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contract_change_log') THEN
    EXECUTE 'ALTER TABLE public.contract_change_log ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "ccl_read" ON public.contract_change_log';
    EXECUTE 'DROP POLICY IF EXISTS "ccl_insert" ON public.contract_change_log';
    EXECUTE 'DROP POLICY IF EXISTS "ccl_select_auth" ON public.contract_change_log';
    EXECUTE 'DROP POLICY IF EXISTS "ccl_insert_auth" ON public.contract_change_log';
    EXECUTE 'CREATE POLICY "ccl_select_auth" ON public.contract_change_log AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "ccl_insert_auth" ON public.contract_change_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interadmin_audit_log') THEN
    EXECUTE 'ALTER TABLE public.interadmin_audit_log ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_read_staff" ON public.interadmin_audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_insert_auth" ON public.interadmin_audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_select_auth" ON public.interadmin_audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_insert_auth" ON public.interadmin_audit_log';
    EXECUTE 'CREATE POLICY "audit_select_auth" ON public.interadmin_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "audit_insert_auth" ON public.interadmin_audit_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- ── 5. Verificación (debe devolver filas con policyname) ─────────────────────

SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('interadministrativos', 'contratos', 'contract_change_log', 'interadmin_audit_log')
ORDER BY tablename, policyname;

-- Debe listar al menos: interadmin_select_auth, interadmin_update_auth, interadmin_insert_auth
