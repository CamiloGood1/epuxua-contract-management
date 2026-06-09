"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PageShell } from "@/components/ui/page-shell"
import { ACTIVE_PROJECT_TYPE_OPTIONS } from "@/modules/projects/lib/project-type"

interface IndicatorRow {
  id: string
  indicator_name: string
  indicator_value: number | null
  target_value: number | null
  unit: string | null
  period_label: string | null
  recorded_at: string | null
  projects?: {
    project_code?: string
    name?: string
    project_type?: string
    year?: number
  } | {
    project_code?: string
    name?: string
    project_type?: string
    year?: number
  }[] | null
}

interface IndicatorsPageClientProps {
  indicators: IndicatorRow[]
  years: number[]
}

export function IndicatorsPageClient({ indicators, years }: IndicatorsPageClientProps) {
  const [year, setYear] = useState<string>("all")
  const [type, setType] = useState<string>("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return indicators.filter((ind) => {
      const p = Array.isArray(ind.projects) ? ind.projects[0] : ind.projects
      if (year !== "all" && p?.year !== Number(year)) return false
      if (type !== "all" && p?.project_type !== type) return false
      if (q) {
        const hay = [ind.indicator_name, p?.project_code, p?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [indicators, year, type, search])

  return (
    <PageShell
      title="Indicadores"
      subtitle="Indicadores de desempeño a nivel de cartera de proyectos."
      icon="analytics"
    >
      <div className="epuxua-card p-4 grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar indicador o proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-border px-3 text-sm"
        />
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-9 rounded-lg border border-border px-3 text-sm"
        >
          <option value="all">Todos los años</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 rounded-lg border border-border px-3 text-sm"
        >
          <option value="all">Todos los tipos</option>
          {ACTIVE_PROJECT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="epuxua-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Indicador</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Proyecto</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Valor</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Meta</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Periodo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No hay indicadores que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filtered.map((ind) => {
                const p = Array.isArray(ind.projects) ? ind.projects[0] : ind.projects
                return (
                  <tr key={ind.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{ind.indicator_name}</td>
                    <td className="px-4 py-3">
                      {p?.project_code ? (
                        <Link
                          href={`/proyectos?search=${encodeURIComponent(p.project_code)}`}
                          className="text-[var(--corporate-blue)] hover:underline text-xs"
                        >
                          {p.project_code}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {ind.indicator_value ?? "—"} {ind.unit ?? ""}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {ind.target_value ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ind.period_label ?? ind.recorded_at ?? "—"}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
