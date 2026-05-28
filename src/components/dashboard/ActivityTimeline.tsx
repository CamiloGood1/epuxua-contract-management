"use client"

import { motion } from "framer-motion"
import { Plus, Clock, CheckCircle2, AlertTriangle, Hourglass, Zap, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG, resolveStatus } from "./DashboardPage"
import type { Contract } from "@/types/contract"

interface TimelineEvent {
  id: string
  title: string
  description: string
  time: string
  iconBg: string
  iconColor: string
  Icon: typeof Clock
}

const STATUS_ICON: Record<string, typeof Clock> = {
  in_progress:   Clock,
  liquidation:   Hourglass,
  liquidated:    CheckCircle2,
  suspended:     AlertTriangle,
  pending_start: XCircle,
}

const STATUS_ICON_BG: Record<string, string> = {
  in_progress:   "bg-emerald-50",
  liquidation:   "bg-amber-50",
  liquidated:    "bg-violet-50",
  suspended:     "bg-red-50",
  pending_start: "bg-blue-50",
}

const STATUS_ICON_COLOR: Record<string, string> = {
  in_progress:   "text-emerald-600",
  liquidation:   "text-amber-600",
  liquidated:    "text-violet-600",
  suspended:     "text-red-600",
  pending_start: "text-blue-600",
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Hoy"
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
}

function buildEvents(contracts: Contract[]): TimelineEvent[] {
  return contracts.slice(0, 8).map((c) => {
    const key = resolveStatus(c.status)
    const cfg = STATUS_CONFIG[key]
    return {
      id: c.id,
      title: cfg.label,
      description: c.contract_name ?? c.contract_number ?? "Sin nombre",
      time: relativeTime(c.updated_at ?? c.created_at),
      iconBg: STATUS_ICON_BG[key],
      iconColor: STATUS_ICON_COLOR[key],
      Icon: STATUS_ICON[key] ?? Clock,
    }
  })
}

const DEMO_EVENTS: TimelineEvent[] = [
  {
    id: "init",
    Icon: Zap,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    title: "Plataforma lista",
    description: "Sistema de gestión contractual activo",
    time: "Hoy",
  },
  {
    id: "pending",
    Icon: Plus,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Primer contrato pendiente",
    description: "Registe contratos para ver la actividad",
    time: "Pendiente",
  },
]

export function ActivityTimeline({ contracts }: { contracts: Contract[] }) {
  const events = contracts.length > 0 ? buildEvents(contracts) : DEMO_EVENTS

  return (
    <div className="relative">
      <div className="absolute left-4 top-1 bottom-1 w-px bg-border" />

      <div className="space-y-4">
        {events.map((ev, i) => {
          const Icon = ev.Icon
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.3 }}
              className="flex items-start gap-3 pl-1"
            >
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ring-background",
                  ev.iconBg
                )}
              >
                <Icon size={14} className={ev.iconColor} />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] font-semibold text-foreground leading-snug">{ev.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>
              </div>

              <span className="text-[10px] text-muted-foreground shrink-0 pt-1 tabular-nums">
                {ev.time}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
