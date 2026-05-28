import { Suspense } from "react"
import { getContracts } from "@/services/contracts.service"
import { ContractsGrid, CardSkeleton } from "@/modules/contracts/components/contracts-grid"
import { ContractsPageHeader } from "@/modules/contracts/components/contracts-page-header"

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function ContractsPage() {
  const contracts = await getContracts().catch(() => [])

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-8">
      <ContractsPageHeader count={contracts.length} />
      <Suspense fallback={<GridSkeleton />}>
        <ContractsGrid contracts={contracts} />
      </Suspense>
    </div>
  )
}
