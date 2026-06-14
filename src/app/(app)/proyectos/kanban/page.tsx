import { PageShell } from "@/components/ui/page-shell"
import { getProjectKanbanCards } from "@/services/projects.service"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import { getAssignedInteradminIdsForCurrentUser } from "@/services/interadmin-access"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ProjectKanban } from "@/modules/projects/components/project-kanban"
import { KanbanTabs } from "@/modules/kanban/components/kanban-tabs"
import type { TareaKanban } from "@/types/seguimiento"

export default async function ProyectosKanbanPage() {
  let kanbanCards: Awaited<ReturnType<typeof getProjectKanbanCards>> = []
  let tareas: TareaKanban[] = []
  let canEdit = false
  let canDelete = false
  let loadError: string | null = null

  try {
    const supabase = await createSupabaseServerClient()
    const [cards, profile, assignedIds] = await Promise.all([
      getProjectKanbanCards(),
      getCurrentUserProfile().catch(() => null),
      getAssignedInteradminIdsForCurrentUser(),
    ])

    kanbanCards = cards
    canEdit     = canEditProjects(profile?.role)
    canDelete   = canDeleteProject(profile?.role)

    // null = ver todo; [] = no asignado; [1,2,...] = filtrar por estos IDs
    const isRestricted = assignedIds !== null

    // ── Interadmin tasks ──────────────────────────────────────────────────────
    let interadminQuery = supabase
      .from("interadmin_tasks" as never)
      .select("*, interadministrativos(id, id_contrato, objeto_contrato)")
      .is("deleted_at", null)
      .order("fecha_compromiso", { ascending: true })

    if (isRestricted) {
      if (assignedIds.length === 0) {
        interadminQuery = interadminQuery.eq("interadministrativo_id", -1) // returns nothing
      } else {
        interadminQuery = interadminQuery.in("interadministrativo_id", assignedIds)
      }
    }

    // ── Contract (derivado) tasks ─────────────────────────────────────────────
    const contractTasksQuery = supabase
      .from("contract_tasks" as never)
      .select("*, contratos!inner(id, numero_contrato, objeto_contrato, id_interadministrativo)")
      .is("deleted_at", null)
      .order("fecha_compromiso", { ascending: true })

    const [{ data: interadminRaw }, { data: contractRaw }] = await Promise.all([
      interadminQuery,
      contractTasksQuery,
    ])

    // Map interadmin_tasks → TareaKanban
    const interadminTareas: TareaKanban[] = ((interadminRaw ?? []) as unknown[]).map((row: unknown) => {
      const r = row as Record<string, unknown>
      const inter = r.interadministrativos as { id?: number; id_contrato?: string; objeto_contrato?: string } | null
      return {
        ...r,
        id_contrato:     inter?.id_contrato,
        objeto_contrato: inter?.objeto_contrato,
        origen:          "INTERADMINISTRATIVO",
        interadministrativos: undefined,
      } as unknown as TareaKanban
    })

    // Map contract_tasks → TareaKanban
    // contract_tasks has contrato_id (numeric) but no interadministrativo_id
    // We set interadministrativo_id = 0 as placeholder (unused for DERIVADO actions)
    let contractTareas: TareaKanban[] = ((contractRaw ?? []) as unknown[]).map((row: unknown) => {
      const r = row as Record<string, unknown>
      const contrato = r.contratos as {
        id?: number
        numero_contrato?: string
        objeto_contrato?: string
        id_interadministrativo?: string
      } | null

      return {
        ...r,
        interadministrativo_id: 0,
        id_contrato:     contrato?.id_interadministrativo,
        objeto_contrato: contrato?.objeto_contrato,
        origen:          "DERIVADO",
        contrato_id:     contrato?.id ?? (r.contrato_id as number),
        project_id:      contrato?.id_interadministrativo,
        numero_derivado: contrato?.numero_contrato,
        contratos:       undefined,
      } as unknown as TareaKanban
    })

    // Role filter for DERIVADO tasks (GERENTE_PROYECTO: only assigned parents)
    if (isRestricted) {
      if (assignedIds.length === 0) {
        contractTareas = []
      } else {
        // Need id_contrato strings for assigned numeric IDs
        const { data: interadmins } = await supabase
          .from("interadministrativos")
          .select("id_contrato")
          .in("id", assignedIds)
        const allowedIdContratos = new Set(
          ((interadmins ?? []) as { id_contrato: string }[]).map(r => r.id_contrato)
        )
        contractTareas = contractTareas.filter(t => t.project_id && allowedIdContratos.has(t.project_id))
      }
    }

    tareas = [...interadminTareas, ...contractTareas].sort((a, b) =>
      a.fecha_compromiso.localeCompare(b.fecha_compromiso)
    )
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
        tasksKanban={<div id="tasks-kanban-slot" />}
        tareas={tareas}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </PageShell>
  )
}
