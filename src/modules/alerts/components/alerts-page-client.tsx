"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Bell, AlertTriangle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  computeAlerts,
  SEVERITY_CONFIG,
  type ContractAlert,
  type AlertSeverity,
} from "@/modules/contracts/lib/alerts"
import type { Contract } from "@/types/contract"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AlertWithContract extends ContractAlert {
  contract: Contract
}

// ── Severity filter pill ──────────────────────────────────────────────────────

const FILTERS: { value: AlertSeverity | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "critica", label: "Críticas" },
  { value: "alta", label: "Altas" },
  { value: "media", label: "Medias" },
  { value: "baja", label: "Bajas" },
  { value: "info", label: "Info" },
]

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  severity,
  count,
  active,
  onClick,
}: {
  severity: AlertSeverity
  count: number
  active: boolean
  onClick: () => void
}) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 p-4 rounded-2xl border transition-all text-left w-full",
        active
          ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1`
          : "bg-card border-border hover:border-muted-foreground/30"
      )}
      style={active ? { outlineColor: cfg.color } : undefined}
    >
      <span className={cn("text-2xl font-bold", active ? cfg.text : "text-foreground")}>
        {count}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
        <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
      </div>
    </button>
  )
}

// ── Alert row ─────────────────────────────────────────────────────────────────

function AlertRow({ item, index }: { item: AlertWithContract; index: number }) {
  const cfg = SEVERITY_CONFIG[item.severity]
  const Icon = item.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl border transition-colors",
        cfg.bg,
        cfg.border
      )}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${cfg.color}20` }}
      >
        <Icon size={17} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
              cfg.bg, cfg.text, cfg.border
            )}
          >
            {cfg.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {item.contract.contract_number}
          </span>
        </div>
        <p className={cn("text-sm font-semibold", cfg.text)}>{item.title}</p>
        <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">{item.description}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {item.contract.contract_name}
        </p>
      </div>

      {/* Link to contract */}
      <Link
        href={`/contracts/${item.contract.id}`}
        className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors mt-1"
        title="Ver contrato"
      >
        <ChevronRight size={15} className="text-muted-foreground" />
      </Link>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AlertsPageClient({ contracts }: { contracts: Contract[] }) {
  const [filter, setFilter] = useState<AlertSeverity | "all">("all")

  const allAlerts: AlertWithContract[] = useMemo(() => {
    return contracts.flatMap((c) =>
      computeAlerts(c).map((a) => ({ ...a, contract: c }))
    )
  }, [contracts])

  const counts = useMemo(
    () => ({
      critica: allAlerts.filter((a) => a.severity === "critica").length,
      alta:    allAlerts.filter((a) => a.severity === "alta").length,
      media:   allAlerts.filter((a) => a.severity === "media").length,
      baja:    allAlerts.filter((a) => a.severity === "baja").length,
      info:    allAlerts.filter((a) => a.severity === "info").length,
    }),
    [allAlerts]
  )

  const visible = filter === "all"
    ? allAlerts
    : allAlerts.filter((a) => a.severity === filter)

  const urgentCount = counts.critica + counts.alta

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Bell size={20} className="text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Centro de Alertas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allAlerts.length > 0
                ? `${allAlerts.length} alerta${allAlerts.length !== 1 ? "s" : ""} activa${allAlerts.length !== 1 ? "s" : ""} en ${contracts.length} contrato${contracts.length !== 1 ? "s" : ""}`
                : `${contracts.length} contrato${contracts.length !== 1 ? "s" : ""} sin alertas`}
            </p>
          </div>
        </div>

        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium">
            <AlertTriangle size={15} />
            {urgentCount} alerta{urgentCount !== 1 ? "s" : ""} urgente{urgentCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(["critica", "alta", "media", "baja", "info"] as AlertSeverity[]).map((s) => (
          <SummaryCard
            key={s}
            severity={s}
            count={counts[s]}
            active={filter === s}
            onClick={() => setFilter((prev) => (prev === s ? "all" : s))}
          />
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = filter === f.value
          const count = f.value === "all" ? allAlerts.length : counts[f.value as AlertSeverity]
          if (f.value !== "all" && count === 0) return null
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as AlertSeverity | "all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-muted-foreground/40 hover:text-foreground"
              )}
            >
              {f.label}
              <span className={cn(
                "text-[10px] font-bold px-1.5 rounded-full",
                isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Alerts list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bell size={24} className="text-muted-foreground/40" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1.5">
            {allAlerts.length === 0 ? "Sin alertas activas" : "Sin alertas en esta categoría"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {allAlerts.length === 0
              ? "Todos los contratos están en buen estado."
              : "Prueba seleccionando otra categoría."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item, i) => (
            <AlertRow key={`${item.contract.id}-${item.id}`} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
