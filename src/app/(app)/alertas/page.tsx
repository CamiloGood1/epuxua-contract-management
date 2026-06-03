import { getContracts, getContractTracking } from "@/services/contracts.service"
import { AlertsPageClient } from "@/modules/alerts/components/alerts-page-client"
import type { AlertContext } from "@/modules/contracts/lib/alerts"

export default async function AlertasPage() {
  const [contracts, tracking] = await Promise.all([
    getContracts().catch(() => []),
    getContractTracking().catch(() => []),
  ])

  const trackingContext: Record<string, AlertContext> = {}
  for (const row of tracking) {
    trackingContext[row.id] = {
      physicalProgress: row.last_physical_progress,
      hasFollowups: row.last_followup_date != null,
    }
  }

  return (
    <AlertsPageClient contracts={contracts} trackingContext={trackingContext} />
  )
}
