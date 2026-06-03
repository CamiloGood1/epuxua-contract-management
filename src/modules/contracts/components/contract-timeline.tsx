"use client"

import { motion } from "framer-motion"
import {
  FileText,
  Play,
  GitCommitVertical,
  Pause,
  CheckCircle2,
  Hourglass,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { pct } from "../lib/status"
import type { Contract, ContractStatus } from "@/types/contract"

interface TimelineEvent {
  id: string
  label: string
  date: string | null
  description?: string
  icon: typeof FileText
  iconBg: string
  iconColor: string
  active: boolean
}

function buildTimeline(
  contract: Contract,
  physicalProgress?: number | null
): TimelineEvent[] {
  const status = contract.status
  const events: TimelineEvent[] = []

  events.push({
    id: "created",
    label: "Registro en sistema",
    date: contract.created_at,
    description: `Contrato ${contract.contract_number} registrado`,
    icon: FileText,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    active: true,
  })

  if (contract.subscription_date) {
    events.push({
      id: "subscription",
      label: "Suscripción",
      date: contract.subscription_date,
      description: "Fecha de suscripción del contrato",
      icon: FileText,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
      active: true,
    })
  }

  if (contract.start_date) {
    events.push({
      id: "start",
      label: "Inicio de ejecución",
      date: contract.start_date,
      description: "Inicio formal de la ejecución",
      icon: Play,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      active: true,
    })
  }

  if (status === "EN_EJECUCION") {
    const physDesc =
      physicalProgress != null
        ? `Avance físico: ${pct(physicalProgress)}% · Financiero: ${pct(contract.financial_progress_pct)}%`
        : `Sin seguimiento físico · Financiero: ${pct(contract.financial_progress_pct)}%`
    events.push({
      id: "progress",
      label: "En ejecución",
      date: null,
      description: physDesc,
      icon: GitCommitVertical,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      active: true,
    })
  }

  if (status === "SUSPENDIDO") {
    events.push({
      id: "suspended",
      label: "Suspendido",
      date: null,
      description: "Contrato en estado de suspensión",
      icon: Pause,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      active: true,
    })
  }

  const closing: ContractStatus[] = ["CIERRE_CONTRACTUAL", "LIQUIDADO"]
  if (closing.includes(status)) {
    events.push({
      id: "closing",
      label: status === "LIQUIDADO" ? "Liquidado" : "Cierre contractual",
      date: contract.liquidation_date ?? contract.file_closure_date ?? contract.end_date,
      description: contract.object?.slice(0, 80),
      icon: status === "LIQUIDADO" ? CheckCircle2 : Hourglass,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      active: true,
    })
  }

  if (["TERMINADO", "TERMINADO_ANTICIPADAMENTE"].includes(status)) {
    events.push({
      id: "terminated",
      label: "Terminado",
      date: contract.end_date,
      icon: CheckCircle2,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      active: true,
    })
  }

  if (contract.end_date && !["LIQUIDADO", "TERMINADO", "TERMINADO_ANTICIPADAMENTE"].includes(status)) {
    const isPast = new Date(contract.end_date) < new Date()
    events.push({
      id: "end",
      label: isPast ? "Venció" : "Vencimiento previsto",
      date: contract.end_date,
      icon: Clock,
      iconBg: isPast ? "bg-red-50" : "bg-muted",
      iconColor: isPast ? "text-red-600" : "text-muted-foreground",
      active: isPast,
    })
  }

  return events
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function ContractTimeline({
  contract,
  physicalProgress,
}: {
  contract: Contract
  physicalProgress?: number | null
}) {
  const events = buildTimeline(contract, physicalProgress)

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

      <div className="space-y-5">
        {events.map((event, i) => {
          const Icon = event.icon
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-start gap-4 pl-1"
            >
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ring-background",
                  event.iconBg,
                  !event.active && "opacity-40"
                )}
              >
                <Icon size={14} className={event.iconColor} />
              </div>

              <div className={cn("flex-1 min-w-0 pt-0.5", !event.active && "opacity-50")}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{event.label}</p>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {formatEventDate(event.date)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
