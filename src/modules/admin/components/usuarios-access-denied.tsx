import { PageShell } from "@/components/ui/page-shell"
import { roleLabel } from "@/modules/projects/lib/access"
import type { UserProfile } from "@/services/user.service"

interface Props {
  profile: UserProfile
}

export function UsuariosAccessDenied({ profile }: Props) {
  return (
    <PageShell
      title="Usuarios"
      subtitle="Esta sección solo está disponible para administradores del sistema."
    >
      <div className="rounded-xl border border-[#0B3D91]/20 bg-white p-6 space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Su sesión actual tiene rol{" "}
          <strong className="text-[#0B3D91]">{roleLabel(profile.role)}</strong>
          {profile.email ? ` (${profile.email})` : ""}.
        </p>

        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <strong>Importante:</strong> la columna <code className="text-[11px]">role</code> en{" "}
          <code className="text-[11px]">auth.users</code> siempre es{" "}
          <code className="text-[11px]">authenticated</code> (Supabase Auth). El rol de la app está
          en <code className="text-[11px]">public.user_profiles.role</code>.
        </p>

        <p className="text-xs text-muted-foreground font-mono break-all">
          ID de sesión: {profile.id}
        </p>

        <div className="rounded-lg bg-[#f6f8fc] border border-border p-4 space-y-2">
          <p className="text-sm font-semibold text-[#151c27]">
            Paso 1 — Promover su cuenta a ADMIN en Supabase
          </p>
          <pre className="text-xs overflow-x-auto p-3 rounded bg-[#151c27] text-[#e2e8f0] whitespace-pre-wrap">{`-- Verificar (debe mostrar role = ADMIN)
SELECT up.id, up.role, up.active, au.email
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
WHERE lower(au.email) = lower('${profile.email ?? "tu-correo@epuxua.co"}');

-- Promover / crear perfil ADMIN (use su UUID si hace falta)
INSERT INTO user_profiles (id, full_name, role, active)
VALUES (
  '${profile.id}',
  '${profile.full_name ?? profile.email ?? "Administrador"}',
  'ADMIN',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  active = true,
  updated_at = now();`}</pre>
        </div>

        <div className="rounded-lg bg-[#f6f8fc] border border-border p-4 space-y-2">
          <p className="text-sm font-semibold text-[#151c27]">Paso 2 — Cerrar sesión y volver a entrar</p>
          <p className="text-xs text-muted-foreground">
            Así la app recarga el rol desde <code className="text-[11px]">user_profiles</code>.
            Luego verá el ítem <strong>Administración → Usuarios</strong> en el menú lateral.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Para invitar usuarios por correo, configure también{" "}
          <code className="text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> en{" "}
          <code className="text-[11px]">.env.local</code> del servidor.
        </p>
      </div>
    </PageShell>
  )
}
