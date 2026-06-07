import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { ProjectDashboardView } from "@/modules/projects/components/project-dashboard-view"

export default async function Page() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let entities: string[] = []
  let fetchError: string | undefined

  try {
    const [raw, catalogs] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
    ])
    projects = await enrichProjectsWithManagers(raw)
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
