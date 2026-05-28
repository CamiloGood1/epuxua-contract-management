import {
  Activity,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ── Canonical status config ───────────────────────────────────────────────────

export const STATUS_CONFIG = {
  in_progress: {
    label: "En Ejecución",
    color: "#10B981",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
    dotClass: "bg-emerald-400",
    barColor: "bg-emerald-500",
    icon: Activity,
  },
  liquidation: {
    label: "En Liquidación",
    color: "#F59E0B",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    dotClass: "bg-amber-400",
    barColor: "bg-amber-500",
    icon: Hourglass,
  },
  liquidated: {
    label: "Liquidado",
    color: "#7C3AED",
    bgClass: "bg-violet-50",
    textClass: "text-violet-700",
    borderClass: "border-violet-200",
    dotClass: "bg-violet-400",
    barColor: "bg-violet-500",
    icon: CheckCircle2,
  },
  suspended: {
    label: "Suspendido",
    color: "#EF4444",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-200",
    dotClass: "bg-red-400",
    barColor: "bg-red-500",
    icon: AlertTriangle,
  },
  pending_start: {
    label: "Pendiente de Inicio",
    color: "#3B82F6",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
    dotClass: "bg-blue-400",
    barColor: "bg-blue-500",
    icon: Clock,
  },
} as const

export type StatusKey = keyof typeof STATUS_CONFIG

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

const FALLBACK: StatusConfig = STATUS_CONFIG.pending_start

export function resolveStatus(raw: string | null | undefined): StatusConfig {
  if (raw && raw in STATUS_CONFIG) {
    return STATUS_CONFIG[raw as StatusKey]
  }
  return FALLBACK
}

// ── COP money formatter ───────────────────────────────────────────────────────

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

// ── All statuses as select options ────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    value: key,
    label: cfg.label,
  })),
]
