-- ── Paso 1: Añadir ESTRUCTURADOR al enum (si no existe) ──────────────────────
--
-- El rol ESTRUCTURADOR ya existe en el código TypeScript pero no estaba
-- registrado en el tipo user_role_enum de la base de datos.
-- ALTER TYPE ADD VALUE no puede ejecutarse dentro de una transacción,
-- por eso se ejecuta solo como primer paso.

ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'ESTRUCTURADOR';

-- ── Después de ejecutar el paso 1, ejecute el paso 2 en una segunda consulta ──

-- ── Paso 2: Política RLS para INSERT en interadministrativos ─────────────────

ALTER TABLE public.interadministrativos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authorized_roles_can_insert_interadmin" ON public.interadministrativos;

CREATE POLICY "authorized_roles_can_insert_interadmin"
ON public.interadministrativos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id   = auth.uid()
      AND user_profiles.role IN ('ADMIN', 'GERENTE', 'DIRECTIVO', 'ESTRUCTURADOR')
      AND user_profiles.active = true
  )
);

-- ── Verificación ──────────────────────────────────────────────────────────────
-- Confirmar que la política quedó registrada:
--
-- SELECT policyname, cmd, with_check
-- FROM pg_policies
-- WHERE tablename = 'interadministrativos';
--
-- Confirmar que el enum tiene el nuevo valor:
--
-- SELECT unnest(enum_range(NULL::user_role_enum));
