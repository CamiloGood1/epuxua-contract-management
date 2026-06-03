import { notFound } from "next/navigation"
import {
  getContractById,
  getContractTrackingById,
  getContractFollowups,
  getDerivedContracts,
} from "@/services/contracts.service"
import { ContractDetail } from "@/modules/contracts/components/contract-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params
  const contract = await getContractById(id).catch(() => null)

  if (!contract) notFound()

  const [tracking, followups, derivedContracts] = await Promise.all([
    getContractTrackingById(id).catch(() => null),
    getContractFollowups(id).catch(() => []),
    contract.contract_type === "INTERADMINISTRATIVO"
      ? getDerivedContracts(id).catch(() => [])
      : Promise.resolve([]),
  ])

  return (
    <ContractDetail
      contract={contract}
      physicalProgress={tracking?.last_physical_progress ?? null}
      followups={followups}
      derivedContracts={derivedContracts}
    />
  )
}
