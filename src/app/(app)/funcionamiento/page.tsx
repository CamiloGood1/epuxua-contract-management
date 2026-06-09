import { PageShell } from "@/components/ui/page-shell"
import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import { getProjects } from "@/services/projects.service"
import { FuncionamientoPageClient } from "@/modules/funcionamiento/components/funcionamiento-page-client"

export default async function FuncionamientoPage() {
  let contracts: Awaited<ReturnType<typeof getFuncionamientoContracts>> = []
  let availableProjects: Awaited<ReturnType<typeof getProjects>> = []
  let loadError: string | null = null

  try {
    ;[contracts, availableProjects] = await Promise.all([
      getFuncionamientoContracts(),
      getProjects({ type: "FUNCIONAMIENTO" }),
    ])
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar Funcionamiento"
  }

  return (
    <PageShell
      title="Funcionamiento"
      subtitle="Contratos de apoyo con recursos propios EPUXUA — personal contratado por la entidad."
      icon="corporate_fare"
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      <FuncionamientoPageClient
        contracts={contracts}
        availableProjects={availableProjects}
      />
    </PageShell>
  )
}
