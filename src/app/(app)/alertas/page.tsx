import { getContracts } from "@/services/contracts.service"
import { AlertsPageClient } from "@/modules/alerts/components/alerts-page-client"

export default async function AlertasPage() {
  const contracts = await getContracts().catch(() => [])
  return <AlertsPageClient contracts={contracts} />
}
