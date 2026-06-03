-- Permisos y RLS en vistas (ejecutar en Supabase SQL Editor después del DDL e importación).
-- Sin esto, la app en Vercel puede devolver 0 filas o errores de permiso.

ALTER VIEW v_contract_detail SET (security_invoker = true);
ALTER VIEW v_dashboard_kpis SET (security_invoker = true);
ALTER VIEW v_contract_tracking SET (security_invoker = true);
ALTER VIEW v_contract_alerts SET (security_invoker = true);
ALTER VIEW v_derived_contracts SET (security_invoker = true);

GRANT SELECT ON v_contract_detail TO authenticated;
GRANT SELECT ON v_dashboard_kpis TO authenticated;
GRANT SELECT ON v_contract_tracking TO authenticated;
GRANT SELECT ON v_contract_alerts TO authenticated;
GRANT SELECT ON v_derived_contracts TO authenticated;

-- El usuario con el que inicias sesión debe poder leer contratos:
--   ADMIN o ESPECTADOR → todos los contratos
--   GERENTE → solo contratos en contract_assignments
-- Ejemplo (reemplaza el UUID por auth.users.id del usuario):
-- UPDATE user_profiles SET role = 'ADMIN' WHERE id = '00000000-0000-0000-0000-000000000000';
