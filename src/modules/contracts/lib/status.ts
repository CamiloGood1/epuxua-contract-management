import {
  Activity,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Ban,
  FileX,
  MinusCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ContractStatus } from "@/types/contract"

export interface StatusConfig {
  label: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
  barColor: string
  icon: LucideIcon
}

export const STATUS_CONFIG: Record<ContractStatus, StatusConfig> = {
  EN_EJECUCION: {
    label: "En Ejecución",
    color: "#10B981",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
    dotClass: "bg-emerald-400",
    barColor: "bg-emerald-500",
    icon: Activity,
  },
  SUSPENDIDO: {
    label: "Suspendido",
    color: "#F59E0B",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    dotClass: "bg-amber-400",
    barColor: "bg-amber-500",
    icon: AlertTriangle,
  },
  TERMINADO: {
    label: "Terminado",
    color: "#6366F1",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-200",
    dotClass: "bg-indigo-400",
    barColor: "bg-indigo-500",
    icon: CheckCircle2,
  },
  TERMINADO_ANTICIPADAMENTE: {
    label: "Terminado Anticipad.",
    color: "#8B5CF6",
    bgClass: "bg-violet-50",
    textClass: "text-violet-700",
    borderClass: "border-violet-200",
    dotClass: "bg-violet-400",
    barColor: "bg-violet-500",
    icon: MinusCircle,
  },
  LIQUIDADO: {
    label: "Liquidado",
    color: "#7C3AED",
    bgClass: "bg-purple-50",
    textClass: "text-purple-700",
    borderClass: "border-purple-200",
    dotClass: "bg-purple-400",
    barColor: "bg-purple-500",
    icon: CheckCircle2,
  },
  CIERRE_CONTRACTUAL: {
    label: "Cierre Contractual",
    color: "#64748B",
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
    dotClass: "bg-slate-400",
    barColor: "bg-slate-500",
    icon: Hourglass,
  },
  DECLARADO_FALLIDO: {
    label: "Declarado Fallido",
    color: "#EF4444",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-200",
    dotClass: "bg-red-400",
    barColor: "bg-red-500",
    icon: XCircle,
  },
  ACTA_NO_EJECUCION: {
    label: "Acta No Ejecución",
    color: "#F97316",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
    dotClass: "bg-orange-400",
    barColor: "bg-orange-500",
    icon: FileX,
  },
  NO_SUSCRIPCION: {
    label: "No Suscripción",
    color: "#94A3B8",
    bgClass: "bg-slate-50",
    textClass: "text-slate-500",
    borderClass: "border-slate-200",
    dotClass: "bg-slate-300",
    barColor: "bg-slate-400",
    icon: Ban,
  },
}

const FALLBACK: StatusConfig = STATUS_CONFIG.CIERRE_CONTRACTUAL

export function resolveStatus(raw: string | null | undefined): StatusConfig {
  if (raw && raw in STATUS_CONFIG) {
    return STATUS_CONFIG[raw as ContractStatus]
  }
  return FALLBACK
}

// ── Formatter COP ─────────────────────────────────────────────────────────────

export function formatCOP(value: number | null | undefined): string {
  if (value == null) return "—"
  const n = Number(value)
  if (n >= 1_000_000_000)
    return `$${(n / 1_000_000_000).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`
  return `$${n.toLocaleString("es-CO")}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function pct(v: number | null | undefined): number {
  return Math.min(100, Math.max(0, Number(v ?? 0)))
}

// ── Opciones para filtros y formularios ───────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    value: key,
    label: cfg.label,
  })),
]

export const CONTRACT_TYPE_OPTIONS = [
  { value: "DIRECTO",           label: "Contratación Directa" },
  { value: "INTERADMINISTRATIVO", label: "Interadministrativo" },
  { value: "TIENDA_VIRTUAL",    label: "Tienda Virtual" },
  { value: "PAGO_FACTURA",      label: "Pago contra Factura" },
]

export const MODALITY_OPTIONS = [
  { value: "CONTRATACION_DIRECTA",      label: "Contratación Directa" },
  { value: "INVITACION_ABIERTA",        label: "Invitación Abierta" },
  { value: "INVITACION_PRESELECCIONADOS", label: "Invitación Preseleccionados" },
  { value: "CONCURSO_MERITOS",          label: "Concurso de Méritos" },
  { value: "ORDEN_COMPRA",              label: "Orden de Compra" },
  { value: "ACUERDO_MARCO",             label: "Acuerdo Marco" },
  { value: "TIENDA_VIRTUAL",            label: "Tienda Virtual" },
  { value: "PAGO_FACTURA",              label: "Pago contra Factura" },
]
