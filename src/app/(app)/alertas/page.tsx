import { getProjectAlerts } from "@/services/user.service"
import { ProjectAlertsPageClient } from "@/modules/projects/components/project-alerts-page-client"

export default async function AlertasPage() {
  let alerts: Awaited<ReturnType<typeof getProjectAlerts>> = []
  let loadError: string | null = null

  try {
    alerts = await getProjectAlerts()
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar alertas"
  }

  if (loadError) {
    return (
      <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
        {loadError}
      </div>
    )
  }

  return <ProjectAlertsPageClient alerts={alerts} />
}
