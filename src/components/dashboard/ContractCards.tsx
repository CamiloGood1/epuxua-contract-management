"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Building2,
  Banknote,
  CalendarDays,
  User,
  ArrowUpRight,
  FileText,
  TrendingUp,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveStatus, formatCOP } from "./DashboardPage"
import type { Contract } from "@/types/contract"

function shortDate(d: string | undefined | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function pct(n: number | null | undefined): number {
  return Math.min(100, Math.max(0, Number(n ?? 0)))
}

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

function ContractCard({ contract, index }: { contract: Contract; index: number }) {
  const statusCfg = resolveStatus(contract.status)
  const StatusIcon = statusCfg.icon
  const finPct = pct(contract.financial_progress_pct)
  const paidRatio =
    contract.final_value > 0
      ? Math.round((Number(contract.paid_value) / Number(contract.final_value)) * 100)
      : 0

  const partyLabel =
    contract.contract_type === "INTERADMINISTRATIVO"
      ? contract.secretaria
      : contract.contractor_name

  return (
    <Link href={`/contracts/${contract.id}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 * index, duration: 0.35, ease: "easeOut" }}
        whileHover={{ y: -2 }}
        className="relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all"
      >
        <div className="h-1 w-full" style={{ backgroundColor: statusCfg.color }} />

        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <FileText size={18} className="text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {contract.contract_number}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${statusCfg.color}18`,
                    color: statusCfg.color,
                  }}
                >
                  <StatusIcon size={10} />
                  {statusCfg.label}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {contract.object || "Sin objeto"}
              </h3>
            </div>

            <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted shrink-0">
              <ArrowUpRight size={14} className="text-muted-foreground" />
            </span>
          </div>

          <div className="space-y-1.5 mb-4">
            {partyLabel && (
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{partyLabel}</span>
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

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Banknote size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Valor final
                </span>
              </div>
              <p className="text-sm font-bold text-foreground leading-none">
                {formatCOP(contract.final_value)}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Pagado
                </span>
              </div>
              <p className="text-sm font-bold text-foreground leading-none">
                {formatCOP(contract.paid_value)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{paidRatio}% del final</p>
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            <ProgressBar
              value={finPct}
              label="Avance financiero"
              color="text-indigo-500"
              index={index}
            />
          </div>

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
    </Link>
  )
}

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
      <button
        type="button"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm shadow-primary/20 active:scale-95"
      >
        <Plus size={15} />
        Registrar primer contrato
      </button>
    </motion.div>
  )
}

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
