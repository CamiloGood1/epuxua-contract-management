"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, ExternalLink, CheckCircle2, Play } from "lucide-react"
import { startTarea, completeTarea } from "@/services/seguimiento.actions"
import { getKanbanColumn, getDaysLabel, PRIORIDAD_CFG } from "@/types/seguimiento"
import type { TareaKanban, KanbanColumn, TareaPrioridad } from "@/types/seguimiento"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
}

function PrioridadBadge({ p }: { p: TareaPrioridad }) {
  const c = PRIORIDAD_CFG[p]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  )
}

// ── Complete modal (inline mini) ──────────────────────────────────────────────

function QuickCompleteModal({ tarea, onClose }: { tarea: TareaKanban; onClose: () => void }) {
  const router = useRouter()
  const [enlace, setEnlace]    = useState("")
  const [error, setError]      = useState<string | null>(null)
  const [isPending, start]     = useTransition()

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await completeTarea({
        id: tarea.id,
        interadministrativo_id: tarea.interadministrativo_id,
        enlace_evidencia_cierre: enlace,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#002869]">Completar: {tarea.nombre}</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-[#747783] mb-1">Enlace Evidencia <span className="text-red-500">*</span></label>
            <input type="url" value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://drive.google.com/…"
              className="w-full h-9 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 h-9 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {isPending ? "Cerrando…" : "Completar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  tarea, canEdit, onComplete,
}: { tarea: TareaKanban; canEdit: boolean; onComplete: () => void }) {
  const [starting, startT] = useTransition()
  const router = useRouter()
  const col  = getKanbanColumn(tarea)
  const days = getDaysLabel(tarea)

  async function handleStart() {
    startT(async () => {
      const res = await startTarea(tarea.id, tarea.interadministrativo_id)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#EAEAEA] p-3.5 space-y-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-xs font-semibold text-[#151c27] leading-snug flex-1 line-clamp-2">{tarea.nombre}</p>
        <PrioridadBadge p={tarea.prioridad} />
      </div>

      {/* Contrato */}
      {tarea.id_contrato && (
        <p className="text-[10px] text-[#0B3D91] font-mono font-semibold">{tarea.id_contrato}</p>
      )}

      {/* Responsable + fecha */}
      <div className="flex items-center justify-between text-[10px] text-[#747783]">
        <span className="truncate">{tarea.responsable}</span>
        <span className="flex items-center gap-1 shrink-0"><Clock size={9} />{fmtDate(tarea.fecha_compromiso)}</span>
      </div>

      {/* Días label */}
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${days.color} ${days.bg}`}>
        {(col === "VENCIDA" || col === "PROXIMA_VENCER") && <AlertTriangle size={9} />}
        {days.text}
      </div>

      {/* Evidencia completada */}
      {tarea.status === "COMPLETADA" && tarea.enlace_evidencia_cierre && (
        <a href={tarea.enlace_evidencia_cierre} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-[#0B3D91] hover:underline">
          <ExternalLink size={9} />Ver evidencia
        </a>
      )}

      {/* Acciones */}
      {canEdit && tarea.status !== "COMPLETADA" && (
        <div className="flex gap-1.5 pt-1 border-t border-[#EAEAEA]">
          {tarea.status === "PENDIENTE" && (
            <button onClick={handleStart} disabled={starting}
              className="flex-1 h-7 rounded border border-[#0B3D91]/30 text-[#0B3D91] text-[10px] font-semibold hover:bg-[#f0f3ff] disabled:opacity-50 flex items-center justify-center gap-1">
              <Play size={9} />Iniciar
            </button>
          )}
          <button onClick={onComplete}
            className="flex-1 h-7 rounded bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 size={9} />Completar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────

const COL_CFG: Record<KanbanColumn, { label: string; headerBg: string; headerText: string; dot: string }> = {
  PENDIENTE:      { label: "Pendiente",       headerBg: "bg-slate-50",  headerText: "text-slate-700",  dot: "bg-slate-400" },
  EN_PROCESO:     { label: "En Proceso",      headerBg: "bg-blue-50",   headerText: "text-blue-700",   dot: "bg-blue-500" },
  PROXIMA_VENCER: { label: "Próx. a Vencer",  headerBg: "bg-orange-50", headerText: "text-orange-700", dot: "bg-orange-500" },
  VENCIDA:        { label: "Vencida",         headerBg: "bg-red-50",    headerText: "text-red-700",    dot: "bg-red-500" },
  COMPLETADA:     { label: "Completada",      headerBg: "bg-emerald-50",headerText: "text-emerald-700",dot: "bg-emerald-500" },
}

const COL_ORDER: KanbanColumn[] = ["PENDIENTE", "EN_PROCESO", "PROXIMA_VENCER", "VENCIDA", "COMPLETADA"]

function KanbanColumn({ col, tareas, canEdit }: { col: KanbanColumn; tareas: TareaKanban[]; canEdit: boolean }) {
  const cfg = COL_CFG[col]
  const [completeTarget, setCompleteTarget] = useState<TareaKanban | null>(null)

  return (
    <div className="flex flex-col min-w-[240px] w-full">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border border-b-0 border-[#EAEAEA] ${cfg.headerBg}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.headerText} flex-1`}>{cfg.label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.headerBg} ${cfg.headerText} border border-current/20`}>{tareas.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 border border-[#EAEAEA] rounded-b-xl bg-[#fafafa] p-2 space-y-2 min-h-[200px]">
        {tareas.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-[#EAEAEA] font-medium">Sin tareas</div>
        ) : (
          tareas.map(t => (
            <TaskCard key={t.id} tarea={t} canEdit={canEdit} onComplete={() => setCompleteTarget(t)} />
          ))
        )}
      </div>

      {completeTarget && (
        <QuickCompleteModal tarea={completeTarget} onClose={() => setCompleteTarget(null)} />
      )}
    </div>
  )
}

// ── KPI bar ───────────────────────────────────────────────────────────────────

function KpiBar({ tareas }: { tareas: TareaKanban[] }) {
  const total = tareas.length
  const completadas = tareas.filter(t => t.status === "COMPLETADA").length
  const vencidas = tareas.filter(t => {
    if (t.status === "COMPLETADA") return false
    const diff = Math.floor((new Date(t.fecha_compromiso + "T00:00:00").getTime() - Date.now()) / 86400000)
    return diff < 0
  }).length
  const proximas = tareas.filter(t => {
    if (t.status === "COMPLETADA") return false
    const diff = Math.floor((new Date(t.fecha_compromiso + "T00:00:00").getTime() - Date.now()) / 86400000)
    return diff >= 0 && diff <= 3
  }).length
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0

  const items = [
    { label: "Total",        value: total,      color: "text-[#0B3D91]" },
    { label: "En Proceso",   value: tareas.filter(t => t.status === "EN_PROCESO").length, color: "text-[#0B3D91]" },
    { label: "Pendientes",   value: tareas.filter(t => t.status === "PENDIENTE").length,  color: "text-[#434652]" },
    { label: "Próx. Vencer", value: proximas,   color: proximas > 0 ? "text-orange-600" : "text-[#747783]" },
    { label: "Vencidas",     value: vencidas,   color: vencidas > 0 ? "text-red-600" : "text-[#747783]" },
    { label: "Completadas",  value: completadas, color: "text-emerald-600" },
    { label: "% Cumplimiento", value: `${pct}%`, color: pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600" },
  ]

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden mb-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="grid grid-cols-4 md:grid-cols-7 divide-x divide-[#EAEAEA]">
        {items.map(k => (
          <div key={k.label} className="px-4 py-3.5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1 leading-tight">{k.label}</p>
            <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tareas: TareaKanban[]
  canEdit: boolean
}

export function TasksKanban({ tareas, canEdit }: Props) {
  const [filterContrato, setFilterContrato] = useState("")
  const [filterPrioridad, setFilterPrioridad] = useState("")

  const contratos = useMemo(() => {
    const ids = [...new Set(tareas.map(t => t.id_contrato).filter(Boolean))] as string[]
    return ids.sort()
  }, [tareas])

  const filtered = useMemo(() => {
    return tareas.filter(t => {
      if (filterContrato && t.id_contrato !== filterContrato) return false
      if (filterPrioridad && t.prioridad !== filterPrioridad) return false
      return true
    })
  }, [tareas, filterContrato, filterPrioridad])

  const byCol = useMemo(() => {
    const map: Record<KanbanColumn, TareaKanban[]> = {
      PENDIENTE: [], EN_PROCESO: [], PROXIMA_VENCER: [], VENCIDA: [], COMPLETADA: [],
    }
    for (const t of filtered) {
      const col = getKanbanColumn(t)
      map[col].push(t)
    }
    return map
  }, [filtered])

  const selectCls = "h-8 rounded-lg border border-[#EAEAEA] px-2 text-xs text-[#434652] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white"

  return (
    <div className="space-y-4">
      <KpiBar tareas={tareas} />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterContrato} onChange={e => setFilterContrato(e.target.value)} className={selectCls}>
          <option value="">Todos los contratos</option>
          {contratos.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <select value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)} className={selectCls}>
          <option value="">Todas las prioridades</option>
          <option value="CRITICA">Crítica</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </select>
        {(filterContrato || filterPrioridad) && (
          <button onClick={() => { setFilterContrato(""); setFilterPrioridad("") }}
            className="h-8 px-3 rounded-lg border border-[#EAEAEA] text-xs text-[#747783] hover:text-[#434652] hover:bg-[#f9f9f9]">
            Limpiar
          </button>
        )}
        <span className="text-xs text-[#747783] ml-auto">{filtered.length} tarea{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 items-start">
        {COL_ORDER.map(col => (
          <KanbanColumn key={col} col={col} tareas={byCol[col]} canEdit={canEdit} />
        ))}
      </div>
    </div>
  )
}
