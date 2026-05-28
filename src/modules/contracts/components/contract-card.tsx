"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Building,
  User2,
  Percent,
  Calendar,
  ExternalLink,
  MoreVertical,
  Banknote,
  TrendingUp,
  FileText,
} from "lucide-react"
import { StatusBadge } from "./status-badge"
import { DualProgress } from "./progress-bar"
import { resolveStatus, formatCOP, formatDate, pct } from "../lib/status"
import type { Contract } from "@/types/contract"

// ── Value chip ────────────────────────────────────────────────────────────────

function ValueChip({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Banknote
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-muted/40 rounded-xl p-3 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground leading-none truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface ContractCardProps {
  contract: Contract
  index?: number
}

export function ContractCard({ contract, index = 0 }: ContractCardProps) {
  const cfg = resolveStatus(contract.status)
  const physPct = pct(contract.physical_progress)
  const finPct = pct(contract.financial_progress)

  const executedRatio =
    Number(contract.initial_value) > 0
      ? Math.round((Number(contract.executed_value) / Number(contract.initial_value)) * 100)
      : 0

  return (
    <Link href={`/contracts/${contract.id}`} className="block">
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer"
    >
      {/* Status bar */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: cfg.color }} />

      <div className="p-5 flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          {/* Icon avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cfg.color}18` }}
          >
            <FileText size={18} style={{ color: cfg.color }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* ID row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono tracking-wider">
                {contract.contract_number}
              </code>
              <StatusBadge status={contract.status} size="sm" />
            </div>
            {/* Name */}
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {contract.contract_name || "Sin nombre"}
            </h3>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Ver contrato"
            >
              <ExternalLink size={14} />
            </button>
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Más opciones"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* ── Entity + manager ── */}
        <div className="space-y-1.5">
          {contract.contracting_entity && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building size={12} className="shrink-0" />
              <span className="truncate">{contract.contracting_entity}</span>
            </div>
          )}
          {contract.manager_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User2 size={12} className="shrink-0" />
              <span className="truncate">{contract.manager_name}</span>
            </div>
          )}
        </div>

        {/* ── Value chips ── */}
        <div className="grid grid-cols-3 gap-2">
          <ValueChip
            icon={Banknote}
            label="Valor inicial"
            value={formatCOP(contract.initial_value)}
          />
          <ValueChip
            icon={Percent}
            label="Honorarios"
            value={`${Number(contract.management_fee_percentage ?? 0).toFixed(1)}%`}
            sub={formatCOP(contract.management_fee_value)}
          />
          <ValueChip
            icon={TrendingUp}
            label="B / S"
            value={formatCOP(contract.goods_services_value)}
            sub={`${executedRatio}% ejecutado`}
          />
        </div>

        {/* ── Dual progress ── */}
        <DualProgress
          physical={physPct}
          financial={finPct}
          animationDelay={0.3 + index * 0.04}
        />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          {contract.end_date ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar size={11} />
              <span>Vence: {formatDate(contract.end_date)}</span>
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-600 font-semibold tabular-nums">F {physPct}%</span>
            <span className="text-indigo-600 font-semibold tabular-nums">$ {finPct}%</span>
          </div>
        </div>

      </div>
    </motion.article>
    </Link>
  )
}
