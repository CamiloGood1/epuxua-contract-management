"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FolderKanban, ChevronLeft, ChevronRight, Search, Plus, Download,
  User, Calendar, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  XCircle, LayoutList, LayoutGrid, ChevronRight as ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import type { UserRole } from "@/types/project"
import type { ModCounts } from "@/app/(app)/proyectos/page"
import { ESTADO_CONFIG, ESTADO_ORDER } from "../lib/lifecycle"
import { formatDate } from "../lib/project-utils"
import { canCreateProject } from "../lib/access"
import { calcInteradminFinancials } from "../lib/interadmin-financials"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 18

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthLevel = "VERDE" | "AMARILLO" | "ROJO"
type ViewMode    = "cards" | "table"

interface Props {
  projects:  Interadministrativo[]
  entities:  string[]
  years:     number[]
  userRole:  UserRole | null
  modCounts: ModCounts
}

// ── Health calculation (based on available fields, no extra queries) ───────────

function calcHealth(p: Interadministrativo): HealthLevel {
  const terminal = new Set(["TERMINADO", "LIQUIDADO", "TERMINADO ANTICIPADAMENTE"] as EstadoInteradministrativo[])
  if (terminal.has(p.estado)) return "VERDE"
  if (p.estado === "SUSPENDIDO") return "AMARILLO"
  if (p.estado === "PLANEACIÓN" || p.estado === "CONTRATACIÓN") return "VERDE"

  if (!p.fecha_terminacion) return "VERDE"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end          = new Date(p.fecha_terminacion.slice(0, 10) + "T00:00:00")
  const daysLeft     = Math.floor((end.getTime() - today.getTime()) / 86400000)
  const avance       = p.avance_fisico_pct ?? 0

  if (daysLeft < 0) return "ROJO"
  if (daysLeft < 15) return "ROJO"
  if (daysLeft < 30) return "AMARILLO"
  if (daysLeft < 60 && avance < 40) return "AMARILLO"
  return "VERDE"
}

// ── Days remaining chip ───────────────────────────────────────────────────────

function DaysChip({ fecha }: { fecha: string | null }) {
  if (!fecha) return <span className="text-xs text-muted-foreground">Sin fecha fin</span>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end   = new Date(fecha.slice(0, 10) + "T00:00:00")
  const days  = Math.floor((end.getTime() - today.getTime()) / 86400000)

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <XCircle size={10} /> Vencido hace {Math.abs(days)}d
      </span>
    )
  }
  if (days < 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <Clock size={10} /> {days} días
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Clock size={10} /> {days} días
    </span>
  )
}

// ── Health badge ──────────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: HealthLevel }) {
  const cfg = {
    VERDE:    { label: "Saludable", Icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
    AMARILLO: { label: "Atención",  Icon: AlertTriangle, className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
    ROJO:     { label: "Crítico",   Icon: XCircle,       className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  }[health]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.className)}>
      <cfg.Icon size={10} /> {cfg.label}
    </span>
  )
}

// ── Health border color ───────────────────────────────────────────────────────

function healthBorder(h: HealthLevel) {
  return h === "ROJO" ? "border-l-red-500" : h === "AMARILLO" ? "border-l-amber-400" : "border-l-emerald-500"
}

// ── Mod chips ─────────────────────────────────────────────────────────────────

function ModChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--corporate-blue)]/8 text-[var(--corporate-blue)] border border-[var(--corporate-blue)]/20">
      {label}
    </span>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color   = clamped >= 70 ? "bg-emerald-500" : clamped >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${clamped}%` }} />
    </div>
  )
}

// ── Contract Card ─────────────────────────────────────────────────────────────

function ContractCard({
  project: p,
  counts,
  onClick,
}: {
  project:  Interadministrativo
  counts:   { adiciones: number; prorrogas: number; suspensiones: number; reinicios: number }
  onClick:  () => void
}) {
  const health   = calcHealth(p)
  const estadoCfg = ESTADO_CONFIG[p.estado]
  const avance   = p.avance_fisico_pct ?? 0

  const fin = calcInteradminFinancials({
    valor_inicial:      p.valor_inicial,
    cuota_admin_inicial: p.cuota_admin_inicial,
    total_contrato:     p.total_contrato,
    adicion_legacy:     p.adicion,
  })

  const totalMods = counts.adiciones + counts.prorrogas + counts.suspensiones + counts.reinicios
  const entity    = p.secretaria ?? p.area_responsable ?? null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      className={cn(
        "epuxua-card border-l-4 overflow-hidden cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-150",
        "flex flex-col",
        healthBorder(health)
      )}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-bold text-sm text-[var(--corporate-blue)] whitespace-nowrap">
            {p.id_contrato}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
            estadoCfg.bgClass, estadoCfg.textClass, estadoCfg.borderClass
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", estadoCfg.dotClass)} />
            {estadoCfg.label}
          </span>
        </div>
        <HealthBadge health={health} />
      </div>

      {/* Object + entity/supervisor */}
      <div className="px-4 pb-3">
        <p className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
          {p.objeto_contrato ?? "—"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground min-w-0">
          {p.supervision && (
            <>
              <User size={11} className="flex-shrink-0" />
              <span className="truncate">{p.supervision}</span>
              {entity && <span className="flex-shrink-0">·</span>}
            </>
          )}
          {entity && <span className="truncate">{entity}</span>}
        </div>
      </div>

      {/* Dates row */}
      <div className="px-4 py-2 border-t border-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={11} />
          <span>{formatDate(p.fecha_suscripcion)}</span>
          {p.fecha_terminacion && (
            <>
              <span>→</span>
              <span className="font-medium text-foreground">{formatDate(p.fecha_terminacion)}</span>
            </>
          )}
        </div>
        <DaysChip fecha={p.fecha_terminacion} />
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp size={11} /> Ejecución física
          </span>
          <span className="font-bold">{avance.toFixed(0)}%</span>
        </div>
        <ProgressBar pct={avance} />
      </div>

      {/* Financials */}
      <div className="px-4 py-2.5 border-t border-border/40 grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground mb-0.5">Valor vigente</p>
          <p className="font-bold tabular-nums text-foreground">{formatCOP(fin.valorTotalActual)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Pdte. cobrar</p>
          <p className="font-bold tabular-nums text-foreground">
            {p.valor_pendiente_cobrar != null ? formatCOP(p.valor_pendiente_cobrar) : "—"}
          </p>
        </div>
      </div>

      {/* Footer: mod chips + arrow */}
      <div className="px-4 pb-3 pt-2 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
        {totalMods === 0 ? (
          <span className="text-[10px] text-muted-foreground">Sin modificaciones</span>
        ) : (
          <>
            {counts.adiciones   > 0 && <ModChip label={`${counts.adiciones} adición${counts.adiciones   !== 1 ? "es" : ""}`} />}
            {counts.prorrogas   > 0 && <ModChip label={`${counts.prorrogas} prórroga${counts.prorrogas   !== 1 ? "s" : ""}`} />}
            {counts.suspensiones > 0 && <ModChip label={`${counts.suspensiones} suspensión${counts.suspensiones !== 1 ? "es" : ""}`} />}
            {counts.reinicios   > 0 && <ModChip label={`${counts.reinicios} reinicio${counts.reinicios   !== 1 ? "s" : ""}`} />}
          </>
        )}
        <ArrowRight size={14} className="ml-auto text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  )
}

// ── Table Row (compact view) ──────────────────────────────────────────────────

function ContractTableRow({
  project: p,
  counts,
  onClick,
}: {
  project: Interadministrativo
  counts:  { adiciones: number; prorrogas: number; suspensiones: number; reinicios: number }
  onClick: () => void
}) {
  const health    = calcHealth(p)
  const estadoCfg = ESTADO_CONFIG[p.estado]
  const fin       = calcInteradminFinancials({
    valor_inicial:       p.valor_inicial,
    cuota_admin_inicial: p.cuota_admin_inicial,
    total_contrato:      p.total_contrato,
    adicion_legacy:      p.adicion,
  })

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() }
      }}
      className="border-b border-border/60 hover:bg-muted/20 transition-colors cursor-pointer"
    >
      {/* Health indicator */}
      <td className="pl-3 pr-1 py-3 w-1">
        <div className={cn("w-1 h-8 rounded-full", health === "ROJO" ? "bg-red-500" : health === "AMARILLO" ? "bg-amber-400" : "bg-emerald-500")} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-semibold text-[var(--corporate-blue)]">{p.id_contrato}</span>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <span className="line-clamp-2 text-sm">{p.objeto_contrato ?? "—"}</span>
        {p.supervision && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <User size={10} /> {p.supervision}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
          estadoCfg.bgClass, estadoCfg.textClass, estadoCfg.borderClass
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", estadoCfg.dotClass)} />
          {estadoCfg.label}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs">
        <div>{formatDate(p.fecha_suscripcion)}</div>
        {p.fecha_terminacion && (
          <div className="text-muted-foreground">→ {formatDate(p.fecha_terminacion)}</div>
        )}
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap text-sm">
        {formatCOP(fin.valorTotalActual)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-xs">
        {p.valor_pendiente_cobrar != null ? formatCOP(p.valor_pendiente_cobrar) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1 min-w-[80px]">
          <ProgressBar pct={p.avance_fisico_pct ?? 0} />
          <span className="text-[10px] text-muted-foreground text-right">{(p.avance_fisico_pct ?? 0).toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1 flex-wrap">
          {counts.adiciones   > 0 && <ModChip label={`${counts.adiciones}A`}   />}
          {counts.prorrogas   > 0 && <ModChip label={`${counts.prorrogas}P`}   />}
          {counts.suspensiones > 0 && <ModChip label={`${counts.suspensiones}S`} />}
          {counts.reinicios   > 0 && <ModChip label={`${counts.reinicios}R`}   />}
        </div>
      </td>
      <td className="px-3 py-3">
        <ArrowRight size={14} className="text-muted-foreground" />
      </td>
    </tr>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function InteradministrativosPageClient({ projects, entities, years, userRole, modCounts }: Props) {
  const router = useRouter()
  const [search, setSearch]         = useState("")
  const [estado, setEstado]         = useState<EstadoInteradministrativo | "all">("all")
  const [entity, setEntity]         = useState<string>("all")
  const [year, setYear]             = useState<string>("all")
  const [page, setPage]             = useState(0)
  const [showNewModal, setShowNewModal] = useState(false)
  const [downloading, setDownloading]   = useState(false)
  const [viewMode, setViewMode]     = useState<ViewMode>("cards")

  const canCreate = canCreateProject(userRole)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        const match =
          p.id_contrato.toLowerCase().includes(q) ||
          (p.objeto_contrato ?? "").toLowerCase().includes(q) ||
          (p.secretaria ?? "").toLowerCase().includes(q) ||
          (p.area_responsable ?? "").toLowerCase().includes(q) ||
          (p.supervision ?? "").toLowerCase().includes(q)
        if (!match) return false
      }
      if (estado !== "all" && p.estado !== estado) return false
      if (entity !== "all" && p.secretaria !== entity && p.area_responsable !== entity) return false
      if (year !== "all" && p.fecha_suscripcion) {
        if (new Date(p.fecha_suscripcion).getFullYear() !== Number(year)) return false
      }
      return true
    })
  }, [projects, search, estado, entity, year])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageItems   = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const hasFilters  = !!(search || estado !== "all" || entity !== "all" || year !== "all")

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

  const selCls = "h-9 rounded-lg border border-border bg-background pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn("px-3 py-2 text-sm transition-colors", viewMode === "cards" ? "bg-[var(--corporate-blue)] text-white" : "bg-background text-muted-foreground hover:bg-muted")}
            title="Vista de tarjetas"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn("px-3 py-2 text-sm transition-colors border-l border-border", viewMode === "table" ? "bg-[var(--corporate-blue)] text-white" : "bg-background text-muted-foreground hover:bg-muted")}
            title="Vista de tabla"
          >
            <LayoutList size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-[var(--corporate-blue)] hover:bg-muted transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
        >
          <Download size={14} />
          <span className="truncate">{downloading ? "Generando…" : `Descargar Excel${hasFilters ? ` (${filtered.length})` : ""}`}</span>
        </button>

        {canCreate && (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-sm font-semibold hover:bg-[#002869] transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus size={14} />
            Nuevo Contrato Interadministrativo
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="epuxua-card p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
            placeholder="Buscar por N° contrato, objeto, secretaría, supervisor…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <select className={selCls} value={estado} onChange={(e) => { setEstado(e.target.value as EstadoInteradministrativo | "all"); setPage(0) }}>
              <option value="all">Todos los estados</option>
              {ESTADO_ORDER.map((s) => <option key={s} value={s}>{ESTADO_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div className="relative">
            <select className={selCls} value={entity} onChange={(e) => { setEntity(e.target.value); setPage(0) }}>
              <option value="all">Todas las entidades</option>
              {entities.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="relative">
            <select className={selCls} value={year} onChange={(e) => { setYear(e.target.value); setPage(0) }}>
              <option value="all">Todos los años</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
              Limpiar filtros
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto self-center">
            <strong className="text-[var(--corporate-blue)]">{filtered.length}</strong> de {projects.length} contratos
          </span>
        </div>
      </div>

      {/* Content */}
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
        ) : viewMode === "cards" ? (
          <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pageItems.map((p) => (
                <ContractCard
                  key={p.id}
                  project={p}
                  counts={modCounts[p.id] ?? { adiciones: 0, prorrogas: 0, suspensiones: 0, reinicios: 0 }}
                  onClick={() => router.push(`/proyectos/${p.id}`)}
                />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} total={filtered.length} onPrev={() => setPage((n) => n - 1)} onNext={() => setPage((n) => n + 1)} />
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="epuxua-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="pl-3 pr-1 py-3 w-2" />
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">N° Contrato</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[220px]">Objeto / Supervisor</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Fechas</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Valor vigente</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Pdte. cobrar</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap min-w-[100px]">Ejecución</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Mods.</th>
                    <th className="px-3 py-3 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <ContractTableRow
                      key={p.id}
                      project={p}
                      counts={modCounts[p.id] ?? { adiciones: 0, prorrogas: 0, suspensiones: 0, reinicios: 0 }}
                      onClick={() => router.push(`/proyectos/${p.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} total={filtered.length} onPrev={() => setPage((n) => n - 1)} onNext={() => setPage((n) => n + 1)} tableMode />
          </motion.div>
        )}
      </AnimatePresence>

      {canCreate && (
        <NewInteradminProjectModal
          open={showNewModal}
          onClose={() => setShowNewModal(false)}
          isAdmin={true}
        />
      )}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  currentPage, totalPages, total, onPrev, onNext, tableMode,
}: {
  currentPage: number; totalPages: number; total: number
  onPrev: () => void; onNext: () => void; tableMode?: boolean
}) {
  if (totalPages <= 1) return null
  const wrapper = tableMode
    ? "flex items-center justify-between px-4 py-3 border-t border-border"
    : "flex items-center justify-between px-1 py-3"
  return (
    <div className={wrapper}>
      <span className="text-xs text-muted-foreground">
        Página {currentPage + 1} de {totalPages} · {total} contratos
      </span>
      <div className="flex gap-1">
        <button type="button" disabled={currentPage === 0} onClick={onPrev}
          className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted">
          <ChevronLeft size={16} />
        </button>
        <button type="button" disabled={currentPage >= totalPages - 1} onClick={onNext}
          className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
