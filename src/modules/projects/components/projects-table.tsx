"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react"
import { formatCOP, pct } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "./lifecycle-badge"
import { projectTypeLabel } from "../lib/project-type"
import {
  ProjectsFilters,
  applyProjectFilters,
  INITIAL_PROJECT_FILTERS,
} from "./projects-filters"
import type { ProjectDetail } from "@/types/project"

const PAGE_SIZE = 15

interface ProjectsTableProps {
  projects: ProjectDetail[]
  entities: string[]
  managers: string[]
  years: number[]
}

function entityLabel(p: ProjectDetail): string {
  return p.entity_name ?? p.secretaria ?? p.area_name ?? "—"
}

export function ProjectsTable({
  projects,
  entities,
  managers,
  years,
}: ProjectsTableProps) {
  const [filters, setFilters] = useState(INITIAL_PROJECT_FILTERS)
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () => applyProjectFilters(projects, filters),
    [projects, filters]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageItems = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  )

  return (
    <div className="space-y-4">
      <ProjectsFilters
        filters={filters}
        onChange={(f) => {
          setFilters(f)
          setPage(0)
        }}
        entities={entities}
        managers={managers}
        years={years}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} proyecto{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-xs font-medium text-muted-foreground hover:text-foreground"
            title="Exportación Excel (pendiente)"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-xs font-medium text-muted-foreground hover:text-foreground"
            title="Exportación PDF (pendiente)"
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      <div className="epuxua-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Código
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[200px]">
                  Nombre
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Tipo
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Entidad
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right">
                  Valor total
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right">
                  B/S
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right">
                  Cuota ger.
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right">
                  % ejec.
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-center">
                  Contratos
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-center">
                  Alertas
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    No hay proyectos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/60 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="font-semibold text-[var(--corporate-blue)] hover:underline"
                      >
                        {p.project_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="line-clamp-2 hover:text-[var(--corporate-blue)]"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {projectTypeLabel(p.project_type)}
                    </td>
                    <td className="px-4 py-3">
                      <LifecycleBadge status={p.lifecycle_status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[140px] truncate">
                      {entityLabel(p)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                      {formatCOP(p.total_value)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {formatCOP(p.goods_services_value)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {formatCOP(p.management_fee_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-[var(--corporate-blue)] rounded-full"
                            style={{ width: `${pct(p.execution_pct)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums w-10 text-right">
                          {pct(p.execution_pct).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {p.contracts_count ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(p.active_alerts_count ?? 0) > 0 ? (
                        <span className="inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                          {p.active_alerts_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
