-- =============================================================================
-- EPUXUA: Dashboard visible para todos los usuarios autenticados
-- Ejecutar en Supabase → SQL Editor si ya aplicó MIGRATION_INTERADMIN_ASSIGNMENTS.sql
-- =============================================================================
--
-- Abre lectura de cabeceras (interadministrativos + contratos) para KPIs del dashboard.
-- Expediente detallado sigue restringido en tablas hijas vía user_can_read_interadmin.

DROP POLICY IF EXISTS "interadmin_select_scoped" ON public.interadministrativos;
CREATE POLICY "interadmin_select_scoped" ON public.interadministrativos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contratos_select_scoped" ON public.contratos;
CREATE POLICY "contratos_select_scoped" ON public.contratos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
