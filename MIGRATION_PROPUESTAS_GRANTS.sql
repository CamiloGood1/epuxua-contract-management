-- Parche: permisos para módulo de Propuestas (si ya ejecutó MIGRATION_PROPUESTAS.sql sin GRANTs).
-- Ejecutar en Supabase → SQL Editor → Run

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposal_requests') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_requests TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.proposal_requests_id_seq TO authenticated';
    RAISE NOTICE 'OK: grants proposal_requests';
  ELSE
    RAISE NOTICE 'SKIP: proposal_requests no existe — ejecute MIGRATION_PROPUESTAS.sql primero';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposal_audit_log') THEN
    EXECUTE 'GRANT SELECT, INSERT ON public.proposal_audit_log TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.proposal_audit_log_id_seq TO authenticated';
    RAISE NOTICE 'OK: grants proposal_audit_log';
  ELSE
    RAISE NOTICE 'SKIP: proposal_audit_log no existe';
  END IF;
END $$;
