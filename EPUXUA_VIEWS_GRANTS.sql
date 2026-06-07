-- Permisos y RLS en vistas (ejecutar en Supabase SQL Editor después del DDL e importación).
-- Sin esto, la app en Vercel puede devolver 0 filas o errores de permiso.

ALTER VIEW v_contract_detail SET (security_invoker = true);
ALTER VIEW v_dashboard_kpis SET (security_invoker = true);
ALTER VIEW v_contract_tracking SET (security_invoker = true);
ALTER VIEW v_contract_alerts SET (security_invoker = true);
ALTER VIEW v_derived_contracts SET (security_invoker = true);
ALTER VIEW v_project_detail SET (security_invoker = true);
ALTER VIEW v_project_contract_tree SET (security_invoker = true);
ALTER VIEW v_project_financial SET (security_invoker = true);
ALTER VIEW v_project_indicators_app SET (security_invoker = true);

GRANT SELECT ON v_contract_detail TO authenticated;
GRANT SELECT ON v_dashboard_kpis TO authenticated;
GRANT SELECT ON v_contract_tracking TO authenticated;
GRANT SELECT ON v_contract_alerts TO authenticated;
GRANT SELECT ON v_derived_contracts TO authenticated;
GRANT SELECT ON v_project_detail TO authenticated;
GRANT SELECT ON v_project_contract_tree TO authenticated;
GRANT SELECT ON v_project_financial TO authenticated;
GRANT SELECT ON v_project_indicators_app TO authenticated;

-- Perfiles: el id se asigna solo (auth.users.id). Ejecutar también EPUXUA_USER_PROFILES_AUTO.sql
-- si el proyecto ya existía antes de ensure_user_profile().

-- Usuarios Auth sin fila en user_profiles:
-- SELECT backfill_user_profiles_from_auth();

-- Rol del usuario con el que inicias sesión (sin copiar UUID):
--   ADMIN o ESPECTADOR → todos los contratos
--   GERENTE → solo contract_assignments
-- SELECT set_user_role_by_email('tu-correo@institucion.gov.co', 'ADMIN');
