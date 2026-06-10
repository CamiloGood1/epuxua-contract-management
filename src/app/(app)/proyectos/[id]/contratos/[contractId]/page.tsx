import { notFound } from "next/navigation"
import {
  getContractById,
  getContractTrackingById,
  getContractFollowups,
  getDerivedContracts,
} from "@/services/contracts.service"
import { getProjectById } from "@/services/projects.service"
import { ContractDetail } from "@/modules/contracts/components/contract-detail"

interface PageProps {
  params: Promise<{ id: string; contractId: string }>
}

export default async function ProyectoContratoPage({ params }: PageProps) {
  const { id: projectId, contractId } = await params

  const [project, contract] = await Promise.all([
    getProjectById(projectId).catch(() => null),
    getContractById(contractId).catch(() => null),
  ])

  if (!project || !contract) notFound()

  const [tracking, followups, derivedContracts] = await Promise.all([
    getContractTrackingById(contractId).catch(() => null),
    getContractFollowups(contractId).catch(() => []),
    contract.contract_type === "INTERADMINISTRATIVO"
      ? getDerivedContracts(contractId).catch(() => [])
      : Promise.resolve([]),
  ])

  return (
    <ContractDetail
      contract={contract}
      physicalProgress={tracking?.last_physical_progress ?? null}
      followups={followups}
      derivedContracts={derivedContracts}
      backHref={`/proyectos/${projectId}`}
      backLabel={`Contrato ${'id_contrato' in project ? project.id_contrato : (project as {project_code?: string}).project_code ?? ''}`}
      projectId={projectId}
    />
  )
}
