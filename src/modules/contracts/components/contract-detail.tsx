"use client"

import { ContractInfoSidebar } from "./contract-info-sidebar"
import { ContractTabs } from "./contract-tabs"
import type { Contract, ContractFollowup } from "@/types/contract"

interface ContractDetailProps {
  contract: Contract
  physicalProgress?: number | null
  followups: ContractFollowup[]
  derivedContracts?: Contract[]
}

export function ContractDetail({
  contract,
  physicalProgress,
  followups,
  derivedContracts = [],
}: ContractDetailProps) {
  return (
    <div className="max-w-screen-2xl mx-auto pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="xl:sticky xl:top-4">
          <ContractInfoSidebar
            contract={contract}
            physicalProgress={physicalProgress}
          />
        </div>

        <ContractTabs
          contract={contract}
          physicalProgress={physicalProgress}
          followups={followups}
          derivedContracts={derivedContracts}
        />
      </div>
    </div>
  )
}
