"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { LIFECYCLE_ORDER, LIFECYCLE_CONFIG } from "../lib/lifecycle"
import { PROJECT_TYPE_OPTIONS } from "../lib/project-type"

export interface ProjectFilterState {
  search: string
  lifecycle: string
  type: string
  year: string
  entity: string
  manager: string
}

export const INITIAL_PROJECT_FILTERS: ProjectFilterState = {
  search: "",
  lifecycle: "all",
  type: "all",
  year: "all",
  entity: "all",
  manager: "all",
}

interface ProjectsFiltersProps {
  filters: ProjectFilterState
  onChange: (filters: ProjectFilterState) => void
  entities: string[]
  managers: string[]
  years: number[]
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-lg border border-border bg-white px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ProjectsFilters({
  filters,
  onChange,
  entities,
  managers,
  years,
}: ProjectsFiltersProps) {
  const set = (key: keyof ProjectFilterState, value: string) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="epuxua-card p-4 space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por código, nombre, entidad o gerente..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="pl-9 h-10"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <SelectField
          label="Estado"
          value={filters.lifecycle}
          onChange={(v) => set("lifecycle", v)}
          options={[
            { value: "all", label: "Todos los estados" },
            ...LIFECYCLE_ORDER.map((s) => ({
              value: s,
              label: LIFECYCLE_CONFIG[s].label,
            })),
          ]}
        />
        <SelectField
          label="Tipo"
          value={filters.type}
          onChange={(v) => set("type", v)}
          options={[{ value: "all", label: "Todos los tipos" }, ...PROJECT_TYPE_OPTIONS]}
        />
        <SelectField
          label="Año"
          value={filters.year}
          onChange={(v) => set("year", v)}
          options={[
            { value: "all", label: "Todos los años" },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
        />
        <SelectField
          label="Entidad"
          value={filters.entity}
          onChange={(v) => set("entity", v)}
          options={[
            { value: "all", label: "Todas las entidades" },
            ...entities.map((e) => ({ value: e, label: e })),
          ]}
        />
        <SelectField
          label="Gerente"
          value={filters.manager}
          onChange={(v) => set("manager", v)}
          options={[
            { value: "all", label: "Todos los gerentes" },
            ...managers.map((m) => ({ value: m, label: m })),
          ]}
        />
      </div>
    </div>
  )
}

export function applyProjectFilters<T extends {
  project_code: string
  name: string
  lifecycle_status: string
  project_type: string
  year: number
  area_name?: string | null
  secretaria?: string | null
  manager_name?: string | null
}>(
  projects: T[],
  filters: ProjectFilterState
): T[] {
  const q = filters.search.toLowerCase().trim()

  return projects.filter((p) => {
    if (q) {
      const haystack = [
        p.project_code,
        p.name,
        p.area_name,
        p.secretaria,
        p.manager_name,
        String(p.year),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (filters.lifecycle !== "all" && p.lifecycle_status !== filters.lifecycle) return false
    if (filters.type !== "all" && p.project_type !== filters.type) return false
    if (filters.year !== "all" && p.year !== Number(filters.year)) return false
    if (filters.entity !== "all") {
      const entity = p.secretaria ?? p.area_name
      if (entity !== filters.entity) return false
    }
    if (filters.manager !== "all" && p.manager_name !== filters.manager) return false
    return true
  })
}
