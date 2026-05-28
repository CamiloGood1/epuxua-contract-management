"use client"

import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_OPTIONS } from "../lib/status"

export interface FilterState {
  search: string
  status: string
  entity: string
  manager: string
}

interface ContractsFiltersProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
  entities: string[]
  managers: string[]
  totalCount: number
  filteredCount: number
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full appearance-none rounded-xl border border-border bg-card pl-3 pr-8 text-sm",
          "text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all",
          value !== "all" && value !== "" && "border-primary/40 bg-primary/5"
        )}
      >
        <option value="all">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

function ActivePill({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-primary/70 transition-colors"
        aria-label={`Quitar filtro ${label}`}
      >
        <X size={11} />
      </button>
    </span>
  )
}

export function ContractsFilters({
  filters,
  onFiltersChange,
  entities,
  managers,
  totalCount,
  filteredCount,
}: ContractsFiltersProps) {
  const set = (partial: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...partial })

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.entity !== "all" ||
    filters.manager !== "all"

  const entityOptions = entities.map((e) => ({ value: e, label: e }))
  const managerOptions = managers.map((m) => ({ value: m, label: m }))

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filters.status)?.label
  const entityLabel = filters.entity !== "all" ? filters.entity : null
  const managerLabel = filters.manager !== "all" ? filters.manager : null

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, número, entidad…"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
          {filters.search && (
            <button
              onClick={() => set({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Estado */}
        <div className="w-full sm:w-44">
          <SelectField
            value={filters.status}
            onChange={(v) => set({ status: v })}
            options={STATUS_OPTIONS.slice(1)}
            placeholder="Estado"
          />
        </div>

        {/* Entidad */}
        {entities.length > 0 && (
          <div className="w-full sm:w-48">
            <SelectField
              value={filters.entity}
              onChange={(v) => set({ entity: v })}
              options={entityOptions}
              placeholder="Entidad"
            />
          </div>
        )}

        {/* Gerente */}
        {managers.length > 0 && (
          <div className="w-full sm:w-44">
            <SelectField
              value={filters.manager}
              onChange={(v) => set({ manager: v })}
              options={managerOptions}
              placeholder="Gerente"
            />
          </div>
        )}
      </div>

      {/* Results row + active pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active filter pills */}
          {filters.search && (
            <ActivePill
              label={`"${filters.search}"`}
              onRemove={() => set({ search: "" })}
            />
          )}
          {filters.status !== "all" && statusLabel && (
            <ActivePill
              label={statusLabel}
              onRemove={() => set({ status: "all" })}
            />
          )}
          {entityLabel && (
            <ActivePill
              label={entityLabel}
              onRemove={() => set({ entity: "all" })}
            />
          )}
          {managerLabel && (
            <ActivePill
              label={managerLabel}
              onRemove={() => set({ manager: "all" })}
            />
          )}

          {hasActiveFilters && (
            <button
              onClick={() =>
                onFiltersChange({ search: "", status: "all", entity: "all", manager: "all" })
              }
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal size={12} />
          <span>
            {hasActiveFilters ? (
              <>
                <span className="font-semibold text-foreground">{filteredCount}</span>
                {" de "}
                <span className="font-semibold text-foreground">{totalCount}</span>
                {" contrato"}
                {totalCount !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{totalCount}</span>
                {" contrato"}
                {totalCount !== 1 ? "s" : ""}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
