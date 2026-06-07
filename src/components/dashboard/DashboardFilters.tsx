"use client"

import { X, SlidersHorizontal, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_OPTIONS } from "@/modules/contracts/lib/status"
import type { DashboardFilterState } from "./dashboard-utils"

interface DashboardFiltersProps {
  filters: DashboardFilterState
  onChange: (f: DashboardFilterState) => void
  years: number[]
  mainCount: number
  derivedCount: number
}

const SEGMENTS: { value: DashboardFilterState["segment"]; label: string }[] = [
  { value: "both", label: "Ambos" },
  { value: "contratos", label: "Contratos EPUXUA" },
  { value: "derivados", label: "Derivados" },
]

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
    <div className="relative min-w-[130px] flex-1 sm:flex-none">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-[#EAEAEA] bg-white pl-3 pr-8 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20",
          value !== "all" && "border-[var(--corporate-blue)]/30 bg-[#f6f8fc]"
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

export function DashboardFilters({
  filters,
  onChange,
  years,
  mainCount,
  derivedCount,
}: DashboardFiltersProps) {
  const hasActive =
    filters.year !== "all" || filters.status !== "all" || filters.segment !== "both"

  return (
    <div className="epuxua-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={16} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Filtros
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto sm:ml-2">
          Contratos: <strong className="text-[var(--corporate-blue)]">{mainCount}</strong>
          {" · "}
          Derivados: <strong className="text-[var(--institutional-gold)]">{derivedCount}</strong>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <div className="flex rounded-lg border border-[#EAEAEA] p-0.5 bg-[#f6f8fc] w-full sm:w-auto">
          {SEGMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ ...filters, segment: s.value })}
              className={cn(
                "flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                filters.segment === s.value
                  ? "bg-white text-[var(--corporate-blue)] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <SelectField
          value={filters.year}
          onChange={(year) => onChange({ ...filters, year })}
          placeholder="Todos los años"
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
        />

        <SelectField
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          placeholder="Todos los estados"
          options={STATUS_OPTIONS.filter((o) => o.value !== "all")}
        />

        {hasActive && (
          <button
            type="button"
            onClick={() =>
              onChange({ year: "all", status: "all", segment: "both" })
            }
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-[#EAEAEA] bg-white"
          >
            <X size={13} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
