"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  User2,
  ScrollText,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ContractTimeline } from "./contract-timeline"
import { resolveStatus, formatCOP, formatDate } from "../lib/status"
import type { Contract } from "@/types/contract"

// ── Tab definition ────────────────────────────────────────────────────────────

interface Tab {
  id: string
  label: string
  icon: typeof Info
  badge?: number
}

const TABS: Tab[] = [
  { id: "info",           label: "Información",   icon: Info         },
  { id: "seguimientos",   label: "Seguimientos",   icon: ClipboardList },
  { id: "adiciones",      label: "Adiciones",      icon: GitMerge     },
  { id: "prorrogas",      label: "Prórrogas",      icon: CalendarClock },
  { id: "suspensiones",   label: "Suspensiones",   icon: Pause        },
  { id: "facturacion",    label: "Facturación",    icon: Receipt      },
  { id: "derivados",      label: "Derivados",      icon: Link2        },
  { id: "documentos",     label: "Documentos",     icon: Paperclip    },
  { id: "alertas",        label: "Alertas",        icon: Bell         },
]

// ── Info tab ──────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  )
}

function InfoTab({ contract }: { contract: Contract }) {
  const cfg = resolveStatus(contract.status)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* General */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText size={15} className="text-primary" />
          Datos generales
        </h3>
        <Field label="Número de contrato" value={contract.contract_number} />
        <Field label="Nombre" value={contract.contract_name} />
        <Field label="Objeto del contrato" value={contract.contract_object} />
        <Field label="Estado" value={cfg.label} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha inicio" value={formatDate(contract.start_date)} />
          <Field label="Fecha vencimiento" value={formatDate(contract.end_date)} />
        </div>
        <Field label="Nivel de riesgo" value={contract.risk_level ?? "No definido"} />
      </div>

      {/* Parties */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building size={15} className="text-primary" />
          Entidades y responsables
        </h3>
        <Field label="Entidad contratante" value={contract.contracting_entity} />
        <Field label="Contratista / Ejecutor" value={contract.contractor_entity} />
        <Field label="Gerente" value={contract.manager_name} />
        <Field label="Supervisor" value={contract.supervisor_name} />
      </div>

      {/* Financials */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ScrollText size={15} className="text-primary" />
          Resumen financiero
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Valor inicial", value: formatCOP(contract.initial_value) },
            { label: `Honorarios (${Number(contract.management_fee_percentage ?? 0).toFixed(1)}%)`, value: formatCOP(contract.management_fee_value) },
            { label: "Bienes y servicios", value: formatCOP(contract.goods_services_value) },
            { label: "Valor ejecutado", value: formatCOP(contract.executed_value) },
            {
              label: "Saldo pendiente",
              value: formatCOP(
                Math.max(0, Number(contract.initial_value ?? 0) - Number(contract.executed_value ?? 0))
              ),
            },
          ].map((item) => (
            <div key={item.label} className="bg-muted/40 rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">
                {item.label}
              </p>
              <p className="text-sm font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
          <CalendarClock size={15} className="text-primary" />
          Línea de tiempo
        </h3>
        <ContractTimeline contract={contract} />
      </div>
    </div>
  )
}

// ── Empty tab ─────────────────────────────────────────────────────────────────

function EmptyTab({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: typeof Info
  title: string
  description: string
  cta: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={24} className="text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      <button className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm shadow-primary/20">
        {cta}
      </button>
    </div>
  )
}

// ── Tab content router ────────────────────────────────────────────────────────

function TabContent({ tabId, contract }: { tabId: string; contract: Contract }) {
  switch (tabId) {
    case "info":
      return <InfoTab contract={contract} />
    case "seguimientos":
      return (
        <EmptyTab
          icon={ClipboardList}
          title="Sin seguimientos"
          description="Registra el primer seguimiento periódico del contrato para llevar un historial de avance."
          cta="+ Nuevo seguimiento"
        />
      )
    case "adiciones":
      return (
        <EmptyTab
          icon={GitMerge}
          title="Sin adiciones"
          description="Las adiciones en valor o plazo al contrato aparecerán aquí."
          cta="+ Registrar adición"
        />
      )
    case "prorrogas":
      return (
        <EmptyTab
          icon={CalendarClock}
          title="Sin prórrogas"
          description="Las prórrogas del contrato se registrarán y visualizarán aquí."
          cta="+ Registrar prórroga"
        />
      )
    case "suspensiones":
      return (
        <EmptyTab
          icon={Pause}
          title="Sin suspensiones"
          description="Si el contrato es suspendido, el registro aparecerá en esta sección."
          cta="+ Registrar suspensión"
        />
      )
    case "facturacion":
      return (
        <EmptyTab
          icon={Receipt}
          title="Sin facturas"
          description="Las facturas y pagos asociados al contrato se registrarán aquí."
          cta="+ Registrar factura"
        />
      )
    case "derivados":
      return (
        <EmptyTab
          icon={Link2}
          title="Sin contratos derivados"
          description="Los contratos derivados o relacionados se vincularán aquí."
          cta="+ Vincular contrato"
        />
      )
    case "documentos":
      return (
        <EmptyTab
          icon={Paperclip}
          title="Sin documentos"
          description="Sube actas, informes, facturas y soportes del contrato."
          cta="+ Subir documento"
        />
      )
    case "alertas":
      return (
        <EmptyTab
          icon={Bell}
          title="Sin alertas"
          description="Las alertas automáticas de vencimiento y ejecución aparecerán aquí."
          cta="+ Configurar alertas"
        />
      )
    default:
      return null
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContractTabs({ contract }: { contract: Contract }) {
  const [activeTab, setActiveTab] = useState("info")

  return (
    <div className="flex flex-col gap-4">
      {/* Tab navigation */}
      <div className="relative">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none bg-muted/40 rounded-xl p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
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
                {tab.badge != null && (
                  <span className="relative z-10 text-[10px] font-bold bg-destructive text-white px-1.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <TabContent tabId={activeTab} contract={contract} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
