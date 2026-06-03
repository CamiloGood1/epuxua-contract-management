"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MaterialIcon } from "@/components/ui/material-icon"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import { formatDate, formatCOP, pct } from "@/modules/contracts/lib/status"
import { cn } from "@/lib/utils"
import type { ContractTracking, FollowupAlertLevel } from "@/types/contract"

type KanbanColumn = {
  id: string
  title: string
  icon: string
  headerClass: string
  levels: (FollowupAlertLevel | "NONE")[]
}

const COLUMNS: KanbanColumn[] = [
  {
    id: "en-curso",
    title: "En curso",
    icon: "trending_up",
    headerClass: "border-emerald-200 bg-emerald-50/80",
    levels: ["VERDE", "NONE"],
  },
  {
    id: "atencion",
    title: "Atención",
    icon: "warning",
    headerClass: "border-amber-200 bg-amber-50/80",
    levels: ["AMARILLO"],
  },
  {
    id: "critico",
    title: "Crítico",
    icon: "error",
    headerClass: "border-red-200 bg-red-50/80",
    levels: ["ROJO"],
  },
]

function columnFor(row: ContractTracking): string {
  const level = row.last_alert_level ?? "NONE"
  if (level === "ROJO") return "critico"
  if (level === "AMARILLO") return "atencion"
  return "en-curso"
}

function KanbanCard({ row }: { row: ContractTracking }) {
  const fin = pct(row.financial_progress_pct)
  const phys = row.last_physical_progress

  return (
    <Link
      href={`/contracts/${row.id}`}
      className="block bg-white border border-[#EAEAEA] rounded-lg p-4 shadow-sm hover:shadow-md hover:border-[var(--corporate-blue)]/25 transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <code className="text-[10px] font-mono text-muted-foreground">{row.contract_number}</code>
        <StatusBadge status={row.status} size="sm" />
      </div>
      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{row.object}</p>
      <p className="text-[11px] text-muted-foreground mt-1 truncate">{row.contractor_name}</p>

      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-muted-foreground">Físico</span>
            <span className="font-bold">{phys != null ? `${pct(phys)}%` : "—"}</span>
          </div>
          <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${phys != null ? pct(phys) : 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-muted-foreground">Financiero</span>
            <span className="font-bold text-[var(--corporate-blue)]">{fin}%</span>
          </div>
          <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--corporate-blue)] rounded-full"
              style={{ width: `${fin}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#EAEAEA] flex justify-between text-[10px] text-muted-foreground">
        <span>
          {row.last_followup_date ? formatDate(row.last_followup_date) : "Sin seguimiento"}
        </span>
        <span className="font-medium text-foreground">{formatCOP(row.final_value)}</span>
      </div>
    </Link>
  )
}

export function SeguimientoPageClient({ rows }: { rows: ContractTracking[] }) {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: rows.filter((r) => columnFor(r) === col.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#151c27] tracking-tight">
            Seguimiento de proyectos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tablero Kanban por semáforo de alerta — {rows.length} contrato
            {rows.length !== 1 ? "s" : ""} activos
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold"
        >
          <MaterialIcon name="add" size={18} />
          Nuevo seguimiento
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="epuxua-card py-16 text-center">
          <MaterialIcon name="query_stats" size={40} className="text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">No hay contratos en ejecución.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {grouped.map((col, ci) => (
            <div key={col.id} className="flex flex-col min-h-[320px]">
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-t-xl border",
                  col.headerClass
                )}
              >
                <div className="flex items-center gap-2">
                  <MaterialIcon name={col.icon} size={18} />
                  <span className="text-sm font-bold">{col.title}</span>
                </div>
                <span className="text-xs font-bold bg-white/80 px-2 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              </div>
              <div className="flex-1 bg-[#f1f5f9]/60 border border-t-0 border-[#EAEAEA] rounded-b-xl p-3 space-y-3">
                {col.items.map((row, i) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.05 + i * 0.03 }}
                  >
                    <KanbanCard row={row} />
                  </motion.div>
                ))}
                {col.items.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-8">Sin contratos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
