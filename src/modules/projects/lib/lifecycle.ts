import {
  ClipboardList,
  FileSignature,
  Activity,
  BarChart3,
  Scale,
  Archive,
  CheckCircle2,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import type { ProjectLifecycle } from "@/types/project"
import type { EstadoInteradministrativo } from "@/types/database"

export interface EstadoConfig {
  label: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
  icon: LucideIcon
}

export const ESTADO_CONFIG: Record<EstadoInteradministrativo, EstadoConfig> = {
  "PLANEACIÓN": {
    label:       "Planeación",
    color:       "#6366F1",
    bgClass:     "bg-indigo-50",
    textClass:   "text-indigo-700",
    borderClass: "border-indigo-200",
    dotClass:    "bg-indigo-400",
    icon:        ClipboardList,
  },
  "CONTRATACIÓN": {
    label:       "Contratación",
    color:       "#3B82F6",
    bgClass:     "bg-blue-50",
    textClass:   "text-blue-700",
    borderClass: "border-blue-200",
    dotClass:    "bg-blue-400",
    icon:        FileSignature,
  },
  "EN EJECUCIÓN": {
    label:       "En ejecución",
    color:       "#10B981",
    bgClass:     "bg-emerald-50",
    textClass:   "text-emerald-700",
    borderClass: "border-emerald-200",
    dotClass:    "bg-emerald-400",
    icon:        Activity,
  },
  "SUSPENDIDO": {
    label:       "Suspendido",
    color:       "#F59E0B",
    bgClass:     "bg-amber-50",
    textClass:   "text-amber-700",
    borderClass: "border-amber-200",
    dotClass:    "bg-amber-400",
    icon:        PauseCircle,
  },
  "TERMINADO": {
    label:       "Terminado",
    color:       "#64748B",
    bgClass:     "bg-slate-50",
    textClass:   "text-slate-700",
    borderClass: "border-slate-200",
    dotClass:    "bg-slate-400",
    icon:        CheckCircle2,
  },
  "LIQUIDADO": {
    label:       "Liquidado",
    color:       "#345bab",
    bgClass:     "bg-blue-50",
    textClass:   "text-blue-700",
    borderClass: "border-blue-200",
    dotClass:    "bg-blue-400",
    icon:        Archive,
  },
  "TERMINADO ANTICIPADAMENTE": {
    label:       "Term. Anticipado",
    color:       "#EF4444",
    bgClass:     "bg-red-50",
    textClass:   "text-red-700",
    borderClass: "border-red-200",
    dotClass:    "bg-red-400",
    icon:        XCircle,
  },
}

export const ESTADO_ORDER: EstadoInteradministrativo[] = [
  "PLANEACIÓN",
  "CONTRATACIÓN",
  "EN EJECUCIÓN",
  "SUSPENDIDO",
  "TERMINADO",
  "LIQUIDADO",
  "TERMINADO ANTICIPADAMENTE",
]

export interface LifecycleConfig {
  label: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
  icon: LucideIcon
  columnOrder: number
}

export const LIFECYCLE_CONFIG: Record<ProjectLifecycle, LifecycleConfig> = {
  PLANEACION: {
    label: "Planeación",
    color: "#6366F1",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-200",
    dotClass: "bg-indigo-400",
    icon: ClipboardList,
    columnOrder: 0,
  },
  CONTRATACION: {
    label: "Contratación",
    color: "#3B82F6",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
    dotClass: "bg-blue-400",
    icon: FileSignature,
    columnOrder: 1,
  },
  EJECUCION: {
    label: "Ejecución",
    color: "#10B981",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
    dotClass: "bg-emerald-400",
    icon: Activity,
    columnOrder: 2,
  },
  SEGUIMIENTO: {
    label: "Seguimiento",
    color: "#F59E0B",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    dotClass: "bg-amber-400",
    icon: BarChart3,
    columnOrder: 3,
  },
  LIQUIDACION: {
    label: "Liquidación",
    color: "#8B5CF6",
    bgClass: "bg-violet-50",
    textClass: "text-violet-700",
    borderClass: "border-violet-200",
    dotClass: "bg-violet-400",
    icon: Scale,
    columnOrder: 4,
  },
  CERRADO: {
    label: "Cerrado",
    color: "#64748B",
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
    dotClass: "bg-slate-400",
    icon: Archive,
    columnOrder: 5,
  },
}

export const LIFECYCLE_ORDER: ProjectLifecycle[] = [
  "PLANEACION",
  "CONTRATACION",
  "EJECUCION",
  "SEGUIMIENTO",
  "LIQUIDACION",
  "CERRADO",
]

export function resolveLifecycle(raw: string | null | undefined): LifecycleConfig {
  if (raw && raw in LIFECYCLE_CONFIG) {
    return LIFECYCLE_CONFIG[raw as ProjectLifecycle]
  }
  return LIFECYCLE_CONFIG.EJECUCION
}
