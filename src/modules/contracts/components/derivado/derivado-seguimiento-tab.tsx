"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Trash2, CheckCircle2, Play, Clock, AlertTriangle, ExternalLink } from "lucide-react"
import {
  createContractTask, startContractTask, completeContractTask, deleteContractTask,
} from "@/services/contract-tasks.actions"
import { calcSeguimientoKPIs, getDaysLabel, getKanbanColumn, PRIORIDAD_CFG } from "@/types/seguimiento"
import type { ContractTask } from "@/types/contract-derivado"
import type { TareaPrioridad } from "@/types/seguimiento"
import { formatDateShort } from "@/lib/date-format"

// ── Helpers ───────────────────────────────────────────────────────────────────

type TaskAsInteradmin = {
  id: number; nombre: string; descripcion: string
  fecha_compromiso: string; prioridad: TareaPrioridad
  responsable: string; status: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA"
  fecha_completada: string | null; enlace_evidencia_cierre: string | null
  comentario_cierre: string | null; user_id: string | null; user_email: string | null
  created_at: string; updated_at: string; interadministrativo_id: number
}

function toInteradminTask(t: ContractTask): TaskAsInteradmin {
  return { ...t, interadministrativo_id: t.contrato_id }
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

// ── Modal nueva tarea ─────────────────────────────────────────────────────────

function TareaModal({ contratoId, projectId, onClose }: {
  contratoId: number; projectId: string; onClose: () => void
}) {
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
    start(async () => {
      const res = await createContractTask({
        contrato_id: contratoId,
        project_id: projectId,
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha_compromiso: form.fecha_compromiso,
        prioridad: form.prioridad,
        responsable: form.responsable,
      })
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
            <label className={labelCls}>Nombre de la tarea *</label>
            <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
              placeholder="Ej: Revisión de informes parciales" required
              className={`${inputCls} h-10`} />
          </div>
          <div>
            <label className={labelCls}>Descripción *</label>
            <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
              required rows={3} className={`${inputCls} py-2 resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha compromiso *</label>
              <input type="date" value={form.fecha_compromiso} min={today}
                onChange={e => set("fecha_compromiso", e.target.value)} required
                className={`${inputCls} h-10`} />
            </div>
            <div>
              <label className={labelCls}>Prioridad</label>
              <select value={form.prioridad} onChange={e => set("prioridad", e.target.value)}
                className={`${inputCls} h-10`}>
                {(["BAJA","MEDIA","ALTA","CRITICA"] as TareaPrioridad[]).map(p => (
                  <option key={p} value={p}>{PRIORIDAD_CFG[p].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Responsable *</label>
            <input value={form.responsable} onChange={e => set("responsable", e.target.value)}
              placeholder="Nombre del responsable" required className={`${inputCls} h-10`} />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9ff] transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-medium hover:bg-[#002869] transition-colors disabled:opacity-50">
              {isPending ? "Guardando…" : "Guardar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal completar ───────────────────────────────────────────────────────────

function CompletarModal({ tarea, contratoId, projectId, onClose }: {
  tarea: ContractTask; contratoId: number; projectId: string; onClose: () => void
}) {
  const router = useRouter()
  const [comentario, setComentario] = useState("")
  const [enlace, setEnlace]         = useState("")
  const [error, setError]           = useState<string | null>(null)
  const [isPending, start]          = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await completeContractTask({
        id: tarea.id,
        contrato_id: contratoId,
        project_id: projectId,
        comentario_cierre: comentario,
        enlace_evidencia_cierre: enlace,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  const inputCls = "w-full rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">Completar Tarea</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-[#434652] font-medium">{tarea.nombre}</p>
          <div>
            <label className={labelCls}>Comentario de cierre</label>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)}
              rows={3} className={`${inputCls} py-2 resize-none`} placeholder="Describe el resultado…" />
          </div>
          <div>
            <label className={labelCls}>Enlace de evidencia</label>
            <input value={enlace} onChange={e => setEnlace(e.target.value)}
              type="url" placeholder="https://…" className={`${inputCls} h-10`} />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9ff]">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#10B981] text-white text-sm font-medium hover:bg-[#059669] transition-colors disabled:opacity-50">
              {isPending ? "Completando…" : "Marcar Completada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tarjeta de tarea ──────────────────────────────────────────────────────────

function TareaCard({ tarea, contratoId, projectId, canEdit }: {
  tarea: ContractTask; contratoId: number; projectId: string; canEdit: boolean
}) {
  const router        = useRouter()
  const [showComp, setShowComp] = useState(false)
  const [isPending, start]      = useTransition()
  const proxy  = toInteradminTask(tarea)
  const days   = getDaysLabel(proxy as Parameters<typeof getDaysLabel>[0])
  const isComp = tarea.status === "COMPLETADA"

  function handleStart() {
    start(async () => {
      await startContractTask(tarea.id, contratoId, projectId)
      router.refresh()
    })
  }

  function handleDelete() {
    const reason = window.prompt("Indique el motivo de eliminación (obligatorio):")
    if (reason === null) return // cancelled
    if (!reason.trim()) { alert("El motivo es obligatorio."); return }
    start(async () => {
      const res = await deleteContractTask(tarea.id, contratoId, projectId, reason)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <>
      {showComp && (
        <CompletarModal tarea={tarea} contratoId={contratoId} projectId={projectId} onClose={() => setShowComp(false)} />
      )}
      <div className={`relative bg-white rounded-xl border p-4 space-y-2.5 transition-opacity ${isPending ? "opacity-50" : ""} ${isComp ? "border-[#10B981]/30 bg-[#f0fdf4]" : "border-[#EAEAEA]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PrioridadBadge p={tarea.prioridad} />
              {isComp ? (
                <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">Completada</span>
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${days.bg} ${days.color}`}>{days.text}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#151C27]">{tarea.nombre}</p>
            <p className="text-xs text-[#747783] mt-0.5">{tarea.descripcion}</p>
          </div>
          {canEdit && !isComp && (
            <div className="flex items-center gap-1 shrink-0">
              {tarea.status === "PENDIENTE" && (
                <button onClick={handleStart} disabled={isPending} title="Iniciar"
                  className="p-1.5 rounded-lg hover:bg-[#f0f3ff] text-[#0B3D91]">
                  <Play size={14} />
                </button>
              )}
              <button onClick={() => setShowComp(true)} disabled={isPending} title="Completar"
                className="p-1.5 rounded-lg hover:bg-[#f0fdf4] text-[#10B981]">
                <CheckCircle2 size={14} />
              </button>
              <button onClick={handleDelete} disabled={isPending} title="Eliminar"
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#747783]">
          <span><Clock size={11} className="inline mr-1" />Compromiso: {formatDateShort(tarea.fecha_compromiso)}</span>
          {tarea.responsable && <span>Responsable: <strong className="text-[#434652]">{tarea.responsable}</strong></span>}
        </div>
        {isComp && tarea.enlace_evidencia_cierre && (
          <a href={tarea.enlace_evidencia_cierre} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#0B3D91] hover:underline">
            <ExternalLink size={11} /> Ver evidencia
          </a>
        )}
        {isComp && tarea.comentario_cierre && (
          <p className="text-xs text-[#10B981] italic">{tarea.comentario_cierre}</p>
        )}
      </div>
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DerivedSeguimientoTab({
  tasks, contratoId, projectId, canEdit,
}: {
  tasks: ContractTask[]
  contratoId: number
  projectId: string
  canEdit: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const proxies = tasks.map(t => toInteradminTask(t) as Parameters<typeof calcSeguimientoKPIs>[0][0])
  const kpis = calcSeguimientoKPIs(proxies)

  const pendientes  = tasks.filter(t => t.status === "PENDIENTE")
  const enProceso   = tasks.filter(t => t.status === "EN_PROCESO")
  const completadas = tasks.filter(t => t.status === "COMPLETADA")

  return (
    <>
      {showModal && (
        <TareaModal contratoId={contratoId} projectId={projectId} onClose={() => setShowModal(false)} />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total",       val: kpis.total,      color: "text-[#0B3D91]" },
          { label: "Pendientes",  val: kpis.pendientes, color: "text-[#D97706]" },
          { label: "En Proceso",  val: kpis.enProceso,  color: "text-[#0B3D91]" },
          { label: "Completadas", val: kpis.completadas,color: "text-[#10B981]" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#EAEAEA] p-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-[10px] text-[#747783] uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#002869]">
          Tareas del Contrato
          {kpis.vencidas > 0 && (
            <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} className="inline mr-0.5" />{kpis.vencidas} vencida{kpis.vencidas !== 1 ? "s" : ""}
            </span>
          )}
        </h3>
        {canEdit && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3D91] text-white rounded-lg text-xs font-medium hover:bg-[#002869] transition-colors">
            <Plus size={13} /> Nueva Tarea
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={36} className="text-[#EAEAEA] mb-3" />
          <p className="text-sm font-semibold text-[#151C27]">Sin tareas registradas</p>
          <p className="text-xs text-[#747783] mt-1">Las tareas de seguimiento del contrato aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Pendientes", items: pendientes, accent: "#D97706" },
            { label: "En Proceso", items: enProceso, accent: "#0B3D91" },
            { label: "Completadas", items: completadas, accent: "#10B981" },
          ].map(({ label, items, accent }) => (
            <div key={label}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-xs font-bold text-[#434652] uppercase tracking-wide">{label}</span>
                <span className="ml-auto text-xs text-[#747783]">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map(t => (
                  <TareaCard key={t.id} tarea={t} contratoId={contratoId} projectId={projectId} canEdit={canEdit} />
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-[#747783] text-center py-6 bg-[#f9f9ff] rounded-xl border border-dashed border-[#EAEAEA]">Sin tareas en este estado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
