"use client"

import { useMemo, useState } from "react"
import { Plus, Download, AlertTriangle } from "lucide-react"
import { NewContractModal } from "@/modules/contracts/components/new-contract-modal"
import { DashboardFilters } from "./DashboardFilters"
import { DashboardSection } from "./DashboardSection"
import {
  DEFAULT_DASHBOARD_FILTERS,
  applyDashboardFilters,
  splitBySegment,
  buildSectionKPIs,
  buildDonutSlices,
  buildSecretariatBars,
  buildParentInteradminBars,
  uniqueYears,
} from "./dashboard-utils"
import type { Contract } from "@/types/contract"
import type { DashboardMetrics } from "@/types"
import {
  STATUS_CONFIG as SC,
  resolveStatus as RS,
  formatCOP,
} from "@/modules/contracts/lib/status"
import { FileText, GitBranch } from "lucide-react"

export const STATUS_CONFIG = SC
export const resolveStatus = RS
export { formatCOP }
export type StatusKey = keyof typeof STATUS_CONFIG

interface DashboardPageProps {
  metrics: DashboardMetrics | null
  contracts: Contract[]
  fetchError?: string
}

export function DashboardPage({ contracts, fetchError }: DashboardPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS)

  const filtered = useMemo(
    () => applyDashboardFilters(contracts, filters),
    [contracts, filters]
  )

  const { main, derived } = useMemo(
    () => splitBySegment(filtered, filters.segment),
    [filtered, filters.segment]
  )

  const years = useMemo(() => uniqueYears(contracts), [contracts])

  const mainKpis = useMemo(
    () => buildSectionKPIs(main, { total: "Total contratos", icon: FileText }),
    [main]
  )
  const derivedKpis = useMemo(
    () => buildSectionKPIs(derived, { total: "Total derivados", icon: GitBranch }),
    [derived]
  )

  const mainDonut = useMemo(() => buildDonutSlices(main), [main])
  const derivedDonut = useMemo(() => buildDonutSlices(derived), [derived])
  const mainBars = useMemo(() => buildSecretariatBars(main), [main])
  const derivedBars = useMemo(() => buildParentInteradminBars(derived), [derived])

  const showMain = filters.segment !== "derivados"
  const showDerived = filters.segment !== "contratos"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#151c27] tracking-tight">
            Ejecución y monitoreo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Contratos EPUXUA y derivados de interadministrativos, por separado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90 shadow-sm"
          >
            <Plus size={14} />
            Nuevo contrato
          </button>
        </div>
      </div>

      <NewContractModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertTriangle size={16} />
          Error al cargar datos: {fetchError}
        </div>
      )}

      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        years={years}
        mainCount={main.length}
        derivedCount={derived.length}
      />

      <div className="space-y-6">
        {showMain && (
          <DashboardSection
            variant="main"
            title="Contratos EPUXUA"
            subtitle="Funcionamiento, interadministrativos, tienda virtual y pago contra factura"
            contracts={main}
            kpis={mainKpis}
            donutData={mainDonut}
            barData={mainBars}
            barTitle="Por secretaría"
            barSubtitle="Contratos interadministrativos (marco con el municipio)"
            listHref="/contracts"
            listLabel="Ver contratos"
          />
        )}

        {showDerived && (
          <DashboardSection
            variant="derived"
            title="Contratos derivados"
            subtitle="Ejecución vinculada a un contrato interadministrativo padre"
            contracts={derived}
            kpis={derivedKpis}
            donutData={derivedDonut}
            barData={derivedBars}
            barTitle="Por interadmin padre"
            barSubtitle="Agrupados por número de contrato interadministrativo"
            listHref="/contratos-derivados"
            listLabel="Ver derivados"
          />
        )}
      </div>
    </div>
  )
}
