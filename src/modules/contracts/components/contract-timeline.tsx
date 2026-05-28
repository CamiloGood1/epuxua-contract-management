"use client"

import { motion } from "framer-motion"
import {
  FileText,
  Play,
  GitCommitVertical,
  Pause,
  RefreshCcw,
  CheckCircle2,
  Hourglass,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveStatus } from "../lib/status"
import type { Contract } from "@/types/contract"

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

function buildTimeline(contract: Contract): TimelineEvent[] {
  const cfg = resolveStatus(contract.status)
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

  if (contract.start_date) {
    events.push({
      id: "start",
      label: "Inicio de contrato",
      date: contract.start_date,
      description: "Contrato suscrito e iniciado formalmente",
      icon: Play,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      active: true,
    })
  }

  if (contract.status === "in_progress") {
    events.push({
      id: "progress",
      label: "En ejecución",
      date: null,
      description: `Avance físico: ${contract.physical_progress ?? 0}%`,
      icon: GitCommitVertical,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      active: true,
    })
  }

  if (contract.status === "suspended") {
    events.push({
      id: "suspended",
      label: "Suspendido",
      date: null,
      description: "Contrato en estado de suspensión",
      icon: Pause,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      active: true,
    })
  }

  if (contract.status === "liquidation") {
    events.push({
      id: "liquidation",
      label: "En liquidación",
      date: null,
      description: "Proceso de liquidación iniciado",
      icon: Hourglass,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      active: true,
    })
  }

  if (contract.status === "liquidated") {
    events.push({
      id: "liquidated",
      label: "Liquidado",
      date: contract.end_date ?? null,
      description: "Contrato liquidado exitosamente",
      icon: CheckCircle2,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      active: true,
    })
  }

  // Future milestone if not liquidated
  if (contract.status !== "liquidated" && contract.end_date) {
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

export function ContractTimeline({ contract }: { contract: Contract }) {
  const events = buildTimeline(contract)

  return (
    <div className="relative">
      {/* Vertical track */}
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
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ring-background",
                  event.iconBg,
                  !event.active && "opacity-40"
                )}
              >
                <Icon size={14} className={event.iconColor} />
              </div>

              {/* Content */}
              <div className={cn("flex-1 min-w-0 pt-0.5", !event.active && "opacity-50")}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{event.label}</p>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {formatEventDate(event.date)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
