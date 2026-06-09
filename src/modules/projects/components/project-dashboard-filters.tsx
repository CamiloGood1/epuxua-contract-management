"use client"

import { X, SlidersHorizontal, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LIFECYCLE_ORDER, LIFECYCLE_CONFIG } from "../lib/lifecycle"
import { ACTIVE_PROJECT_TYPE_OPTIONS } from "../lib/project-type"
import type { ProjectDashboardFilterState } from "../lib/dashboard-utils"

interface ProjectDashboardFiltersProps {
  filters: ProjectDashboardFilterState
  onChange: (f: ProjectDashboardFilterState) => void
  years: number[]
  entities: string[]
  filteredCount: number
  totalCount: number
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

export function ProjectDashboardFilters({
  filters,
  onChange,
  years,
  entities,
  filteredCount,
  totalCount,
}: ProjectDashboardFiltersProps) {
  const hasActive =
    filters.year !== "all" ||
    filters.lifecycle !== "all" ||
    filters.type !== "all" ||
    filters.entity !== "all"

  const set = (partial: Partial<ProjectDashboardFilterState>) =>
    onChange({ ...filters, ...partial })

  return (
    <div className="epuxua-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={16} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Filtros
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto sm:ml-2">
          Mostrando{" "}
          <strong className="text-[var(--corporate-blue)]">{filteredCount}</strong>
          {" de "}
          <strong>{totalCount}</strong> proyectos
        </span>
        {hasActive && (
          <button
            type="button"
            onClick={() =>
              onChange({
                year: "all",
                lifecycle: "all",
                type: "all",
                entity: "all",
              })
            }
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground ml-2"
          >
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <SelectField
          value={filters.year}
          onChange={(v) => set({ year: v })}
          placeholder="Todos los años"
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <SelectField
          value={filters.lifecycle}
          onChange={(v) => set({ lifecycle: v })}
          placeholder="Todos los estados"
          options={LIFECYCLE_ORDER.map((s) => ({
            value: s,
            label: LIFECYCLE_CONFIG[s].label,
          }))}
        />
        <SelectField
          value={filters.type}
          onChange={(v) => set({ type: v })}
          placeholder="Todos los tipos"
          options={ACTIVE_PROJECT_TYPE_OPTIONS}
        />
        <SelectField
          value={filters.entity}
          onChange={(v) => set({ entity: v })}
          placeholder="Todas las entidades"
          options={entities.map((e) => ({ value: e, label: e }))}
        />
      </div>
    </div>
  )
}
