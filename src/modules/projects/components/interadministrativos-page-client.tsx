"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FolderKanban, ChevronLeft, ChevronRight, Search, Plus, Download,
  User, Calendar, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  XCircle, LayoutList, LayoutGrid, ChevronRight as ArrowRight,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import type { UserRole } from "@/types/project"
import type { ContractCurrentState } from "@/types/contract-current-state"
import { ESTADO_CONFIG, ESTADO_ORDER } from "../lib/lifecycle"
import { formatDate } from "../lib/project-utils"
import { canCreateProject } from "../lib/access"
import { NewInteradminProjectModal } from "./new-interadmin-project-modal"

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 18

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = "cards" | "table"

interface Props {
  projects:      Interadministrativo[]
  entities:      string[]
  years:         number[]
  userRole:      UserRole | null
  currentStates: Record<number, ContractCurrentState>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthBorderClass(health: ContractCurrentState["health"]): string {
  return health === "ROJO" ? "border-l-red-500" : health === "AMARILLO" ? "border-l-amber-400" : "border-l-emerald-500"
}

// ── Days chip (recibe días ya calculados — nunca la fecha original) ────────────

function DaysChip({ daysRemaining }: { daysRemaining: number | null }) {
  if (daysRemaining === null) return null

  if (daysRemaining < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 whitespace-nowrap">
        <XCircle size={10} /> Vencido hace {Math.abs(daysRemaining)}d
      </span>
    )
  }
  if (daysRemaining < 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 whitespace-nowrap">
        <Clock size={10} /> {daysRemaining} días
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">
      <Clock size={10} /> {daysRemaining} días
    </span>
  )
}

// ── Health badge ──────────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: ContractCurrentState["health"] }) {
  const cfg = {
    VERDE:    { label: "Saludable", Icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
    AMARILLO: { label: "Atención",  Icon: AlertTriangle, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
    ROJO:     { label: "Crítico",   Icon: XCircle,       cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  }[health]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap", cfg.cls)}>
      <cfg.Icon size={10} /> {cfg.label}
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

// ── Mod chip ──────────────────────────────────────────────────────────────────

function ModChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-(--corporate-blue)/8 text-(--corporate-blue) border border-(--corporate-blue)/20">
      {label}
    </span>
  )
}

// ── Contract Card ─────────────────────────────────────────────────────────────

function ContractCard({
  project: p,
  state,
  onClick,
}: {
  project: Interadministrativo
  state:   ContractCurrentState
  onClick: () => void
}) {
  const estadoCfg    = ESTADO_CONFIG[p.estado]
  const avance       = p.avance_fisico_pct ?? 0
  const entity       = p.secretaria ?? p.area_responsable ?? null
  const hasAdditions = state.additions > 0
  const hasExtension = state.currentEndDate !== state.originalEndDate && state.currentEndDate !== null
  const totalMods    = state.additionsCount + state.extensionsCount + state.suspensionsCount + state.restartsCount

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      className={cn(
        "epuxua-card border-l-4 overflow-hidden cursor-pointer flex flex-col",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-150",
        healthBorderClass(state.health)
      )}
    >
      {/* ── Encabezado ── */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-bold text-sm text-(--corporate-blue) whitespace-nowrap">
            {p.id_contrato}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
            estadoCfg.bgClass, estadoCfg.textClass, estadoCfg.borderClass
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", estadoCfg.dotClass)} />
            {estadoCfg.label}
          </span>
        </div>
        <HealthBadge health={state.health} />
      </div>

      {/* ── Objeto + supervisor ── */}
      <div className="px-4 pb-3">
        <p className="font-semibold text-sm leading-snug line-clamp-2">{p.objeto_contrato ?? "—"}</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground min-w-0">
          {p.supervision && (
            <>
              <User size={11} className="shrink-0" />
              <span className="truncate">{p.supervision}</span>
              {entity && <span className="shrink-0">·</span>}
            </>
          )}
          {entity && <span className="truncate">{entity}</span>}
        </div>
      </div>

      {/* ── Fechas (vigente siempre visible; original como referencia si cambió) ── */}
      <div className="px-4 py-2 border-t border-border/40 space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={11} />
            <span>Suscripción: <strong className="text-foreground">{formatDate(p.fecha_suscripcion)}</strong></span>
          </div>
          <DaysChip daysRemaining={state.daysRemaining} />
        </div>

        {/* Fecha vigente (siempre) */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Terminación:</span>
          <strong className="text-foreground">{formatDate(state.currentEndDate)}</strong>
          {hasExtension && state.extensionsCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ({state.extensionsCount} prórroga{state.extensionsCount !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        {/* Fecha original como referencia si difiere de la vigente */}
        {hasExtension && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Original: {formatDate(state.originalEndDate)}</span>
          </div>
        )}
      </div>

      {/* ── Barra de ejecución ── */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp size={11} /> Ejecución física
          </span>
          <span className="font-bold">{avance.toFixed(0)}%</span>
        </div>
        <ProgressBar pct={avance} />
      </div>

      {/* ── Valores (vigente siempre; original + adiciones si hay adiciones) ── */}
      <div className="px-4 py-2.5 border-t border-border/40">
        {hasAdditions ? (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Original</p>
              <p className="font-medium tabular-nums">{formatCOP(state.originalValue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 flex items-center gap-0.5">
                <TrendingUp size={10} /> Adiciones
              </p>
              <p className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatCOP(state.additions)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 font-semibold">Vigente</p>
              <p className="font-bold tabular-nums text-foreground">{formatCOP(state.currentValue)}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Valor vigente</p>
              <p className="font-bold tabular-nums">{formatCOP(state.currentValue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Pdte. cobrar</p>
              <p className="font-bold tabular-nums">
                {p.valor_pendiente_cobrar != null ? formatCOP(p.valor_pendiente_cobrar) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Pendiente por cobrar cuando hay desglose de adiciones */}
        {hasAdditions && p.valor_pendiente_cobrar != null && (
          <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pendiente por cobrar</span>
            <span className="font-semibold tabular-nums">{formatCOP(p.valor_pendiente_cobrar)}</span>
          </div>
        )}
      </div>

      {/* ── Footer: chips de modificaciones + flecha ── */}
      <div className="px-4 pb-3 pt-2 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
        {totalMods === 0 ? (
          <span className="text-[10px] text-muted-foreground">Sin modificaciones</span>
        ) : (
          <>
            {state.additionsCount   > 0 && <ModChip label={`${state.additionsCount} adición${state.additionsCount   !== 1 ? "es" : ""}`} />}
            {state.extensionsCount  > 0 && <ModChip label={`${state.extensionsCount} prórroga${state.extensionsCount  !== 1 ? "s" : ""}`} />}
            {state.suspensionsCount > 0 && <ModChip label={`${state.suspensionsCount} suspensión${state.suspensionsCount !== 1 ? "es" : ""}`} />}
            {state.restartsCount    > 0 && <ModChip label={`${state.restartsCount} reinicio${state.restartsCount    !== 1 ? "s" : ""}`} />}
          </>
        )}
        <ArrowRight size={14} className="ml-auto text-muted-foreground shrink-0" />
      </div>
    </div>
  )
}

// ── Table Row ─────────────────────────────────────────────────────────────────

function ContractTableRow({
  project: p,
  state,
  onClick,
}: {
  project: Interadministrativo
  state:   ContractCurrentState
  onClick: () => void
}) {
  const estadoCfg    = ESTADO_CONFIG[p.estado]
  const hasExtension = state.currentEndDate !== state.originalEndDate && state.currentEndDate !== null

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      className="border-b border-border/60 hover:bg-muted/20 transition-colors cursor-pointer"
    >
      {/* Indicador de salud */}
      <td className="pl-3 pr-1 py-3 w-1">
        <div className={cn(
          "w-1 h-8 rounded-full",
          state.health === "ROJO" ? "bg-red-500" : state.health === "AMARILLO" ? "bg-amber-400" : "bg-emerald-500"
        )} />
      </td>

      {/* N° contrato */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-semibold text-sm text-(--corporate-blue)">{p.id_contrato}</span>
      </td>

      {/* Objeto + supervisor */}
      <td className="px-4 py-3 max-w-xs">
        <span className="line-clamp-2 text-sm">{p.objeto_contrato ?? "—"}</span>
        {p.supervision && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <User size={10} /> {p.supervision}
          </span>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
          estadoCfg.bgClass, estadoCfg.textClass, estadoCfg.borderClass
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", estadoCfg.dotClass)} />
          {estadoCfg.label}
        </span>
      </td>

      {/* Fechas: vigente siempre; original tachada si cambió */}
      <td className="px-4 py-3 text-xs whitespace-nowrap">
        <div className="text-muted-foreground">{formatDate(p.fecha_suscripcion)}</div>
        <div className="font-medium">{formatDate(state.currentEndDate)}</div>
        {hasExtension && (
          <div className="text-[10px] text-muted-foreground line-through">{formatDate(state.originalEndDate)}</div>
        )}
      </td>

      {/* Valor vigente */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="font-bold tabular-nums text-sm">{formatCOP(state.currentValue)}</div>
        {state.additions > 0 && (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatCOP(state.additions)}
          </div>
        )}
      </td>

      {/* Pdte. cobrar */}
      <td className="px-4 py-3 text-right tabular-nums text-xs whitespace-nowrap">
        {p.valor_pendiente_cobrar != null ? formatCOP(p.valor_pendiente_cobrar) : "—"}
      </td>

      {/* Ejecución */}
      <td className="px-4 py-3 min-w-20">
        <ProgressBar pct={p.avance_fisico_pct ?? 0} />
        <span className="text-[10px] text-muted-foreground tabular-nums">{(p.avance_fisico_pct ?? 0).toFixed(0)}%</span>
      </td>

      {/* Días */}
      <td className="px-4 py-3">
        <DaysChip daysRemaining={state.daysRemaining} />
      </td>

      {/* Mods */}
      <td className="px-4 py-3">
        <div className="flex gap-1 flex-wrap">
          {state.additionsCount   > 0 && <ModChip label={`${state.additionsCount}A`}   />}
          {state.extensionsCount  > 0 && <ModChip label={`${state.extensionsCount}P`}  />}
          {state.suspensionsCount > 0 && <ModChip label={`${state.suspensionsCount}S`} />}
          {state.restartsCount    > 0 && <ModChip label={`${state.restartsCount}R`}    />}
        </div>
      </td>

      <td className="px-3 py-3">
        <ArrowRight size={14} className="text-muted-foreground" />
      </td>
    </tr>
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
  return (
    <div className={tableMode
      ? "flex items-center justify-between px-4 py-3 border-t border-border"
      : "flex items-center justify-between px-1 py-3"
    }>
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

// ── Main Component ────────────────────────────────────────────────────────────

export function InteradministrativosPageClient({
  projects, entities, years, userRole, currentStates,
}: Props) {
  const router = useRouter()
  const [search, setSearch]             = useState("")
  const [estado, setEstado]             = useState<EstadoInteradministrativo | "all">("all")
  const [entity, setEntity]             = useState<string>("all")
  const [year, setYear]                 = useState<string>("all")
  const [page, setPage]                 = useState(0)
  const [showNewModal, setShowNewModal] = useState(false)
  const [downloading, setDownloading]   = useState(false)
  const [viewMode, setViewMode]         = useState<ViewMode>("cards")

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

  const selCls = "h-9 rounded-lg border border-border bg-background pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-(--corporate-blue)/20"

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        {/* Vista */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button type="button" onClick={() => setViewMode("cards")}
            className={cn("px-3 py-2 text-sm transition-colors", viewMode === "cards"
              ? "bg-(--corporate-blue) text-white"
              : "bg-background text-muted-foreground hover:bg-muted")}
            title="Vista de tarjetas">
            <LayoutGrid size={15} />
          </button>
          <button type="button" onClick={() => setViewMode("table")}
            className={cn("px-3 py-2 text-sm transition-colors border-l border-border", viewMode === "table"
              ? "bg-(--corporate-blue) text-white"
              : "bg-background text-muted-foreground hover:bg-muted")}
            title="Vista de tabla">
            <LayoutList size={15} />
          </button>
        </div>

        <button type="button" onClick={handleDownload}
          disabled={downloading || filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-(--corporate-blue) hover:bg-muted transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto">
          <Download size={14} />
          <span className="truncate">{downloading ? "Generando…" : `Descargar Excel${hasFilters ? ` (${filtered.length})` : ""}`}</span>
        </button>

        {canCreate && (
          <button type="button" onClick={() => setShowNewModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-(--corporate-blue) text-white text-sm font-semibold hover:bg-[#002869] transition-colors shadow-sm w-full sm:w-auto">
            <Plus size={14} />
            Nuevo Contrato Interadministrativo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="epuxua-card p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-(--corporate-blue)/20"
            placeholder="Buscar por N° contrato, objeto, secretaría, supervisor…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <select className={selCls} value={estado}
              onChange={(e) => { setEstado(e.target.value as EstadoInteradministrativo | "all"); setPage(0) }}>
              <option value="all">Todos los estados</option>
              {ESTADO_ORDER.map((s) => <option key={s} value={s}>{ESTADO_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div className="relative">
            <select className={selCls} value={entity}
              onChange={(e) => { setEntity(e.target.value); setPage(0) }}>
              <option value="all">Todas las entidades</option>
              {entities.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="relative">
            <select className={selCls} value={year}
              onChange={(e) => { setYear(e.target.value); setPage(0) }}>
              <option value="all">Todos los años</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline">
              Limpiar filtros
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto self-center">
            <strong className="text-(--corporate-blue)">{filtered.length}</strong> de {projects.length} contratos
          </span>
        </div>
      </div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
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
                  state={currentStates[p.id] ?? fallbackState(p.id)}
                  onClick={() => router.push(`/proyectos/${p.id}`)}
                />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} total={filtered.length}
              onPrev={() => setPage((n) => n - 1)} onNext={() => setPage((n) => n + 1)} />
          </motion.div>

        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="epuxua-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="pl-3 pr-1 py-3 w-2" />
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">N° Contrato</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-52">Objeto / Supervisor</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Fechas</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Valor vigente</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Pdte. cobrar</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap min-w-25">Ejecución</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Vencimiento</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Mods.</th>
                    <th className="px-3 py-3 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <ContractTableRow
                      key={p.id}
                      project={p}
                      state={currentStates[p.id] ?? fallbackState(p.id)}
                      onClick={() => router.push(`/proyectos/${p.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} total={filtered.length}
              onPrev={() => setPage((n) => n - 1)} onNext={() => setPage((n) => n + 1)} tableMode />
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

// Fallback seguro si por algún motivo un ID no tiene estado calculado
function fallbackState(contractId: number): ContractCurrentState {
  return {
    contractId,
    originalValue: 0, additions: 0, currentValue: 0,
    originalEndDate: null, currentEndDate: null,
    additionsCount: 0, extensionsCount: 0, suspensionsCount: 0, restartsCount: 0,
    daysRemaining: null, health: "VERDE",
  }
}
