"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Plus } from "lucide-react"
import { ContractCard } from "./contract-card"
import { ContractsFilters, type FilterState } from "./contracts-filters"
import type { Contract } from "@/types/contract"

function applyFilters(contracts: Contract[], f: FilterState): Contract[] {
  const query = f.search.toLowerCase().trim()

  return contracts.filter((c) => {
    if (query) {
      const haystack = [
        c.contract_number,
        c.object,
        c.contractor_name,
        c.supervisor_name,
        c.area_name,
        c.secretaria,
        String(c.year),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (f.status !== "all" && c.status !== f.status) return false
    if (f.entity !== "all" && c.area_name !== f.entity) return false
    if (f.manager !== "all" && c.supervisor_name !== f.manager) return false

    return true
  })
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-50 to-violet-50 border border-border flex items-center justify-center mb-4">
        <FileText size={28} className="text-muted-foreground/40" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-semibold text-foreground mb-1.5">Sin resultados</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ningún contrato coincide con los filtros aplicados.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-foreground mb-1.5">
            No hay contratos registrados
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Registra el primer contrato para comenzar el seguimiento.
          </p>
        </>
      )}
    </motion.div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
      <div className="h-1 bg-muted" />
      <div className="p-5 space-y-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded w-full" />
          <div className="h-2 bg-muted rounded w-full" />
        </div>
      </div>
    </div>
  )
}

interface ContractsGridProps {
  contracts: Contract[]
}

const INITIAL_FILTERS: FilterState = {
  search: "",
  status: "all",
  entity: "all",
  manager: "all",
}

export function ContractsGrid({ contracts }: ContractsGridProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)

  const areas = useMemo(
    () => [...new Set(contracts.map((c) => c.area_name).filter(Boolean))] as string[],
    [contracts]
  )
  const supervisors = useMemo(
    () => [...new Set(contracts.map((c) => c.supervisor_name).filter(Boolean))] as string[],
    [contracts]
  )

  const filtered = useMemo(() => applyFilters(contracts, filters), [contracts, filters])

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.entity !== "all" ||
    filters.manager !== "all"

  return (
    <div className="space-y-5">
      <ContractsFilters
        filters={filters}
        onFiltersChange={setFilters}
        entities={areas}
        managers={supervisors}
        totalCount={contracts.length}
        filteredCount={filtered.length}
      />
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <div key="empty">
            <EmptyState hasFilters={hasActiveFilters} />
          </div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((contract, i) => (
              <ContractCard key={contract.id} contract={contract} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
