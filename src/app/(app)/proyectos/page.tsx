import Link from "next/link"
import { PageShell } from "@/components/ui/page-shell"
import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { InteradministrativosPageClient } from "@/modules/projects/components/interadministrativos-page-client"

export default async function ProyectosPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let catalogs = { entities: [] as string[], secretarias: [] as string[], areas: [] as string[], years: [] as number[] }
  let loadError: string | null = null

  try {
    const [raw, catalogsResult] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
    ])
    projects = await enrichProjectsWithManagers(raw)
    catalogs = catalogsResult
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar contratos"
  }

  return (
    <PageShell
      title="Contratos Interadministrativos"
      subtitle="Cartera de contratos interadministrativos EPUXUA."
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
          No se pudieron cargar los contratos: {loadError}
        </div>
      )}
      <InteradministrativosPageClient
        projects={projects}
        entities={catalogs.entities}
        years={catalogs.years}
      />
    </PageShell>
  )
}
