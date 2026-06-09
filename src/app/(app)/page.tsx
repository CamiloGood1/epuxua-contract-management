import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import { enrichFuncionamientoProjects } from "@/modules/projects/lib/dashboard-utils"
import { ProjectDashboardView } from "@/modules/projects/components/project-dashboard-view"

export default async function Page() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let entities: string[] = []
  let fetchError: string | undefined

  try {
    const [raw, catalogs, funcContracts] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
      getFuncionamientoContracts(),
    ])
    const withManagers = await enrichProjectsWithManagers(raw)
    projects = enrichFuncionamientoProjects(withManagers, funcContracts)
    entities = catalogs.entities
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Error desconocido"
  }

  return (
    <ProjectDashboardView
      projects={projects}
      entities={entities}
      fetchError={fetchError}
    />
  )
}
