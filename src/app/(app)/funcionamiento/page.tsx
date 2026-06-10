import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import { FuncionamientoPageClient } from "@/modules/funcionamiento/components/funcionamiento-page-client"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function FuncionamientoPage({ searchParams }: PageProps) {
  let contracts: Awaited<ReturnType<typeof getFuncionamientoContracts>> = []
  let loadError: string | null = null

  const params = await searchParams

  try {
    contracts = await getFuncionamientoContracts()
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar Funcionamiento"
  }

  return (
    <>
      {loadError && (
        <div className="px-6 pt-4">
          <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
            {loadError}
          </div>
        </div>
      )}
      <FuncionamientoPageClient
        contracts={contracts}
        initialStatusFilter={params.status}
      />
    </>
  )
}
