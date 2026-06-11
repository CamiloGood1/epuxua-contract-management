export type TareaStatus    = "PENDIENTE" | "EN_PROCESO" | "COMPLETADA"
export type TareaPrioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
export type KanbanColumn   = "PENDIENTE" | "EN_PROCESO" | "PROXIMA_VENCER" | "VENCIDA" | "COMPLETADA"

export interface Tarea {
  id: number
  interadministrativo_id: number
  nombre: string
  descripcion: string
  fecha_compromiso: string
  prioridad: TareaPrioridad
  responsable: string
  status: TareaStatus
  fecha_completada: string | null
  enlace_evidencia_cierre: string | null
  comentario_cierre: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface TareaKanban extends Tarea {
  id_contrato?: string
  objeto_contrato?: string
}

export interface Avance {
  id: number
  interadministrativo_id: number
  fecha: string
  descripcion: string
  enlace_evidencia: string
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface SeguimientoKPIs {
  total:           number
  pendientes:      number
  enProceso:       number
  completadas:     number
  vencidas:        number
  proximasVencer:  number
  pctCumplimiento: number
}

// ── Lógica Kanban ─────────────────────────────────────────────────────────────

export function getKanbanColumn(tarea: Tarea): KanbanColumn {
  if (tarea.status === "COMPLETADA") return "COMPLETADA"
  const today  = new Date(); today.setHours(0,0,0,0)
  const due    = new Date(tarea.fecha_compromiso + "T00:00:00")
  const diff   = Math.floor((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0)  return "VENCIDA"
  if (diff <= 3) return "PROXIMA_VENCER"
  if (tarea.status === "EN_PROCESO") return "EN_PROCESO"
  return "PENDIENTE"
}

export function getDaysLabel(tarea: Tarea): { text: string; color: string; bg: string } {
  if (tarea.status === "COMPLETADA") {
    return { text: "Completada", color: "text-emerald-700", bg: "bg-emerald-50" }
  }
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(tarea.fecha_compromiso + "T00:00:00")
  const diff  = Math.floor((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0)  return { text: `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? "s" : ""}`, color: "text-red-700",    bg: "bg-red-50" }
  if (diff === 0) return { text: "Vence hoy",                                                              color: "text-red-700",    bg: "bg-red-50" }
  if (diff === 1) return { text: "Vence mañana",                                                           color: "text-orange-700", bg: "bg-orange-50" }
  if (diff <= 3)  return { text: `Faltan ${diff} días`,                                                    color: "text-orange-700", bg: "bg-orange-50" }
  if (diff <= 7)  return { text: `Faltan ${diff} días`,                                                    color: "text-amber-700",  bg: "bg-amber-50" }
  return { text: `Faltan ${diff} días`, color: "text-[#434652]", bg: "bg-[#f9f9ff]" }
}

export const PRIORIDAD_CFG: Record<TareaPrioridad, { label: string; bg: string; text: string; border: string; dot: string }> = {
  BAJA:    { label: "Baja",    bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",  dot: "bg-slate-400" },
  MEDIA:   { label: "Media",   bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-400" },
  ALTA:    { label: "Alta",    bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-400" },
  CRITICA: { label: "Crítica", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",    dot: "bg-red-500" },
}

export function calcSeguimientoKPIs(tareas: Tarea[]): SeguimientoKPIs {
  const today = new Date(); today.setHours(0,0,0,0)
  let pendientes = 0, enProceso = 0, completadas = 0, vencidas = 0, proximasVencer = 0
  for (const t of tareas) {
    if (t.status === "COMPLETADA") { completadas++; continue }
    const due  = new Date(t.fecha_compromiso + "T00:00:00")
    const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
    if (diff < 0)        vencidas++
    else if (diff <= 3)  proximasVencer++
    if (t.status === "PENDIENTE")  pendientes++
    else if (t.status === "EN_PROCESO") enProceso++
  }
  return {
    total:           tareas.length,
    pendientes,
    enProceso,
    completadas,
    vencidas,
    proximasVencer,
    pctCumplimiento: tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0,
  }
}
