"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUp, Calendar, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import { ProgressBar } from "@/modules/contracts/components/progress-bar"
import { formatDate, formatCOP, pct } from "@/modules/contracts/lib/status"
import type { ContractTracking, FollowupAlertLevel } from "@/types/contract"

const SEMAFORO: Record<
  NonNullable<FollowupAlertLevel>,
  { label: string; dot: string; ring: string }
> = {
  VERDE: { label: "Verde", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  AMARILLO: { label: "Amarillo", dot: "bg-amber-500", ring: "ring-amber-200" },
  ROJO: { label: "Rojo", dot: "bg-red-500", ring: "ring-red-200" },
}

function Semaphore({ level }: { level: FollowupAlertLevel | null }) {
  if (!level) {
    return (
      <span className="text-xs text-muted-foreground italic">Sin corte</span>
    )
  }
  const cfg = SEMAFORO[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ring-2",
        cfg.ring
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function TrackingCard({ row, index }: { row: ContractTracking; index: number }) {
  const phys = row.last_physical_progress
  const fin = pct(row.financial_progress_pct)
  const time = row.time_progress_pct != null ? pct(row.time_progress_pct) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/contracts/${row.id}`}
        className="block bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                {row.contract_number}
              </code>
              <StatusBadge status={row.status} size="sm" />
              <Semaphore level={row.last_alert_level} />
            </div>
            <h2 className="text-sm font-semibold text-foreground line-clamp-2">
              {row.object}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {row.contractor_name}
              {row.supervisor_name ? ` · ${row.supervisor_name}` : ""}
            </p>
          </div>
          <ArrowRight
            size={18}
            className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <ProgressBar
            value={phys}
            label="Avance físico"
            colorClass="bg-emerald-500"
            animationDelay={0.1}
          />
          <ProgressBar
            value={fin}
            label="Avance financiero"
            colorClass="bg-indigo-500"
            animationDelay={0.15}
          />
          {time != null ? (
            <ProgressBar
              value={time}
              label="Avance temporal"
              colorClass="bg-slate-500"
              animationDelay={0.2}
            />
          ) : (
            <p className="text-xs text-muted-foreground self-center">Sin plazo calculado</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-3">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            Último seguimiento:{" "}
            <strong className="text-foreground font-medium">
              {row.last_followup_date ? formatDate(row.last_followup_date) : "Sin registro"}
            </strong>
          </span>
          {row.days_remaining != null && (
            <span>
              {row.days_remaining >= 0
                ? `${row.days_remaining} días restantes`
                : `Vencido hace ${Math.abs(row.days_remaining)} días`}
            </span>
          )}
          <span className="ml-auto font-medium text-foreground">{formatCOP(row.final_value)}</span>
        </div>
      </Link>
    </motion.div>
  )
}

export function SeguimientoPageClient({ rows }: { rows: ContractTracking[] }) {
  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Seguimiento de contratos</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} contrato{rows.length !== 1 ? "s" : ""} en ejecución o suspendido
            {rows.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center">
          <TrendingUp size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay contratos activos con datos de seguimiento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, i) => (
            <TrackingCard key={row.id} row={row} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
