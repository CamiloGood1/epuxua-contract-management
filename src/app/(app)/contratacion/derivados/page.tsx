import { Download, GitBranch } from "lucide-react"
import {
  getAllDerivedContracts,
  getDerivedContractsKPIs,
} from "@/services/derived-contracts.service"
import { DerivedContractsClient } from "@/modules/derived-contracts/components/derived-contracts-client"

export default async function ContratacionDerivadosPage() {
  const contracts = await getAllDerivedContracts().catch(() => [])
  const kpis = await getDerivedContractsKPIs(contracts)

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--corporate-blue)]/10 flex items-center justify-center shrink-0 mt-0.5">
            <GitBranch size={20} className="text-[var(--corporate-blue)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Contratos derivados
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Contratos directos vinculados a interadministrativos. Busca por número,
              objeto o contratista, o entra desde el expediente del proyecto.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--corporate-blue)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm shrink-0"
        >
          <Download size={15} />
          Descargar Excel
        </button>
      </div>

      <DerivedContractsClient contracts={contracts} kpis={kpis} />
    </div>
  )
}
