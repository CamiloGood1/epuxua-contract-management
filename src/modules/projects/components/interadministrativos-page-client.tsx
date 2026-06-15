"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FolderKanban, ChevronLeft, ChevronRight, Search, Plus, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import { ESTADO_CONFIG, ESTADO_ORDER } from "../lib/lifecycle"
import { formatDate } from "../lib/project-utils"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"

const PAGE_SIZE = 20

interface Props {
  projects: Interadministrativo[]
  entities: string[]
  years: number[]
}



export function InteradministrativosPageClient({ projects, entities, years }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState<EstadoInteradministrativo | "all">("all")
  const [entity, setEntity] = useState<string>("all")
  const [year, setYear] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [showNewModal, setShowNewModal] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        const match =
          p.id_contrato.toLowerCase().includes(q) ||
          (p.objeto_contrato ?? "").toLowerCase().includes(q) ||
          (p.secretaria ?? "").toLowerCase().includes(q) ||
          (p.area_responsable ?? "").toLowerCase().includes(q)
        if (!match) return false
      }
      if (estado !== "all" && p.estado !== estado) return false
      if (entity !== "all" && p.secretaria !== entity && p.area_responsable !== entity) return false
      if (year !== "all" && p.fecha_suscripcion) {
        const y = new Date(p.fecha_suscripcion).getFullYear()
        if (y !== Number(year)) return false
      }
      return true
    })
  }, [projects, search, estado, entity, year])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const hasFilters = search || estado !== "all" || entity !== "all" || year !== "all"

  function clearFilters() {
    setSearch(""); setEstado("all"); setEntity("all"); setYear("all"); setPage(0)
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const ids = filtered.map((p) => p.id).join(",")
      const res = await fetch(`/api/reports/excel/proyectos?ids=${ids}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Error al generar el Excel")
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `EPUXUA_Interadministrativos_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al descargar el Excel.")
    } finally {
      setDownloading(false)
    }
  }

  const sel = "h-9 rounded-lg border border-[#EAEAEA] bg-white pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"

  return (
    <div className="space-y-4">
      {/* Encabezado con botones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-[#EAEAEA] bg-white text-sm font-semibold text-[#0B3D91] hover:bg-[#f0f4ff] transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
        >
          <Download size={14} />
          <span className="truncate">{downloading ? "Generando…" : `Descargar Excel${hasFilters ? ` (${filtered.length})` : ""}`}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={14} />
          Nuevo Contrato Interadministrativo
        </button>
      </div>

      {/* Filtros */}
      <div className="epuxua-card p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-9 rounded-lg border border-[#EAEAEA] bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
            placeholder="Buscar por N° contrato, objeto, secretaría…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select className={sel} value={estado} onChange={(e) => { setEstado(e.target.value as EstadoInteradministrativo | "all"); setPage(0) }}>
              <option value="all">Todos los estados</option>
              {ESTADO_ORDER.map((s) => (
                <option key={s} value={s}>{ESTADO_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select className={sel} value={entity} onChange={(e) => { setEntity(e.target.value); setPage(0) }}>
              <option value="all">Todas las entidades</option>
              {entities.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="relative">
            <select className={sel} value={year} onChange={(e) => { setYear(e.target.value); setPage(0) }}>
              <option value="all">Todos los años</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpiar filtros
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto self-center">
            <strong className="text-[var(--corporate-blue)]">{filtered.length}</strong> de {projects.length} contratos
          </span>
        </div>
      </div>

      {/* Tabla */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="epuxua-card flex flex-col items-center justify-center py-20 text-center"
          >
            <FolderKanban size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No hay contratos que coincidan con los filtros.</p>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="epuxua-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">N° Contrato</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[220px]">Objeto</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Secretaría / Área</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Fecha suscripción</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Valor total</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Pdte. cobrar</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => {
                    const cfg = ESTADO_CONFIG[p.estado]
                    return (
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-[var(--corporate-blue)]">{p.id_contrato}</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="line-clamp-2">{p.objeto_contrato ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[140px] truncate">
                          {p.secretaria ?? p.area_responsable ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            cfg.bgClass, cfg.textClass, cfg.borderClass
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotClass)} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(p.fecha_suscripcion)}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                          {formatCOP(p.total_contrato)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-xs">
                          {p.valor_pendiente_cobrar != null ? formatCOP(p.valor_pendiente_cobrar) : "—"}
                        </td>
                      </tr>
                    )
                  })}
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

      <NewInteradminProjectModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        isAdmin={true}
      />
    </div>
  )
}
