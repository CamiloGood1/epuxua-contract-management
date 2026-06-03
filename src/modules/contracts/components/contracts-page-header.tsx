"use client"

import { useState } from "react"
import { Plus, Download } from "lucide-react"
import { MaterialIcon } from "@/components/ui/material-icon"
import { NewContractModal } from "./new-contract-modal"

interface ContractsPageHeaderProps {
  count: number
}

export function ContractsPageHeader({ count }: ContractsPageHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#151c27] tracking-tight">
            Gestión de contratos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {count} contrato{count !== 1 ? "s" : ""} registrado{count !== 1 ? "s" : ""} en el sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#EAEAEA] bg-white text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Download size={14} />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90"
          >
            <MaterialIcon name="add" size={16} />
            Nuevo contrato
          </button>
        </div>
      </div>

      <NewContractModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
