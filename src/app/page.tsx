import { getDashboardMetrics } from "@/services/dashboard.service"
import { getContracts } from "@/services/contracts.service"
import { DashboardPage } from "@/components/dashboard/DashboardPage"

export default async function Page() {
  try {
    const [metrics, contracts] = await Promise.all([
      getDashboardMetrics(),
      getContracts(),
    ])
    return <DashboardPage metrics={metrics} contracts={contracts} />
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return <DashboardPage metrics={null} contracts={[]} fetchError={message} />
  }
}
