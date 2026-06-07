"use client"

import { ContractInfoSidebar } from "./contract-info-sidebar"
import { ContractTabs } from "./contract-tabs"
import type { Contract, ContractFollowup } from "@/types/contract"

interface ContractDetailProps {
  contract: Contract
  physicalProgress?: number | null
  followups: ContractFollowup[]
  derivedContracts?: Contract[]
  backHref?: string
  backLabel?: string
  /** Si se abre desde un proyecto, los derivados enlazan dentro del mismo contexto */
  projectId?: string
}

export function ContractDetail({
  contract,
  physicalProgress,
  followups,
  derivedContracts = [],
  backHref,
  backLabel,
  projectId,
}: ContractDetailProps) {
  return (
    <div className="max-w-screen-2xl mx-auto pb-6 sm:pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,320px)_1fr] gap-4 sm:gap-6 items-start">
        <div className="xl:sticky xl:top-4 order-2 xl:order-1 min-w-0">
          <ContractInfoSidebar
            contract={contract}
            physicalProgress={physicalProgress}
            backHref={backHref}
            backLabel={backLabel}
          />
        </div>

        <div className="order-1 xl:order-2 min-w-0">
          <ContractTabs
            contract={contract}
            physicalProgress={physicalProgress}
            followups={followups}
            derivedContracts={derivedContracts}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  )
}
