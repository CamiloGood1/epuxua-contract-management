"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Building2,
  User2,
  Calendar,
  ExternalLink,
  Banknote,
  TrendingUp,
  FileText,
  GitBranch,
} from "lucide-react"
import { StatusBadge } from "./status-badge"
import { DualProgress } from "./progress-bar"
import { resolveStatus, formatCOP, formatDate, pct } from "../lib/status"
import type { Contract } from "@/types/contract"
import { SecopLink } from "./secop-link"

function MetaRow({ icon: Icon, text }: { icon: typeof Building2; text: string }) {
  if (!text) return null
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  )
}

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

interface ContractCardProps {
  contract: Contract
  index?: number
  // Progreso físico viene de v_contract_tracking si está disponible
  physicalProgress?: number | null
}

export function ContractCard({ contract, index = 0, physicalProgress }: ContractCardProps) {
  const cfg = resolveStatus(contract.status)
  const finPct  = pct(contract.financial_progress_pct)
  const physPct = pct(physicalProgress ?? 0)

  const finalValue = contract.final_value ?? (contract.initial_value + (contract.total_additions_value ?? 0))

  // Nombre a mostrar: "contratante" = quién contrata a EPUXUA (interadmin: secretaria, directo: contractor)
  const partyName = contract.contract_type === "INTERADMINISTRATIVO"
    ? contract.secretaria
    : contract.contractor_name

  return (
    <Link href={`/contracts/${contract.id}`} className="block">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
        whileHover={{ y: -3, transition: { duration: 0.18 } }}
        className="group relative bg-white border border-[#EAEAEA] rounded-xl overflow-hidden hover:border-[var(--corporate-blue)]/25 hover:shadow-md transition-all cursor-pointer"
      >
        {/* Barra de color según estado */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: cfg.color }} />

        <div className="p-5 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${cfg.color}18` }}
            >
              {contract.parent_contract_id
                ? <GitBranch size={18} style={{ color: cfg.color }} />
                : <FileText    size={18} style={{ color: cfg.color }} />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono tracking-wider">
                  {contract.contract_number} · {contract.year}
                </code>
                <StatusBadge status={contract.status} size="sm" />
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {contract.object}
              </h3>
            </div>

            <button
              onClick={(e) => e.preventDefault()}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              aria-label="Ver contrato"
            >
              <ExternalLink size={14} />
            </button>
          </div>

          {/* Partes */}
          <div className="space-y-1.5">
            {partyName && <MetaRow icon={Building2} text={partyName} />}
            {contract.supervisor_name && (
              <MetaRow icon={User2} text={contract.supervisor_name} />
            )}
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-2">
            <ValueChip
              icon={Banknote}
              label="Valor final"
              value={formatCOP(finalValue)}
              sub={contract.total_additions_value > 0
                ? `+${formatCOP(contract.total_additions_value)} adic.`
                : undefined}
            />
            <ValueChip
              icon={TrendingUp}
              label="Pagado"
              value={formatCOP(contract.paid_value)}
              sub={`${finPct.toFixed(1)}% financiero`}
            />
          </div>

          {/* Progreso dual */}
          <DualProgress
            physical={physPct}
            financial={finPct}
            animationDelay={0.3 + index * 0.04}
          />

          {contract.secop_url && (
            <div onClick={(e) => e.preventDefault()} className="pt-0.5">
              <SecopLink url={contract.secop_url} className="text-[11px]" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border gap-2 flex-wrap">
            {contract.end_date ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar size={11} />
                <span>
                  {contract.days_remaining != null && contract.days_remaining <= 30
                    ? <span className="text-destructive font-medium">Vence: {formatDate(contract.end_date)}</span>
                    : `Vence: ${formatDate(contract.end_date)}`}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/50">Sin fecha fin</span>
            )}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-600 font-semibold tabular-nums">F {physPct}%</span>
              <span className="text-indigo-600 font-semibold tabular-nums">$ {finPct.toFixed(1)}%</span>
            </div>
          </div>

        </div>
      </motion.article>
    </Link>
  )
}
