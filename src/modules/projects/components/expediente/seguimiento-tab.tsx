"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  X, Plus, Trash2, CheckCircle2, Play, Clock, AlertTriangle,
  ExternalLink, ChevronDown, ChevronUp
} from "lucide-react"
import {
  createTarea, startTarea, completeTarea, deleteTarea,
  createAvance, deleteAvance,
} from "@/services/seguimiento.actions"
import {
  calcSeguimientoKPIs, getDaysLabel, getKanbanColumn,
  PRIORIDAD_CFG,
} from "@/types/seguimiento"
import type { Tarea, Avance, TareaPrioridad } from "@/types/seguimiento"
import type { CreateTareaInput, CreateAvanceInput } from "@/services/seguimiento.actions"
import { formatDateShort } from "@/lib/date-format"

export type { Tarea, Avance }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  return formatDateShort(d)
}

function PrioridadBadge({ p }: { p: TareaPrioridad }) {
  const c = PRIORIDAD_CFG[p]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ── Modal: Nueva Tarea ────────────────────────────────────────────────────────

function TareaModal({ interadministrativoId, onClose }: { interadministrativoId: number; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: "", descripcion: "", fecha_compromiso: "",
    prioridad: "MEDIA" as TareaPrioridad, responsable: "",
  })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    const input: CreateTareaInput = {
      interadministrativo_id: interadministrativoId,
      nombre:           form.nombre,
      descripcion:      form.descripcion,
      fecha_compromiso: form.fecha_compromiso,
      prioridad:        form.prioridad,
      responsable:      form.responsable,
    }
    start(async () => {
      const res = await createTarea(input)
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  const inputCls = "w-full rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"
  const today    = new Date().toISOString().split("T")[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">Nueva Tarea</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Fecha de Creación</label>
            <input type="text" value={fmtDate(today)} readOnly className={inputCls + " h-10 bg-[#f9f9ff] text-[#747783] cursor-not-allowed"} />
          </div>
          <div>
            <label className={labelCls}>Nombre de la Tarea <span className="text-red-500">*</span></label>
            <input type="text" value={form.nombre} onChange={e => set("nombre", e.target.value)} className={inputCls + " h-10"} placeholder="Ej. Enviar solicitud de adición…" />
          </div>
          <div>
            <label className={labelCls}>Descripción <span className="text-red-500">*</span></label>
            <textarea rows={3} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} className={inputCls + " py-2 resize-none"} placeholder="Detalle completo de la actividad…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha Compromiso <span className="text-red-500">*</span></label>
              <input type="date" value={form.fecha_compromiso} onChange={e => set("fecha_compromiso", e.target.value)} className={inputCls + " h-10"} />
            </div>
            <div>
              <label className={labelCls}>Prioridad <span className="text-red-500">*</span></label>
              <select value={form.prioridad} onChange={e => set("prioridad", e.target.value as TareaPrioridad)} className={inputCls + " h-10 appearance-none"}>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Responsable <span className="text-red-500">*</span></label>
            <input type="text" value={form.responsable} onChange={e => set("responsable", e.target.value)} className={inputCls + " h-10"} placeholder="Nombre del responsable" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60">
              {isPending ? "Guardando…" : "Crear Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Completar Tarea ────────────────────────────────────────────────────

function CompletarModal({ tarea, onClose }: { tarea: Tarea; onClose: () => void }) {
  const router = useRouter()
  const [step, setStep]         = useState<"confirm" | "evidence">("confirm")
  const [enlace, setEnlace]     = useState("")
  const [comentario, setComent] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [isPending, start]      = useTransition()

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await completeTarea({
        id: tarea.id,
        interadministrativo_id: tarea.interadministrativo_id,
        enlace_evidencia_cierre: enlace,
        comentario_cierre: comentario || null,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">Completar Tarea</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>

        {step === "confirm" ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">¿Está seguro de marcar esta tarea como completada?</p>
                <p className="text-xs text-amber-700 mt-1 font-medium">"{tarea.nombre}"</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">Cancelar</button>
              <button type="button" onClick={() => setStep("evidence")} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                Confirmar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-[#434652]">Adjunta la evidencia de cierre para completar la tarea.</p>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5">Enlace Evidencia <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={enlace}
                onChange={e => setEnlace(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5">Comentario de Cierre</label>
              <textarea rows={3} value={comentario} onChange={e => setComent(e.target.value)} placeholder="Opcional" className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("confirm")} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">Atrás</button>
              <button type="submit" disabled={isPending} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} />
                {isPending ? "Cerrando…" : "Marcar Completada"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Modal: Nuevo Avance ───────────────────────────────────────────────────────

function AvanceModal({ interadministrativoId, onClose }: { interadministrativoId: number; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ fecha: new Date().toISOString().split("T")[0], descripcion: "", enlace_evidencia: "" })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    const input: CreateAvanceInput = { interadministrativo_id: interadministrativoId, ...form }
    start(async () => {
      const res = await createAvance(input)
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  const inputCls = "w-full rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">Registrar Avance</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Fecha <span className="text-red-500">*</span></label>
            <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className={inputCls + " h-10"} />
          </div>
          <div>
            <label className={labelCls}>Descripción <span className="text-red-500">*</span></label>
            <textarea rows={4} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} className={inputCls + " py-2 resize-none"} placeholder="Ej. Se realizó visita técnica, se entregó informe parcial…" />
          </div>
          <div>
            <label className={labelCls}>Enlace Evidencia <span className="text-red-500">*</span></label>
            <input type="url" value={form.enlace_evidencia} onChange={e => set("enlace_evidencia", e.target.value)} className={inputCls + " h-10"} placeholder="https://drive.google.com/…" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60">
              {isPending ? "Guardando…" : "Registrar Avance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tarjeta de Tarea ──────────────────────────────────────────────────────────

function TareaCard({
  tarea, canEdit, canDelete,
  onComplete, onDelete,
}: {
  tarea: Tarea; canEdit: boolean; canDelete: boolean
  onComplete: () => void; onDelete: () => void
}) {
  const [starting, startT] = useTransition()
  const router = useRouter()
  const col    = getKanbanColumn(tarea)
  const days   = getDaysLabel(tarea)

  const borderColor =
    col === "VENCIDA"        ? "border-l-red-400"
    : col === "PROXIMA_VENCER" ? "border-l-orange-400"
    : tarea.status === "EN_PROCESO" ? "border-l-[#0B3D91]"
    : tarea.status === "COMPLETADA" ? "border-l-emerald-400"
    : "border-l-[#EAEAEA]"

  async function handleStart() {
    startT(async () => {
      const res = await startTarea(tarea.id, tarea.interadministrativo_id)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className={`bg-white rounded-xl border border-[#EAEAEA] border-l-4 ${borderColor} p-5`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-[#151c27] leading-snug flex-1">{tarea.nombre}</p>
        <PrioridadBadge p={tarea.prioridad} />
      </div>

      <p className="text-xs text-[#434652] line-clamp-2 mb-3">{tarea.descripcion}</p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Responsable */}
        <span className="flex items-center gap-1 text-[10px] text-[#747783]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          {tarea.responsable}
        </span>
        {/* Fecha compromiso */}
        <span className="flex items-center gap-1 text-[10px] text-[#747783]">
          <Clock size={10} />
          {fmtDate(tarea.fecha_compromiso)}
        </span>
      </div>

      {/* Días restantes */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${days.color} ${days.bg} mb-3`}>
        {col === "VENCIDA" || col === "PROXIMA_VENCER" ? <AlertTriangle size={11} /> : <Clock size={11} />}
        {days.text}
      </div>

      {/* Evidencia cierre (completada) */}
      {tarea.status === "COMPLETADA" && tarea.enlace_evidencia_cierre && (
        <div className="mt-2 pt-2 border-t border-[#EAEAEA]">
          <a href={tarea.enlace_evidencia_cierre} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#0B3D91] hover:underline">
            <ExternalLink size={11} />
            Ver evidencia
          </a>
          {tarea.comentario_cierre && (
            <p className="text-[10px] text-[#747783] mt-1 italic">{tarea.comentario_cierre}</p>
          )}
        </div>
      )}

      {/* Acciones */}
      {tarea.status !== "COMPLETADA" && canEdit && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-[#EAEAEA]">
          {tarea.status === "PENDIENTE" && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex-1 h-8 rounded-lg border border-[#0B3D91]/30 text-[#0B3D91] text-xs font-semibold hover:bg-[#f0f3ff] disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Play size={12} />
              Iniciar
            </button>
          )}
          <button
            onClick={onComplete}
            className="flex-1 h-8 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1"
          >
            <CheckCircle2 size={12} />
            Completar
          </button>
        </div>
      )}

      {canDelete && (
        <button onClick={onDelete} className="mt-2 flex items-center gap-1 text-[10px] text-[#747783] hover:text-red-600 transition-colors">
          <Trash2 size={11} />
          Eliminar
        </button>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  interadministrativoId: number
  tareas: Tarea[]
  avances: Avance[]
  canEdit: boolean
  canDelete: boolean
}

export function SeguimientoTab({ interadministrativoId, tareas, avances, canEdit, canDelete }: Props) {
  const router = useRouter()
  const [section, setSection]       = useState<"tareas" | "avances">("tareas")
  const [showNewTask, setShowNewTask]     = useState(false)
  const [showNewAvance, setShowNewAvance] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<Tarea | null>(null)
  const [showCompleted, setShowCompleted]   = useState(false)
  const [deleting, startDelete]             = useTransition()

  const kpis = useMemo(() => calcSeguimientoKPIs(tareas), [tareas])

  const activeTareas    = useMemo(() => tareas.filter(t => t.status !== "COMPLETADA").sort((a, b) => {
    const colOrder = { VENCIDA: 0, PROXIMA_VENCER: 1, EN_PROCESO: 2, PENDIENTE: 3, COMPLETADA: 4 }
    return (colOrder[getKanbanColumn(a)] ?? 3) - (colOrder[getKanbanColumn(b)] ?? 3)
  }), [tareas])

  const completedTareas = useMemo(() =>
    tareas.filter(t => t.status === "COMPLETADA")
          .sort((a, b) => (b.fecha_completada ?? "").localeCompare(a.fecha_completada ?? ""))
  , [tareas])

  const sortedAvances = useMemo(() =>
    [...avances].sort((a, b) => b.fecha.localeCompare(a.fecha))
  , [avances])

  async function handleDeleteTarea(t: Tarea) {
    const reason = window.prompt(`¿Eliminar la tarea "${t.nombre}"?\n\nIndique el motivo (obligatorio):`)
    if (reason === null) return // cancelled
    if (!reason.trim()) { alert("El motivo es obligatorio."); return }
    startDelete(async () => {
      const res = await deleteTarea(t.id, interadministrativoId, { nombre: t.nombre, status: t.status }, reason)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  async function handleDeleteAvance(a: Avance) {
    if (!confirm("¿Eliminar este registro de avance?")) return
    startDelete(async () => {
      const res = await deleteAvance(a.id, interadministrativoId)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  // ── KPIs ──
  const kpiItems = [
    { label: "Total",           value: kpis.total,           accent: "text-[#0B3D91]" },
    { label: "Pendientes",      value: kpis.pendientes,      accent: "text-[#434652]" },
    { label: "En Proceso",      value: kpis.enProceso,       accent: "text-[#0B3D91]" },
    { label: "Próx. Vencer",    value: kpis.proximasVencer,  accent: kpis.proximasVencer > 0 ? "text-orange-600" : "text-[#747783]" },
    { label: "Vencidas",        value: kpis.vencidas,        accent: kpis.vencidas > 0 ? "text-red-600" : "text-[#747783]" },
    { label: "Completadas",     value: kpis.completadas,     accent: "text-emerald-600" },
    { label: "% Cumplimiento",  value: `${kpis.pctCumplimiento}%`, accent: kpis.pctCumplimiento >= 80 ? "text-emerald-600" : kpis.pctCumplimiento >= 50 ? "text-amber-600" : "text-red-600" },
  ]

  return (
    <div className="space-y-5">

      {/* ── KPIs ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="grid grid-cols-4 md:grid-cols-7 divide-x divide-[#EAEAEA]">
          {kpiItems.map((k) => (
            <div key={k.label} className="px-4 py-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1 leading-tight">{k.label}</p>
              <p className={`text-xl font-bold tabular-nums ${k.accent}`}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alertas ── */}
      {kpis.vencidas > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {kpis.vencidas} tarea{kpis.vencidas > 1 ? "s" : ""} vencida{kpis.vencidas > 1 ? "s" : ""} — requiere atención inmediata
          </p>
        </div>
      )}
      {kpis.proximasVencer > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
          <Clock size={16} className="text-orange-500 shrink-0" />
          <p className="text-sm font-semibold text-orange-700">
            {kpis.proximasVencer} tarea{kpis.proximasVencer > 1 ? "s" : ""} próxima{kpis.proximasVencer > 1 ? "s" : ""} a vencer (≤3 días)
          </p>
        </div>
      )}

      {/* ── Sub-navegación ── */}
      <div className="flex gap-1 border-b border-[#EAEAEA]">
        {([
          { id: "tareas"  as const, label: "Tareas", badge: activeTareas.length },
          { id: "avances" as const, label: "Evidencias de Avance", badge: avances.length },
        ]).map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${section === s.id ? "border-[#0B3D91] text-[#0B3D91]" : "border-transparent text-[#747783] hover:text-[#434652]"}`}
          >
            {s.label}
            {s.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === s.id ? "bg-[#0B3D91]/10 text-[#0B3D91]" : "bg-[#f0f3ff] text-[#747783]"}`}>{s.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sección: Tareas ── */}
      {section === "tareas" && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#002869]">
              Tareas Activas
              <span className="ml-2 text-[11px] font-normal text-[#747783]">({activeTareas.length})</span>
            </h3>
            {canEdit && (
              <button
                onClick={() => setShowNewTask(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#002869]"
              >
                <Plus size={13} />
                Nueva Tarea
              </button>
            )}
          </div>

          {/* Cards de tareas activas */}
          {activeTareas.length === 0 ? (
            <div className="bg-white border border-dashed border-[#EAEAEA] rounded-xl flex flex-col items-center justify-center py-14">
              <CheckCircle2 size={36} className="text-[#EAEAEA] mb-3" />
              <p className="text-sm font-semibold text-[#151c27]">Sin tareas activas</p>
              <p className="text-xs text-[#747783] mt-1">{canEdit ? "Crea la primera tarea para este contrato." : "No hay tareas pendientes."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeTareas.map(t => (
                <TareaCard
                  key={t.id}
                  tarea={t}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onComplete={() => setCompleteTarget(t)}
                  onDelete={() => handleDeleteTarea(t)}
                />
              ))}
            </div>
          )}

          {/* Tareas completadas (colapsables) */}
          {completedTareas.length > 0 && (
            <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f9f9ff] hover:bg-[#f0f3ff] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span className="text-sm font-semibold text-[#151c27]">Tareas Completadas</span>
                  <span className="text-[11px] text-[#747783]">({completedTareas.length})</span>
                </div>
                {showCompleted ? <ChevronUp size={16} className="text-[#747783]" /> : <ChevronDown size={16} className="text-[#747783]" />}
              </button>

              {showCompleted && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-[#EAEAEA]">
                      <tr>
                        {["Tarea","Responsable","Creada","Completada","Evidencia","Comentario",""].map(h => (
                          <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {completedTareas.map(t => (
                        <tr key={t.id} className="hover:bg-[#f9f9ff]">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-[#151c27]">{t.nombre}</p>
                              <PrioridadBadge p={t.prioridad} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#434652]">{t.responsable}</td>
                          <td className="px-4 py-3 text-xs text-[#747783] whitespace-nowrap">{fmtDate(t.created_at.split("T")[0])}</td>
                          <td className="px-4 py-3 text-xs text-emerald-600 font-medium whitespace-nowrap">{fmtDate(t.fecha_completada)}</td>
                          <td className="px-4 py-3">
                            {t.enlace_evidencia_cierre ? (
                              <a href={t.enlace_evidencia_cierre} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-[#0B3D91] hover:underline">
                                <ExternalLink size={11} />
                                Ver
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#747783] max-w-[160px]">
                            <span className="line-clamp-2">{t.comentario_cierre ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {canDelete && (
                              <button onClick={() => handleDeleteTarea(t)} disabled={deleting}
                                className="p-1.5 rounded hover:bg-red-50 text-[#747783] hover:text-red-600 disabled:opacity-40">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Sección: Evidencias de Avance ── */}
      {section === "avances" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#002869]">Evidencias de Avance
              <span className="ml-2 text-[11px] font-normal text-[#747783]">({sortedAvances.length})</span>
            </h3>
            {canEdit && (
              <button
                onClick={() => setShowNewAvance(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#002869]"
              >
                <Plus size={13} />
                Nuevo Avance
              </button>
            )}
          </div>

          {sortedAvances.length === 0 ? (
            <div className="bg-white border border-dashed border-[#EAEAEA] rounded-xl flex flex-col items-center justify-center py-14">
              <Clock size={36} className="text-[#EAEAEA] mb-3" />
              <p className="text-sm font-semibold text-[#151c27]">Sin evidencias registradas</p>
              <p className="text-xs text-[#747783] mt-1">{canEdit ? "Registra el primer avance del contrato." : "No hay avances registrados."}</p>
            </div>
          ) : (
            /* Timeline */
            <div className="relative pl-6">
              {/* línea vertical */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-[#EAEAEA]" />

              <div className="space-y-4">
                {sortedAvances.map((a, i) => (
                  <div key={a.id} className="relative">
                    {/* dot */}
                    <div className={`absolute -left-6 top-3 w-4 h-4 rounded-full border-2 ${i === 0 ? "bg-[#0B3D91] border-[#0B3D91]" : "bg-white border-[#EAEAEA]"} z-10`} />

                    <div className="bg-white border border-[#EAEAEA] rounded-xl p-4" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold ${i === 0 ? "text-[#0B3D91]" : "text-[#747783]"}`}>{fmtDate(a.fecha)}</span>
                          {a.user_email && (
                            <span className="text-[10px] text-[#747783]">por {a.user_email}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a href={a.enlace_evidencia} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-[#0B3D91] hover:underline font-semibold">
                            <ExternalLink size={11} />
                            Evidencia
                          </a>
                          {canDelete && (
                            <button onClick={() => handleDeleteAvance(a)} disabled={deleting}
                              className="p-1 rounded hover:bg-red-50 text-[#747783] hover:text-red-600 disabled:opacity-40">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-[#434652] leading-relaxed">{a.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {showNewTask   && <TareaModal   interadministrativoId={interadministrativoId} onClose={() => setShowNewTask(false)} />}
      {showNewAvance && <AvanceModal  interadministrativoId={interadministrativoId} onClose={() => setShowNewAvance(false)} />}
      {completeTarget && <CompletarModal tarea={completeTarget} onClose={() => setCompleteTarget(null)} />}
    </div>
  )
}
