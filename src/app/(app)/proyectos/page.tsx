import Link from "next/link"
import { PageShell } from "@/components/ui/page-shell"
import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { ProjectsTable } from "@/modules/projects/components/projects-table"

export default async function ProyectosPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let catalogs = { entities: [] as string[], managers: [] as string[], years: [] as number[] }
  let loadError: string | null = null

  try {
    const [raw, catalogsResult] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
    ])
    projects = await enrichProjectsWithManagers(raw)
    catalogs = catalogsResult
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar proyectos"
  }

  return (
    <PageShell
      title="Proyectos"
      subtitle="Vista general de la cartera de proyectos EPUXUA."
      icon="folder_special"
      actions={
        <Link
          href="/proyectos/kanban"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90"
        >
          Ver Kanban
        </Link>
      }
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          No se pudieron cargar los proyectos: {loadError}
        </div>
      )}
      <ProjectsTable
        projects={projects}
        entities={catalogs.entities}
        managers={catalogs.managers}
        years={catalogs.years}
      />
    </PageShell>
  )
}
