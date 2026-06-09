import { PageShell } from "@/components/ui/page-shell"
import { getProjectKanbanCards } from "@/services/projects.service"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { ProjectKanban } from "@/modules/projects/components/project-kanban"

export default async function ProyectosKanbanPage() {
  let cards: Awaited<ReturnType<typeof getProjectKanbanCards>> = []
  let loadError: string | null = null
  let canEdit = false

  try {
    const [kanbanCards, profile] = await Promise.all([
      getProjectKanbanCards(),
      getCurrentUserProfile(),
    ])
    cards = kanbanCards
    canEdit = canEditProjects(profile?.role)
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar Kanban"
  }

  return (
    <PageShell
      title="Kanban de proyectos"
      subtitle="Proyectos interadministrativos — arrastre las tarjetas entre columnas para actualizar el ciclo de vida."
      icon="view_kanban"
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      {!canEdit && (
        <p className="text-xs text-muted-foreground mb-4">
          Modo solo lectura — no puede mover tarjetas con su rol actual.
        </p>
      )}
      <ProjectKanban cards={cards} canEdit={canEdit} />
    </PageShell>
  )
}
