"use client"

import { motion } from "framer-motion"
import {
  Building2,
  Banknote,
  CalendarDays,
  User,
  ArrowUpRight,
  FileText,
  ShieldAlert,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle2,
  Hourglass,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG, resolveStatus, formatCOP } from "./DashboardPage"
import type { Contract } from "@/types/contract"

// ── Risk badge ────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { label: string; cls: string }> = {
  low:      { label: "Bajo",     cls: "bg-emerald-50 text-emerald-700" },
  medium:   { label: "Medio",    cls: "bg-amber-50   text-amber-700"   },
  high:     { label: "Alto",     cls: "bg-orange-50  text-orange-700"  },
  critical: { label: "Crítico",  cls: "bg-red-50     text-red-700"     },
}

const STATUS_ICON: Record<string, typeof Clock> = {
  in_progress:   Clock,
  liquidation:   Hourglass,
  liquidated:    CheckCircle2,
  suspended:     AlertTriangle,
  pending_start: XCircle,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(d: string | undefined | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

function pct(n: number | null | undefined): number {
  return Math.min(100, Math.max(0, Number(n ?? 0)))
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  label,
  color,
  index,
}: {
  value: number
  label: string
  color: string
  index: number
}) {
  const pv = pct(value)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className={cn("font-bold tabular-nums", color)}>{pv}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pv}%` }}
          transition={{ duration: 0.7, delay: 0.4 + index * 0.1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
        />
      </div>
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────────────────────

function ContractCard({ contract, index }: { contract: Contract; index: number }) {
  const statusKey = resolveStatus(contract.status)
  const statusCfg = STATUS_CONFIG[statusKey]
  const StatusIcon = STATUS_ICON[statusKey] ?? FileText
  const riskCfg = contract.risk_level ? (RISK_CONFIG[contract.risk_level.toLowerCase()] ?? null) : null

  const physPct = pct(contract.physical_progress)
  const finPct = pct(contract.financial_progress)
  const executedRatio = contract.initial_value > 0
    ? Math.round((Number(contract.executed_value) / Number(contract.initial_value)) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: statusCfg.color }} />

      <div className="p-5">
        {/* ── Header row ── */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <FileText size={18} className="text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            {/* ID + badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {contract.contract_number}
              </span>
              {/* Status badge */}
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${statusCfg.color}18`, color: statusCfg.color }}
              >
                <StatusIcon size={10} />
                {statusCfg.label}
              </span>
              {/* Risk badge */}
              {riskCfg && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", riskCfg.cls)}>
                  <ShieldAlert size={10} />
                  {riskCfg.label}
                </span>
              )}
            </div>
            {/* Name */}
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {contract.contract_name || "Sin nombre"}
            </h3>
          </div>

          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted shrink-0">
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* ── Entity & manager ── */}
        <div className="space-y-1.5 mb-4">
          {contract.contracting_entity && (
            <div className="flex items-center gap-2">
              <Building2 size={13} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {contract.contracting_entity}
              </span>
            </div>
          )}
          {contract.supervisor_name && (
            <div className="flex items-center gap-2">
              <User size={13} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {contract.supervisor_name}
              </span>
            </div>
          )}
        </div>

        {/* ── Value row ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Banknote size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Valor inicial
              </span>
            </div>
            <p className="text-sm font-bold text-foreground leading-none">
              {formatCOP(contract.initial_value)}
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Ejecutado
              </span>
            </div>
            <p className="text-sm font-bold text-foreground leading-none">
              {formatCOP(contract.executed_value)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{executedRatio}% del total</p>
          </div>
        </div>

        {/* ── Progress bars ── */}
        <div className="space-y-2.5 mb-4">
          <ProgressBar
            value={physPct}
            label="Avance físico"
            color="text-emerald-500"
            index={index}
          />
          <ProgressBar
            value={finPct}
            label="Avance financiero"
            color="text-indigo-500"
            index={index + 0.5}
          />
        </div>

        {/* ── Dates ── */}
        {(contract.start_date || contract.end_date) && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-3 border-t border-border">
            <CalendarDays size={11} />
            <span>
              {shortDate(contract.start_date)}
              {contract.start_date && contract.end_date && " → "}
              {shortDate(contract.end_date)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-14 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-4 border border-border">
        <FileText size={28} className="text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">No hay contratos</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Los contratos que registres aparecerán aquí con toda su información, estados y avances.
      </p>
      <button className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm shadow-primary/20 active:scale-95">
        <Plus size={15} />
        Registrar primer contrato
      </button>
    </motion.div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function ContractCards({ contracts }: { contracts: Contract[] }) {
  if (contracts.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {contracts.slice(0, 6).map((c, i) => (
        <ContractCard key={c.id} contract={c} index={i} />
      ))}
    </div>
  )
}
