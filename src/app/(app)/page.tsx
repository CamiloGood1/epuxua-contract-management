import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import { enrichFuncionamientoProjects } from "@/modules/projects/lib/dashboard-utils"
import { ProjectDashboardView } from "@/modules/projects/components/project-dashboard-view"
import type { FuncionamientoContract } from "@/services/funcionamiento.service"

export default async function Page() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let entities: string[] = []
  let activeContracts: FuncionamientoContract[] = []
  let fetchError: string | undefined

  try {
    const [raw, catalogs, funcContracts] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
      getFuncionamientoContracts(),
    ])

    // Dashboard solo muestra contratos de funcionamiento EN EJECUCION
    activeContracts = funcContracts.filter((c) => c.status === "EN_EJECUCION")

    const withManagers = await enrichProjectsWithManagers(raw)
    // Enriquecer proyectos contenedor solo con los contratos activos
    projects = enrichFuncionamientoProjects(withManagers, activeContracts)
    entities = catalogs.entities
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Error desconocido"
  }

  return (
    <ProjectDashboardView
      projects={projects}
      entities={entities}
      fetchError={fetchError}
      funcionamientoActiveContracts={activeContracts}
    />
  )
}
