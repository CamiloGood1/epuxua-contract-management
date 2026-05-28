"use client"

import {
  Building,
  User2,
  Calendar,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  Banknote,
  TrendingUp,
  Percent,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { StatusBadge } from "./status-badge"
import { ProgressBar } from "./progress-bar"
import { resolveStatus, formatCOP, formatDate, pct } from "../lib/status"
import { cn } from "@/lib/utils"
import type { Contract } from "@/types/contract"

// ── Risk semaphore ────────────────────────────────────────────────────────────

function riskLevel(contract: Contract): "low" | "medium" | "high" {
  if (contract.status === "suspended") return "high"
  if (contract.status === "liquidated") return "low"
  const p = pct(contract.physical_progress)
  if (p >= 70) return "low"
  if (p >= 40) return "medium"
  return "high"
}

const RISK_CONFIG = {
  low: {
    label: "Riesgo Bajo",
    icon: ShieldCheck,
    colors: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Riesgo Medio",
    icon: ShieldAlert,
    colors: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  high: {
    label: "Riesgo Alto",
    icon: TriangleAlert,
    colors: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm text-foreground font-medium leading-snug">{value}</p>
      </div>
    </div>
  )
}

// ── Value row ─────────────────────────────────────────────────────────────────

function ValueRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", accent && "text-primary")}>
        {value}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractInfoSidebar({ contract }: { contract: Contract }) {
  const cfg = resolveStatus(contract.status)
  const risk = riskLevel(contract)
  const riskCfg = RISK_CONFIG[risk]
  const RiskIcon = riskCfg.icon

  const physPct = pct(contract.physical_progress)
  const finPct = pct(contract.financial_progress)

  const executedRatio =
    Number(contract.initial_value) > 0
      ? Math.round((Number(contract.executed_value ?? 0) / Number(contract.initial_value)) * 100)
      : 0

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      {/* Back */}
      <Link
        href="/contracts"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group w-fit"
      >
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Todos los contratos
      </Link>

      {/* Contract identity */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        {/* Status + code */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <StatusBadge status={contract.status} size="md" showDot={false} />
          <code className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {contract.contract_number}
          </code>
        </div>

        {/* Name */}
        <h1 className="text-base font-bold text-foreground leading-snug">
          {contract.contract_name || "Sin nombre"}
        </h1>

        {/* Status accent bar */}
        <div className="h-0.5 rounded-full" style={{ backgroundColor: cfg.color }} />

        {/* Risk badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border w-full justify-center",
            riskCfg.colors
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", riskCfg.dot)} />
          <RiskIcon size={13} />
          {riskCfg.label}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Avance de ejecución
        </p>
        <ProgressBar value={physPct} label="Físico" colorClass="bg-emerald-500" animationDelay={0.3} />
        <ProgressBar value={finPct} label="Financiero" colorClass="bg-indigo-500" animationDelay={0.4} />
      </div>

      {/* Financial summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
          Valores del contrato
        </p>
        <div>
          <ValueRow label="Valor inicial" value={formatCOP(contract.initial_value)} accent />
          <ValueRow
            label={`Honorarios (${Number(contract.management_fee_percentage ?? 0).toFixed(1)}%)`}
            value={formatCOP(contract.management_fee_value)}
          />
          <ValueRow label="Bienes y servicios" value={formatCOP(contract.goods_services_value)} />
          <ValueRow label="Valor ejecutado" value={formatCOP(contract.executed_value)} />
          <ValueRow
            label="% Ejecutado"
            value={`${executedRatio}%`}
          />
        </div>
      </div>

      {/* Parties & dates */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Participantes
        </p>
        <InfoRow icon={Building} label="Entidad contratante" value={contract.contracting_entity} />
        <InfoRow icon={Building} label="Contratista" value={contract.contractor_entity} />
        <InfoRow icon={User2} label="Gerente" value={contract.manager_name} />
        <InfoRow icon={User2} label="Supervisor" value={contract.supervisor_name} />
      </div>

      {/* Dates */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Fechas
        </p>
        <InfoRow icon={Calendar} label="Fecha de inicio" value={formatDate(contract.start_date)} />
        <InfoRow icon={CalendarClock} label="Fecha de vencimiento" value={formatDate(contract.end_date)} />
      </div>
    </motion.aside>
  )
}
