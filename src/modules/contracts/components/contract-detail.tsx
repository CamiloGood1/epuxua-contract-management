"use client"

import { ContractInfoSidebar } from "./contract-info-sidebar"
import { ContractTabs } from "./contract-tabs"
import type { Contract } from "@/types/contract"

interface ContractDetailProps {
  contract: Contract
}

export function ContractDetail({ contract }: ContractDetailProps) {
  return (
    <div className="max-w-screen-2xl mx-auto pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left: sticky info panel */}
        <div className="xl:sticky xl:top-4">
          <ContractInfoSidebar contract={contract} />
        </div>

        {/* Right: tabs + content */}
        <ContractTabs contract={contract} />
      </div>
    </div>
  )
}
