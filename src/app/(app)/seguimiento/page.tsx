import { getContractTracking } from "@/services/contracts.service"
import { SeguimientoPageClient } from "@/modules/seguimiento/components/seguimiento-page-client"

export default async function SeguimientoPage() {
  const rows = await getContractTracking().catch(() => [])
  return <SeguimientoPageClient rows={rows} />
}
