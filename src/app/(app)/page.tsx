import { getProjectDashboardMetrics, getProjects } from "@/services/projects.service"
import { ProjectDashboardView } from "@/modules/projects/components/project-dashboard-view"

export default async function Page() {
  let metrics: Awaited<ReturnType<typeof getProjectDashboardMetrics>> | null = null
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let fetchError: string | undefined

  try {
    ;[metrics, projects] = await Promise.all([
      getProjectDashboardMetrics(),
      getProjects(),
    ])
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Error desconocido"
  }

  return (
    <ProjectDashboardView
      metrics={metrics}
      recentProjects={projects}
      fetchError={fetchError}
    />
  )
}
