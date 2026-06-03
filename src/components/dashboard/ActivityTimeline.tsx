"use client"

import { motion } from "framer-motion"
import { Plus, Clock, CheckCircle2, AlertTriangle, Hourglass, Zap, XCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG, resolveStatus } from "./DashboardPage"
import type { Contract, ContractStatus } from "@/types/contract"

interface TimelineEvent {
  id: string
  title: string
  description: string
  time: string
  iconBg: string
  iconColor: string
  Icon: typeof Clock
}

const STATUS_ICON: Partial<Record<ContractStatus, typeof Clock>> = {
  EN_EJECUCION: Activity,
  CIERRE_CONTRACTUAL: Hourglass,
  LIQUIDADO: CheckCircle2,
  SUSPENDIDO: AlertTriangle,
  TERMINADO: CheckCircle2,
  TERMINADO_ANTICIPADAMENTE: CheckCircle2,
  DECLARADO_FALLIDO: XCircle,
  ACTA_NO_EJECUCION: XCircle,
  NO_SUSCRIPCION: XCircle,
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
    const cfg = resolveStatus(c.status)
    const Icon = STATUS_ICON[c.status] ?? Clock
    return {
      id: c.id,
      title: cfg.label,
      description: c.object?.slice(0, 60) || c.contract_number,
      time: relativeTime(c.updated_at ?? c.created_at),
      iconBg: cfg.bgClass,
      iconColor: cfg.textClass,
      Icon,
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
]

export function ActivityTimeline({ contracts }: { contracts: Contract[] }) {
  const events = contracts.length > 0 ? buildEvents(contracts) : DEMO_EVENTS

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">Actividad reciente</h3>
        <button
          type="button"
          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <Plus size={12} />
          Ver todo
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event, i) => {
          const Icon = event.Icon
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                  event.iconBg
                )}
              >
                <Icon size={14} className={event.iconColor} />
              </div>
              <div className="flex-1 min-w-0 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{event.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {event.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
