import { PageShell } from "@/components/ui/page-shell"
import { getProjects } from "@/services/projects.service"
import { getProjectContractTree } from "@/services/projects.service"
import { FuncionamientoPageClient } from "@/modules/funcionamiento/components/funcionamiento-page-client"
import type { ProjectDetail } from "@/types/project"

export default async function FuncionamientoPage() {
  let projects: ProjectDetail[] = []
  let loadError: string | null = null

  try {
    projects = await getProjects({ type: "FUNCIONAMIENTO" })
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar Funcionamiento"
  }

  return (
    <PageShell
      title="Funcionamiento"
      subtitle="Contratos de apoyo con recursos propios EPUXUA — agrupados por proyecto contenedor anual."
      icon="corporate_fare"
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      <FuncionamientoPageClient projects={projects} />
    </PageShell>
  )
}
