import { notFound } from "next/navigation"
import { getContractById } from "@/services/contracts.service"
import { ContractDetail } from "@/modules/contracts/components/contract-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params
  const contract = await getContractById(id).catch(() => null)

  if (!contract) notFound()

  return <ContractDetail contract={contract} />
}
