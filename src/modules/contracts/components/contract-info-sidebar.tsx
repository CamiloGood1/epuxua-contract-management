"use client"

import {
  Building,
  User2,
  Calendar,
  CalendarClock,
  Banknote,
  ArrowLeft,
  MapPin,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { StatusBadge } from "./status-badge"
import { ProgressBar } from "./progress-bar"
import { resolveStatus, formatCOP, formatDate, pct } from "../lib/status"
import { cn } from "@/lib/utils"
import type { Contract } from "@/types/contract"
import { SecopLink } from "./secop-link"

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

function contractingPartyLabel(contract: Contract): string {
  if (contract.contract_type === "INTERADMINISTRATIVO") {
    return contract.secretaria ?? "—"
  }
  return contract.contractor_name
}

interface ContractInfoSidebarProps {
  contract: Contract
  physicalProgress?: number | null
  backHref?: string
  backLabel?: string
}

export function ContractInfoSidebar({
  contract,
  physicalProgress,
  backHref = "/contracts",
  backLabel = "Todos los contratos",
}: ContractInfoSidebarProps) {
  const cfg = resolveStatus(contract.status)
  const finPct = pct(contract.financial_progress_pct)
  const physPct = physicalProgress != null ? pct(physicalProgress) : 0

  const isInteradmin = contract.contract_type === "INTERADMINISTRATIVO"
  const partyLabel = isInteradmin ? "Secretaría" : "Contratista"

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group w-fit"
      >
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        {backLabel}
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <StatusBadge status={contract.status} size="md" showDot={false} />
          <code className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {contract.contract_number}
          </code>
        </div>

        <h1 className="text-base font-bold text-foreground leading-snug line-clamp-4">
          {contract.object || "Sin objeto"}
        </h1>

        <div className="h-0.5 rounded-full" style={{ backgroundColor: cfg.color }} />

        {contract.area_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} />
            {contract.area_name}
          </div>
        )}

        {contract.days_remaining != null && contract.status === "EN_EJECUCION" && (
          <p className="text-xs text-muted-foreground">
            {contract.days_remaining >= 0
              ? `${contract.days_remaining} días restantes`
              : `Vencido hace ${Math.abs(contract.days_remaining)} días`}
          </p>
        )}

        <SecopLink url={contract.secop_url} variant="button" className="mt-1" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Avance de ejecución
        </p>
        {physicalProgress != null ? (
          <ProgressBar
            value={physPct}
            label="Físico"
            colorClass="bg-emerald-500"
            animationDelay={0.3}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Físico: <span className="italic">Sin seguimiento</span>
          </p>
        )}
        <ProgressBar
          value={finPct}
          label="Financiero"
          colorClass="bg-indigo-500"
          animationDelay={0.4}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
          Valores del contrato
        </p>
        <div>
          <ValueRow label="Valor inicial" value={formatCOP(contract.initial_value)} />
          {contract.total_additions_value > 0 && (
            <ValueRow
              label="Adiciones"
              value={formatCOP(contract.total_additions_value)}
            />
          )}
          <ValueRow label="Valor final" value={formatCOP(contract.final_value)} accent />
          <ValueRow label="Pagado" value={formatCOP(contract.paid_value)} />
          <ValueRow label="Pendiente" value={formatCOP(contract.pending_value)} />
        </div>
      </div>

      {isInteradmin && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
            Interadministrativo
          </p>
          <div>
            <ValueRow label="Honorarios admin." value={formatCOP(contract.admin_fee_total)} />
            <ValueRow label="Mandato / encargo" value={formatCOP(contract.mandate_pool_total)} />
            {contract.pending_collection != null && contract.pending_collection > 0 && (
              <ValueRow
                label="Cartera pendiente"
                value={formatCOP(contract.pending_collection)}
              />
            )}
          </div>
        </div>
      )}

      {(contract.policy_number || contract.policy_issuer) && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Shield size={12} className="text-primary" />
            Póliza
          </p>
          <InfoRow icon={Shield} label="Número" value={contract.policy_number} />
          <InfoRow icon={Building} label="Aseguradora" value={contract.policy_issuer} />
          <InfoRow
            icon={Calendar}
            label="Vigencia hasta"
            value={formatDate(contract.policy_end)}
          />
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Participantes
        </p>
        <InfoRow icon={Building} label={partyLabel} value={contractingPartyLabel(contract)} />
        {!isInteradmin && (
          <InfoRow icon={Building} label="Contratista" value={contract.contractor_name} />
        )}
        <InfoRow icon={User2} label="Supervisor" value={contract.supervisor_name} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Fechas
        </p>
        <InfoRow
          icon={Calendar}
          label="Suscripción"
          value={formatDate(contract.subscription_date)}
        />
        <InfoRow icon={Calendar} label="Inicio" value={formatDate(contract.start_date)} />
        <InfoRow icon={CalendarClock} label="Fin" value={formatDate(contract.end_date)} />
      </div>
    </motion.aside>
  )
}
