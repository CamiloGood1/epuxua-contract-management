import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import { getProjects } from "@/services/projects.service"
import { FuncionamientoPageClient } from "@/modules/funcionamiento/components/funcionamiento-page-client"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function FuncionamientoPage({ searchParams }: PageProps) {
  let contracts: Awaited<ReturnType<typeof getFuncionamientoContracts>> = []
  let availableProjects: Awaited<ReturnType<typeof getProjects>> = []
  let loadError: string | null = null

  const params = await searchParams

  try {
    ;[contracts, availableProjects] = await Promise.all([
      getFuncionamientoContracts(),
      getProjects({ type: "FUNCIONAMIENTO" }),
    ])
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
        availableProjects={availableProjects}
        initialStatusFilter={params.status}
      />
    </>
  )
}
