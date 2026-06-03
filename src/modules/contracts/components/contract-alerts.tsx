"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  computeAlerts,
  SEVERITY_CONFIG,
  type AlertSeverity,
  type AlertContext,
} from "../lib/alerts"
import type { Contract } from "@/types/contract"

function SummaryChip({ severity, count }: { severity: AlertSeverity; count: number }) {
  if (count === 0) return null
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold", cfg.bg, cfg.text, cfg.border)}>
      <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
      {count} {cfg.label}{count !== 1 ? "s" : ""}
    </div>
  )
}

function AlertCard({
  alert,
  index,
}: {
  alert: ReturnType<typeof computeAlerts>[number]
  index: number
}) {
  const cfg = SEVERITY_CONFIG[alert.severity]
  const Icon = alert.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn("flex gap-4 p-4 rounded-2xl border", cfg.bg, cfg.border)}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${cfg.color}20` }}
      >
        <Icon size={18} style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <p className={cn("text-sm font-semibold", cfg.text)}>{alert.title}</p>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
              cfg.bg,
              cfg.text,
              cfg.border
            )}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-foreground/70 leading-relaxed">{alert.description}</p>
        {alert.date && (
          <p className={cn("text-[11px] font-medium mt-1.5", cfg.text)}>
            {new Date(alert.date).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function NoAlerts() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
        <CheckCircle2 size={24} className="text-emerald-600" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">Sin alertas activas</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Este contrato no presenta alertas en este momento. Las alertas se generan automáticamente según el estado, fechas y ejecución.
      </p>
    </motion.div>
  )
}

export function ContractAlerts({
  contract,
  alertContext,
}: {
  contract: Contract
  alertContext?: AlertContext
}) {
  const alerts = computeAlerts(contract, alertContext)

  const counts = {
    critica: alerts.filter((a) => a.severity === "critica").length,
    alta: alerts.filter((a) => a.severity === "alta").length,
    media: alerts.filter((a) => a.severity === "media").length,
    baja: alerts.filter((a) => a.severity === "baja").length,
    info: alerts.filter((a) => a.severity === "info").length,
  }

  const hasAlerts = alerts.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell size={15} className="text-primary" />
            Centro de alertas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasAlerts
              ? `${alerts.length} alerta${alerts.length !== 1 ? "s" : ""} activa${alerts.length !== 1 ? "s" : ""} — generadas automáticamente`
              : "Generadas automáticamente desde los datos del contrato"}
          </p>
        </div>

        {hasAlerts && (
          <div className="flex flex-wrap gap-2">
            <SummaryChip severity="critica" count={counts.critica} />
            <SummaryChip severity="alta" count={counts.alta} />
            <SummaryChip severity="media" count={counts.media} />
            <SummaryChip severity="baja" count={counts.baja} />
            <SummaryChip severity="info" count={counts.info} />
          </div>
        )}
      </div>

      {hasAlerts ? (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <AlertCard key={alert.id} alert={alert} index={i} />
          ))}
        </div>
      ) : (
        <NoAlerts />
      )}
    </div>
  )
}
