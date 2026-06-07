"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutGrid,
  LayoutList,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP, pct } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "./lifecycle-badge"
import { ProjectCard } from "./project-card"
import { projectTypeLabel } from "../lib/project-type"
import {
  ProjectsFilters,
  applyProjectFilters,
  INITIAL_PROJECT_FILTERS,
} from "./projects-filters"
import type { ProjectDetail } from "@/types/project"
import { projectEntityLabel, projectContractsCount } from "../lib/project-utils"

type ViewMode = "list" | "grid"

const PAGE_SIZE = 15

interface ProjectsPageClientProps {
  projects: ProjectDetail[]
  entities: string[]
  managers: string[]
  years: number[]
}

export function ProjectsPageClient({
  projects,
  entities,
  managers,
  years,
}: ProjectsPageClientProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("list")
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} proyecto{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-[var(--corporate-blue)] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={view === "list"}
            >
              <LayoutList size={14} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                view === "grid"
                  ? "bg-[var(--corporate-blue)] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={view === "grid"}
            >
              <LayoutGrid size={14} />
              Tarjetas
            </button>
          </div>

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

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="epuxua-card flex flex-col items-center justify-center py-20 text-center"
          >
            <FolderKanban size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay proyectos que coincidan con los filtros.
            </p>
          </motion.div>
        ) : view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="epuxua-card overflow-hidden"
          >
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
                      % ejec.
                    </th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-center">
                      Derivados
                    </th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-center">
                      Alertas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr
                      key={p.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/proyectos/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          router.push(`/proyectos/${p.id}`)
                        }
                      }}
                      className="border-b border-border/60 hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[var(--corporate-blue)]">
                          {p.project_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="line-clamp-2">{p.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {projectTypeLabel(p.project_type)}
                      </td>
                      <td className="px-4 py-3">
                        <LifecycleBadge status={p.lifecycle_status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[140px] truncate">
                        {projectEntityLabel(p)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                        {formatCOP(p.total_value)}
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
                        {(p.derived_count ?? 0) > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-[var(--institutional-gold)]/15 text-[var(--institutional-gold)] text-[10px] font-bold">
                            {p.derived_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
                  ))}
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
                    onClick={() => setPage((n) => n - 1)}
                    className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage((n) => n + 1)}
                    className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
