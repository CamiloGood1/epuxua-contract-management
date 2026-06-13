import { PageShell } from "@/components/ui/page-shell"
import { UsersPageClient } from "@/modules/admin/components/users-page-client"
import { UsuariosAccessDenied } from "@/modules/admin/components/usuarios-access-denied"
import { canManageUsers } from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import { getInteradminCatalog, listUsers } from "@/services/users.service"

export const dynamic = "force-dynamic"

export default async function AdministracionUsuariosPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!profile) {
    return (
      <PageShell title="Usuarios" subtitle="Inicie sesión para continuar.">
        <p className="text-sm text-muted-foreground">No hay sesión activa.</p>
      </PageShell>
    )
  }

  if (!canManageUsers(profile.role)) {
    return <UsuariosAccessDenied profile={profile} />
  }

  let users: Awaited<ReturnType<typeof listUsers>> = []
  let catalog: Awaited<ReturnType<typeof getInteradminCatalog>> = []
  let loadError: string | null = null

  try {
    ;[users, catalog] = await Promise.all([listUsers(), getInteradminCatalog()])
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar usuarios"
  }

  return (
    <PageShell
      title="Usuarios"
      subtitle="Alta de usuarios con contraseña asignada, roles y asignación de contratos interadministrativos."
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      <UsersPageClient users={users} interadminCatalog={catalog} />
    </PageShell>
  )
}
