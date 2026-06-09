"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Plus, ChevronDown, ChevronRight,
  FileText, User, DollarSign, Calendar, Clock, AlertTriangle,
  TrendingUp, BarChart2, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"
import type { FuncionamientoContract } from "@/services/funcionamiento.service"
import type { ProjectDetail } from "@/types/project"

// ── Helpers de presentación ───────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  EN_EJECUCION: "En ejecución",
  SUSPENDIDO: "Suspendido",
  TERMINADO: "Terminado",
  TERMINADO_ANTICIPADAMENTE: "T. anticipado",
  LIQUIDADO: "Liquidado",
  CIERRE_CONTRACTUAL: "Cierre contractual",
  DECLARADO_FALLIDO: "Fallido",
  ACTA_NO_EJECUCION: "No ejecución",
  NO_SUSCRIPCION: "No suscripción",
}

const STATUS_CLASSES: Record<string, string> = {
  EN_EJECUCION: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SUSPENDIDO: "bg-yellow-100 text-yellow-700 border-yellow-200",
  TERMINADO: "bg-slate-100 text-slate-600 border-slate-200",
  TERMINADO_ANTICIPADAMENTE: "bg-orange-100 text-orange-700 border-orange-200",
  LIQUIDADO: "bg-blue-100 text-blue-700 border-blue-200",
  CIERRE_CONTRACTUAL: "bg-purple-100 text-purple-700 border-purple-200",
  DECLARADO_FALLIDO: "bg-red-100 text-red-700 border-red-200",
}

const MODALITY_LABELS: Record<string, string> = {
  CONTRATACION_DIRECTA: "Contratación directa",
  INVITACION_ABIERTA: "Invitación abierta",
  INVITACION_PRESELECCIONADOS: "Preseleccionados",
  CONCURSO_MERITOS: "Concurso de méritos",
  ORDEN_COMPRA: "Orden de compra",
  ACUERDO_MARCO: "Acuerdo marco",
}

function statusLabel(s: string) { return STATUS_LABELS[s] ?? s }
function statusClass(s: string) { return STATUS_CLASSES[s] ?? "bg-muted text-muted-foreground border-border" }
function modalityLabel(m: string | null) { if (!m) return "—"; return MODALITY_LABELS[m] ?? m }

function fmt(d: string | null): string {
  if (!d) return "—"
  return new Date(d + "T12:00:00").toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function pct(n: number | null | undefined) {
  if (n == null) return "—"
  return `${Math.round(n)}%`
}

// ── Grupos de estado ─────────────────────────────────────────────────────────

type StatusGroup = {
  key: string
  label: string
  statuses: string[]
  color: string
}

const STATUS_GROUPS: StatusGroup[] = [
  {
    key: "activos",
    label: "Contratos activos",
    statuses: ["EN_EJECUCION"],
    color: "text-emerald-700",
  },
  {
    key: "suspendidos",
    label: "Contratos suspendidos",
    statuses: ["SUSPENDIDO"],
    color: "text-yellow-700",
  },
  {
    key: "finalizados",
    label: "Contratos finalizados",
    statuses: ["TERMINADO", "TERMINADO_ANTICIPADAMENTE", "CIERRE_CONTRACTUAL", "ACTA_NO_EJECUCION", "NO_SUSCRIPCION"],
    color: "text-slate-600",
  },
  {
    key: "liquidados",
    label: "Contratos liquidados",
    statuses: ["LIQUIDADO", "DECLARADO_FALLIDO"],
    color: "text-blue-700",
  },
]

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "blue",
}: {
  icon: typeof FileText
  label: string
  value: string
  sub?: string
  accent?: "blue" | "green" | "amber" | "red" | "purple"
}) {
  const accents = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  }
  return (
    <div className="epuxua-card p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", accents[accent])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Detalle expandible ────────────────────────────────────────────────────────

function DetailRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs text-right break-words max-w-[60%]", valueClass ?? "text-foreground")}>{value}</span>
    </div>
  )
}

function ContractDetail({ c }: { c: FuncionamientoContract }) {
  const daysClass =
    c.days_remaining == null ? "" :
    c.days_remaining <= 0 ? "text-red-600 font-semibold" :
    c.days_remaining <= 30 ? "text-amber-600 font-semibold" : ""

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="bg-muted/20 border-t border-border px-6 py-6">
        {/* Objeto completo */}
        {c.object && (
          <div className="mb-5 pb-4 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Objeto del contrato</p>
            <p className="text-sm text-foreground leading-relaxed">{c.object}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Información general */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Información general</p>
            <div>
              <DetailRow label="Tipo de contratación" value={c.contract_type} />
              <DetailRow label="Modalidad" value={modalityLabel(c.selection_modality)} />
              <DetailRow label="Clase" value={c.contract_class ?? "—"} />
              <DetailRow label="Año" value={String(c.year)} />
              <DetailRow label="Área responsable" value={c.area_name ?? "—"} />
              <DetailRow label="Supervisor" value={c.supervisor_name ?? "—"} />
              {c.interventor && <DetailRow label="Interventor" value={c.interventor} />}
              {c.resource_type && <DetailRow label="Tipo de recurso" value={c.resource_type} />}
            </div>
          </div>

          {/* Partes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Contratista</p>
            <div>
              <DetailRow label="Nombre" value={c.contractor_name} />
              {c.contractor_document && <DetailRow label="Documento" value={c.contractor_document} />}
              {c.contractor_person_type && (
                <DetailRow label="Tipo persona" value={c.contractor_person_type === "NATURAL" ? "Natural" : "Jurídica"} />
              )}
            </div>

            {/* Fechas */}
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3 mt-5">Fechas</p>
            <div>
              {c.subscription_date && <DetailRow label="Suscripción" value={fmt(c.subscription_date)} />}
              {c.publication_date && <DetailRow label="Publicación" value={fmt(c.publication_date)} />}
              {c.start_date && <DetailRow label="Inicio" value={fmt(c.start_date)} />}
              {c.end_date && <DetailRow label="Terminación" value={fmt(c.end_date)} />}
              {c.initial_term_text && <DetailRow label="Plazo" value={c.initial_term_text} />}
              {c.initial_term_days != null && <DetailRow label="Duración (días)" value={String(c.initial_term_days)} />}
              {c.liquidation_date && <DetailRow label="Liquidación" value={fmt(c.liquidation_date)} />}
              {c.days_remaining != null && (
                <DetailRow
                  label="Días restantes"
                  value={c.days_remaining > 0 ? `${c.days_remaining} días` : "Vencido"}
                  valueClass={daysClass}
                />
              )}
            </div>
          </div>

          {/* Financiero */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Información financiera</p>
            <div>
              <DetailRow label="Valor inicial" value={formatCOP(c.initial_value)} valueClass="font-semibold" />
              {c.total_additions_value > 0 && (
                <DetailRow label="Adiciones" value={formatCOP(c.total_additions_value)} valueClass="text-amber-700" />
              )}
              <DetailRow
                label={c.total_additions_value > 0 ? "Valor total" : "Valor contratado"}
                value={formatCOP(c.final_value)}
                valueClass="font-bold"
              />
              {c.monthly_value != null && c.monthly_value > 0 && (
                <DetailRow label="Valor mensual" value={formatCOP(c.monthly_value)} />
              )}
              <DetailRow label="Pagado" value={formatCOP(c.paid_value)} />
              <DetailRow label="Pendiente" value={formatCOP(c.pending_value)} />
              <DetailRow label="Avance financiero" value={pct(c.financial_progress_pct)} />
              {c.future_validity > 0 && (
                <DetailRow label="Vigencias futuras" value={formatCOP(c.future_validity)} />
              )}
            </div>

            {/* PAA */}
            {(c.paa_code || c.paa_description) && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3 mt-5">PAA</p>
                <div>
                  {c.paa_code && <DetailRow label="Código PAA" value={c.paa_code} />}
                  {c.paa_description && <DetailRow label="Descripción PAA" value={c.paa_description} />}
                  {c.paa_estimated_value != null && (
                    <DetailRow label="Valor estimado PAA" value={formatCOP(c.paa_estimated_value)} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Póliza */}
        {(c.policy_number || c.policy_issuer) && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Póliza</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {c.policy_number && <div><span className="text-muted-foreground block">Número</span>{c.policy_number}</div>}
              {c.policy_issuer && <div><span className="text-muted-foreground block">Aseguradora</span>{c.policy_issuer}</div>}
              {c.policy_start && <div><span className="text-muted-foreground block">Inicio</span>{fmt(c.policy_start)}</div>}
              {c.policy_end && <div><span className="text-muted-foreground block">Fin</span>{fmt(c.policy_end)}</div>}
            </div>
          </div>
        )}

        {/* Observaciones + SECOP */}
        {(c.observations || c.secop_url) && (
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-6">
            {c.observations && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Observaciones</p>
                <p className="text-xs text-foreground leading-relaxed">{c.observations}</p>
              </div>
            )}
            {c.secop_url && (
              <div className="shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">SECOP II</p>
                <a
                  href={c.secop_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink size={12} />
                  Ver en SECOP
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Fila de contrato ─────────────────────────────────────────────────────────

function ContractRow({
  c,
  expanded,
  onToggle,
}: {
  c: FuncionamientoContract
  expanded: boolean
  onToggle: () => void
}) {
  const daysClass =
    c.days_remaining == null ? "" :
    c.days_remaining <= 0 ? "text-red-600 font-semibold" :
    c.days_remaining <= 30 ? "text-amber-600 font-semibold" : "text-muted-foreground"

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 w-8">
          <span className="text-muted-foreground">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
          {c.contract_number}
        </td>
        <td className="px-4 py-3 max-w-[260px]">
          <p className="text-sm font-medium text-foreground truncate">{c.contractor_name}</p>
          {c.contract_class && (
            <p className="text-xs text-muted-foreground truncate">{c.contract_class}</p>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] hidden md:table-cell">
          <p className="truncate">{c.object ?? "—"}</p>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
          {c.supervisor_name ?? "—"}
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
          {formatCOP(c.final_value)}
        </td>
        <td className="px-4 py-3 text-xs whitespace-nowrap hidden sm:table-cell">
          {c.end_date ? (
            <span className={daysClass}>
              {c.days_remaining != null && c.days_remaining <= 0
                ? "Vencido"
                : fmt(c.end_date)}
            </span>
          ) : "—"}
        </td>
        <td className="px-4 py-3">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
            statusClass(c.status)
          )}>
            {statusLabel(c.status)}
          </span>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {expanded && (
          <tr key={`detail-${c.id}`}>
            <td colSpan={8} className="p-0">
              <ContractDetail c={c} />
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Grupo de estado ──────────────────────────────────────────────────────────

function StatusGroup({
  group,
  contracts,
  expandedId,
  onToggle,
  forceOpen,
}: {
  group: StatusGroup
  contracts: FuncionamientoContract[]
  expandedId: string | null
  onToggle: (id: string) => void
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(group.key === "activos" || forceOpen === true)

  if (contracts.length === 0) return null

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-semibold", group.color)}>{group.label}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {contracts.length}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn("text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 w-8" />
                    <th className="px-4 py-2 font-semibold">N° Contrato</th>
                    <th className="px-4 py-2 font-semibold">Contratista / Clase</th>
                    <th className="px-4 py-2 font-semibold hidden md:table-cell">Objeto</th>
                    <th className="px-4 py-2 font-semibold hidden lg:table-cell">Supervisor</th>
                    <th className="px-4 py-2 font-semibold text-right">Valor total</th>
                    <th className="px-4 py-2 font-semibold hidden sm:table-cell">Terminación</th>
                    <th className="px-4 py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <ContractRow
                      key={c.id}
                      c={c}
                      expanded={expandedId === c.id}
                      onToggle={() => onToggle(c.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  contracts: FuncionamientoContract[]
  availableProjects: ProjectDetail[]
  initialStatusFilter?: string
}

// Map URL status param to STATUS_GROUPS key
function resolveInitialGroupFilter(status?: string): string | null {
  if (!status) return null
  const map: Record<string, string> = {
    activos: "activos",
    proximos: "activos", // "próximos" stays in activos group but auto-opens it
    finalizados: "finalizados",
    liquidados: "liquidados",
    suspendidos: "suspendidos",
  }
  return map[status] ?? null
}

export function FuncionamientoPageClient({ contracts, availableProjects, initialStatusFilter }: Props) {
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("all")
  const [filterArea, setFilterArea] = useState("all")
  const [showNewModal, setShowNewModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── Catálogos de filtros ──────────────────────────────────────────────────
  const years = useMemo(
    () => [...new Set(contracts.map((c) => c.year))].sort((a, b) => b - a),
    [contracts]
  )
  const areas = useMemo(
    () => [...new Set(contracts.map((c) => c.area_name).filter(Boolean))].sort() as string[],
    [contracts]
  )

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active = contracts.filter((c) => c.status === "EN_EJECUCION")
    const totalValue = contracts.reduce((s, c) => s + c.final_value, 0)
    const avgValue = contracts.length ? totalValue / contracts.length : 0
    const proximos = active.filter((c) => c.days_remaining != null && c.days_remaining > 0 && c.days_remaining <= 30)
    const vencidos = active.filter((c) => c.days_remaining != null && c.days_remaining <= 0)
    return { active: active.length, totalValue, avgValue, proximos: proximos.length, vencidos: vencidos.length, total: contracts.length }
  }, [contracts])

  // ── Filtro de búsqueda ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (filterYear !== "all" && c.year !== Number(filterYear)) return false
      if (filterArea !== "all" && c.area_name !== filterArea) return false
      if (q) {
        const hay = [c.contract_number, c.contractor_name, c.object, c.area_name, c.supervisor_name]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, filterYear, filterArea])

  // ── Agrupación por estado ─────────────────────────────────────────────────
  const grouped = useMemo(() => {
    return STATUS_GROUPS.map((group) => ({
      group,
      contracts: filtered.filter((c) => group.statuses.includes(c.status)),
    }))
  }, [filtered])

  // ── Distribución por supervisor (top 5) ───────────────────────────────────
  const bySupervisor = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contracts.filter((x) => x.status === "EN_EJECUCION")) {
      const key = c.supervisor_name ?? "Sin supervisor"
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [contracts])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionamiento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Contratos de apoyo operativo e interno · {contracts.length} contratos registrados
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          Nuevo contrato
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={FileText} label="Contratos activos" value={String(kpis.active)} sub={`de ${kpis.total} totales`} accent="green" />
        <KpiCard icon={DollarSign} label="Valor total contratado" value={formatCOP(kpis.totalValue)} accent="blue" />
        <KpiCard icon={TrendingUp} label="Valor promedio" value={formatCOP(kpis.avgValue)} accent="purple" />
        <KpiCard
          icon={Clock}
          label="Próximos a vencer"
          value={String(kpis.proximos)}
          sub="Menos de 30 días"
          accent={kpis.proximos > 0 ? "amber" : "green"}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Contratos vencidos"
          value={String(kpis.vencidos)}
          sub="En ejecución sin plazo"
          accent={kpis.vencidos > 0 ? "red" : "green"}
        />
      </div>

      {/* Distribución por supervisor */}
      {bySupervisor.length > 0 && (
        <div className="epuxua-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Contratos activos por supervisor</p>
          </div>
          <div className="space-y-2.5">
            {bySupervisor.map(([name, count]) => {
              const pctW = Math.round((count / kpis.active) * 100)
              return (
                <div key={name} className="flex items-center gap-3 text-xs">
                  <span className="w-40 truncate text-muted-foreground shrink-0">{name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${pctW}%` }}
                    />
                  </div>
                  <span className="font-semibold w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar contrato, contratista, objeto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">Todos los años</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">Todas las áreas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {(search || filterYear !== "all" || filterArea !== "all") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterYear("all"); setFilterArea("all") }}
            className="h-9 px-3 rounded-xl text-sm text-muted-foreground border border-border hover:bg-muted transition-colors"
          >
            Limpiar
          </button>
        )}
        <span className="h-9 flex items-center text-xs text-muted-foreground ml-auto">
          {filtered.length} contrato{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Árbol de contratos por estado */}
      {filtered.length === 0 ? (
        <div className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
          <User size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">Sin contratos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || filterYear !== "all" || filterArea !== "all"
              ? "No hay contratos que coincidan con los filtros aplicados."
              : "No hay contratos de funcionamiento registrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ group, contracts: gc }) => (
            <StatusGroup
              key={group.key}
              group={group}
              contracts={gc}
              expandedId={expandedId}
              onToggle={toggleExpand}
              forceOpen={resolveInitialGroupFilter(initialStatusFilter) === group.key}
            />
          ))}
        </div>
      )}

      {/* Modal nuevo contrato */}
      <NewFuncionamientoContractModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        availableProjects={availableProjects}
      />
    </div>
  )
}
