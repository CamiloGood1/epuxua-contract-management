-- Ejecutar en Supabase SQL Editor para que las vistas respeten RLS del usuario invocador.

ALTER VIEW v_contract_detail SET (security_invoker = true);
ALTER VIEW v_dashboard_kpis SET (security_invoker = true);
ALTER VIEW v_contract_tracking SET (security_invoker = true);
ALTER VIEW v_contract_alerts SET (security_invoker = true);
ALTER VIEW v_derived_contracts SET (security_invoker = true);
