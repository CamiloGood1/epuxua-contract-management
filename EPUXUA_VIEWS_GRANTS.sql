-- Permisos y RLS en vistas (ejecutar en Supabase SQL Editor).
-- Idempotente: solo altera/concede en vistas que existan en public.
-- No requiere EPUXUA_DDL.sql completo.

DO $$
DECLARE
  v record;
BEGIN
  FOR v IN
    SELECT unnest(ARRAY[
      -- Legacy EPUXUA_DDL (opcional)
      'v_contract_detail',
      'v_dashboard_kpis',
      'v_contract_tracking',
      'v_contract_alerts',
      'v_derived_contracts',
      'v_project_detail',
      'v_project_contract_tree',
      'v_project_financial',
      'v_project_indicators_app',
      -- Dashboard interadmin (FASE2A)
      'v_funcionamiento_contracts',
      'v_dashboard_funcionamiento',
      'v_interadmin_projects',
      'v_dashboard_interadmin',
      -- Módulos interadmin
      'v_interadmin_facturacion_kpis',
      'v_facturacion_dashboard',
      'v_cps_summary',
      'v_cps_dashboard',
      'v_tasks_kpis',
      'v_tasks_kpis_por_contrato',
      'v_tasks_kanban',
      -- Fuentes de Financiación (MIGRATION_FUENTES_FINANCIACION.sql)
      'v_interadmin_funding_kpis',
      'v_interadmin_funding_consolidated',
      'v_interadmin_funding_group_summary',
      'v_interadmin_funding_principal'
    ]) AS viewname
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_views
      WHERE schemaname = 'public'
        AND viewname = v.viewname
    ) THEN
      EXECUTE format(
        'ALTER VIEW public.%I SET (security_invoker = true)',
        v.viewname
      );
      EXECUTE format(
        'GRANT SELECT ON public.%I TO authenticated',
        v.viewname
      );
      RAISE NOTICE 'OK: %', v.viewname;
    ELSE
      RAISE NOTICE 'SKIP (no existe): %', v.viewname;
    END IF;
  END LOOP;
END $$;

-- Verificación: vistas con grant en public
SELECT
  table_name AS vista,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND privilege_type = 'SELECT'
  AND table_name LIKE 'v\_%' ESCAPE '\'
ORDER BY table_name;

-- Perfiles: el id se asigna solo (auth.users.id). Ejecutar también EPUXUA_USER_PROFILES_AUTO.sql
-- si el proyecto ya existía antes de ensure_user_profile().

-- Usuarios Auth sin fila en user_profiles:
-- SELECT backfill_user_profiles_from_auth();

-- Rol del usuario con el que inicias sesión (sin copiar UUID):
--   ADMIN o ESPECTADOR → todos los contratos
--   GERENTE → solo contract_assignments
-- SELECT set_user_role_by_email('tu-correo@institucion.gov.co', 'ADMIN');
