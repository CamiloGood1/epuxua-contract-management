"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Info,
  ClipboardList,
  GitMerge,
  CalendarClock,
  Pause,
  Receipt,
  Link2,
  Paperclip,
  Bell,
  Building,
  FileText,
  ScrollText,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ContractTimeline } from "./contract-timeline"
import { ContractAlerts } from "./contract-alerts"
import { StatusBadge } from "./status-badge"
import {
  resolveStatus,
  formatCOP,
  formatDate,
  pct,
} from "../lib/status"
import { computeAlerts, type AlertContext } from "../lib/alerts"
import type { Contract, ContractFollowup, FollowupAlertLevel } from "@/types/contract"

interface Tab {
  id: string
  label: string
  icon: typeof Info
}

const BASE_TABS: Tab[] = [
  { id: "info", label: "Información", icon: Info },
  { id: "seguimiento", label: "Seguimiento", icon: ClipboardList },
  { id: "adiciones", label: "Adiciones", icon: GitMerge },
  { id: "prorrogas", label: "Prórrogas", icon: CalendarClock },
  { id: "suspensiones", label: "Suspensiones", icon: Pause },
  { id: "facturacion", label: "Facturación", icon: Receipt },
  { id: "derivados", label: "Derivados", icon: Link2 },
  { id: "documentos", label: "Documentos", icon: Paperclip },
  { id: "alertas", label: "Alertas", icon: Bell },
]

const ALERT_LEVEL_STYLES: Record<FollowupAlertLevel, string> = {
  VERDE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AMARILLO: "bg-amber-100 text-amber-800 border-amber-200",
  ROJO: "bg-red-100 text-red-800 border-red-200",
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  )
}

function partyName(contract: Contract): string | null {
  if (contract.contract_type === "INTERADMINISTRATIVO") {
    return contract.secretaria
  }
  return contract.contractor_name
}

function InfoTab({
  contract,
  physicalProgress,
}: {
  contract: Contract
  physicalProgress?: number | null
}) {
  const cfg = resolveStatus(contract.status)
  const isInteradmin = contract.contract_type === "INTERADMINISTRATIVO"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText size={15} className="text-primary" />
          Datos generales
        </h3>
        <Field label="Número de contrato" value={contract.contract_number} />
        <Field label="Año" value={String(contract.year)} />
        <Field label="Tipo" value={contract.contract_type} />
        <Field label="Modalidad" value={contract.selection_modality} />
        <Field label="Clase" value={contract.contract_class} />
        <Field label="Objeto" value={contract.object} />
        <Field label="Estado" value={cfg.label} />
        <Field label="Área responsable" value={contract.area_name} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Inicio" value={formatDate(contract.start_date)} />
          <Field label="Fin" value={formatDate(contract.end_date)} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building size={15} className="text-primary" />
          Partes
        </h3>
        <Field
          label={isInteradmin ? "Secretaría" : "Contratista"}
          value={partyName(contract)}
        />
        <Field label="Contratista (registro)" value={contract.contractor_name} />
        <Field label="Supervisor" value={contract.supervisor_name} />
        {contract.parent_contract_number && (
          <Field label="Contrato padre" value={contract.parent_contract_number} />
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ScrollText size={15} className="text-primary" />
          Resumen financiero
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Valor inicial", value: formatCOP(contract.initial_value) },
            { label: "Adiciones", value: formatCOP(contract.total_additions_value) },
            { label: "Valor final", value: formatCOP(contract.final_value) },
            { label: "Pagado", value: formatCOP(contract.paid_value) },
            { label: "Pendiente", value: formatCOP(contract.pending_value) },
          ].map((item) => (
            <div key={item.label} className="bg-muted/40 rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Avance financiero: {pct(contract.financial_progress_pct)}%
          {physicalProgress != null
            ? ` · Avance físico (último seguimiento): ${pct(physicalProgress)}%`
            : " · Avance físico: sin seguimiento"}
        </p>
      </div>

      {isInteradmin && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">Interadministrativo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Secretaría" value={contract.secretaria} />
            <Field label="Honorarios admin." value={formatCOP(contract.admin_fee_total)} />
            <Field label="Mandato / encargo" value={formatCOP(contract.mandate_pool_total)} />
          </div>
        </div>
      )}

      {(contract.policy_number || contract.policy_issuer) && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">Póliza</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Número" value={contract.policy_number} />
            <Field label="Aseguradora" value={contract.policy_issuer} />
            <Field label="Inicio" value={formatDate(contract.policy_start)} />
            <Field label="Fin" value={formatDate(contract.policy_end)} />
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
          <CalendarDays size={15} className="text-primary" />
          Línea de tiempo
        </h3>
        <ContractTimeline contract={contract} physicalProgress={physicalProgress} />
      </div>
    </div>
  )
}

function FollowupsTab({ followups }: { followups: ContractFollowup[] }) {
  if (followups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ClipboardList size={32} className="text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold text-foreground">Sin seguimientos</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Registra cortes periódicos en la tabla contract_followups para ver avance físico y semáforo.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Período</th>
              <th className="px-4 py-3 font-semibold">Físico</th>
              <th className="px-4 py-3 font-semibold">Financiero</th>
              <th className="px-4 py-3 font-semibold">Semáforo</th>
              <th className="px-4 py-3 font-semibold">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {followups.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(f.followup_date)}</td>
                <td className="px-4 py-3">{f.period_label ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">
                  {f.physical_progress != null ? `${f.physical_progress}%` : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {f.financial_progress != null ? `${f.financial_progress}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      ALERT_LEVEL_STYLES[f.alert_level]
                    )}
                  >
                    {f.alert_level}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {f.observations ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DerivedTab({ contracts }: { contracts: Contract[] }) {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Link2 size={32} className="text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold text-foreground">Sin contratos derivados</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Los contratos directos vinculados a este interadministrativo aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contracts.map((c) => (
        <Link
          key={c.id}
          href={`/contracts/${c.id}`}
          className="block bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                  {c.contract_number}
                </code>
                <StatusBadge status={c.status} size="sm" />
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2">{c.object}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.contractor_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">{formatCOP(c.final_value)}</p>
              <p className="text-[10px] text-muted-foreground">
                Pagado {pct(c.financial_progress_pct)}%
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function EmptyTab({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Info
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={24} className="text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
    </div>
  )
}

export function ContractTabs({
  contract,
  physicalProgress,
  followups,
  derivedContracts = [],
}: {
  contract: Contract
  physicalProgress?: number | null
  followups: ContractFollowup[]
  derivedContracts?: Contract[]
}) {
  const [activeTab, setActiveTab] = useState("info")

  const alertContext: AlertContext = useMemo(
    () => ({
      physicalProgress,
      hasFollowups: followups.length > 0,
    }),
    [physicalProgress, followups.length]
  )

  const visibleTabs = useMemo(() => {
    return BASE_TABS.filter(
      (t) => t.id !== "derivados" || contract.contract_type === "INTERADMINISTRATIVO"
    )
  }, [contract.contract_type])

  const alertCount = computeAlerts(contract, alertContext).filter(
    (a) => a.severity === "critica" || a.severity === "alta"
  ).length

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none bg-muted/40 rounded-xl p-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab
            const badge =
              tab.id === "alertas" && alertCount > 0
                ? alertCount
                : tab.id === "seguimiento" && followups.length > 0
                  ? followups.length
                  : tab.id === "derivados" && derivedContracts.length > 0
                    ? derivedContracts.length
                    : null
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-background rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <Icon size={13} className="relative z-10 shrink-0" />
                <span className="relative z-10">{tab.label}</span>
                {badge != null && (
                  <span className="relative z-10 text-[10px] font-bold bg-destructive text-white px-1.5 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "info" && (
            <InfoTab contract={contract} physicalProgress={physicalProgress} />
          )}
          {activeTab === "seguimiento" && <FollowupsTab followups={followups} />}
          {activeTab === "derivados" && <DerivedTab contracts={derivedContracts} />}
          {activeTab === "alertas" && (
            <ContractAlerts contract={contract} alertContext={alertContext} />
          )}
          {activeTab === "adiciones" && (
            <EmptyTab icon={GitMerge} title="Sin adiciones" description="Las adiciones en valor o plazo aparecerán aquí." />
          )}
          {activeTab === "prorrogas" && (
            <EmptyTab icon={CalendarClock} title="Sin prórrogas" description="Las prórrogas del contrato se registrarán aquí." />
          )}
          {activeTab === "suspensiones" && (
            <EmptyTab icon={Pause} title="Sin suspensiones" description="Los registros de suspensión aparecerán aquí." />
          )}
          {activeTab === "facturacion" && (
            <EmptyTab icon={Receipt} title="Sin facturas" description="Los pagos asociados al contrato se listarán aquí." />
          )}
          {activeTab === "documentos" && (
            <EmptyTab icon={Paperclip} title="Sin documentos" description="Actas, informes y soportes del contrato." />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
