import { PageShell } from "@/components/ui/page-shell"
import { getProjectKanbanCards } from "@/services/projects.service"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ProjectKanban } from "@/modules/projects/components/project-kanban"
import { KanbanTabs } from "@/modules/kanban/components/kanban-tabs"
import type { TareaKanban } from "@/types/seguimiento"

export default async function ProyectosKanbanPage() {
  let kanbanCards: Awaited<ReturnType<typeof getProjectKanbanCards>> = []
  let tareas: TareaKanban[] = []
  let canEdit = false
  let loadError: string | null = null

  try {
    const supabase = await createSupabaseServerClient()
    const [cards, profile, { data: tareasRaw }] = await Promise.all([
      getProjectKanbanCards(),
      getCurrentUserProfile().catch(() => null),
      supabase.from("interadmin_tasks" as never).select("*, interadministrativos(id_contrato, objeto_contrato)").order("fecha_compromiso", { ascending: true }),
    ])
    kanbanCards = cards
    canEdit     = canEditProjects(profile?.role)

    // Flatten nested join
    tareas = ((tareasRaw ?? []) as unknown[]).map((row: unknown) => {
      const r = row as Record<string, unknown>
      const inter = r.interadministrativos as { id_contrato?: string; objeto_contrato?: string } | null
      return {
        ...r,
        id_contrato:     inter?.id_contrato,
        objeto_contrato: inter?.objeto_contrato,
        interadministrativos: undefined,
      } as unknown as TareaKanban
    })
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar Kanban"
  }

  return (
    <PageShell
      title="Kanban"
      subtitle="Gestión visual de proyectos y tareas de seguimiento."
      icon="view_kanban"
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      <KanbanTabs
        projectKanban={<ProjectKanban cards={kanbanCards} canEdit={canEdit} />}
        tasksKanban={<div id="tasks-kanban-slot" data-tareas={JSON.stringify(tareas)} data-can-edit={String(canEdit)} />}
        tareas={tareas}
        canEdit={canEdit}
      />
    </PageShell>
  )
}
