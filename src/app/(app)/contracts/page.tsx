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
  let contracts: Awaited<ReturnType<typeof getContracts>> = []
  let loadError: string | null = null
  try {
    contracts = await getContracts()
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar contratos"
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          No se pudieron cargar los contratos desde Supabase: {loadError}
          <span className="block mt-1 text-xs text-destructive/80">
            Revisa variables en Vercel, ejecuta EPUXUA_VIEWS_GRANTS.sql y el rol en user_profiles (ADMIN/ESPECTADOR).
          </span>
        </div>
      )}
      <ContractsPageHeader count={contracts.length} />
      <Suspense fallback={<GridSkeleton />}>
        <ContractsGrid contracts={contracts} />
      </Suspense>
    </div>
  )
}
