"use client"

import { useMemo, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Search, Plus, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"
import type { FuncionamientoContract } from "@/services/funcionamiento.service"
import type { ProjectDetail } from "@/types/project"

// ── Helpers de presentación ───────────────────────────────────────────────────

function statusLabel(s: string): string {
  const map: Record<string, string> = {
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
  return map[s] ?? s
}

function statusClass(s: string): string {
  const map: Record<string, string> = {
    EN_EJECUCION: "bg-emerald-100 text-emerald-700",
    SUSPENDIDO: "bg-yellow-100 text-yellow-700",
    TERMINADO: "bg-slate-100 text-slate-600",
    TERMINADO_ANTICIPADAMENTE: "bg-orange-100 text-orange-700",
    LIQUIDADO: "bg-blue-100 text-blue-700",
    CIERRE_CONTRACTUAL: "bg-purple-100 text-purple-700",
    DECLARADO_FALLIDO: "bg-red-100 text-red-700",
  }
  return map[s] ?? "bg-muted text-muted-foreground"
}

function modalityLabel(m: string | null): string {
  if (!m) return "—"
  const map: Record<string, string> = {
    CONTRATACION_DIRECTA: "Directa",
    INVITACION_ABIERTA: "Inv. abierta",
    INVITACION_PRESELECCIONADOS: "Preseleccionados",
    CONCURSO_MERITOS: "Concurso",
    ORDEN_COMPRA: "Orden de compra",
    ACUERDO_MARCO: "Acuerdo marco",
  }
  return map[m] ?? m
}

function fmt(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Detalle expandible ────────────────────────────────────────────────────────

function ContractDetail({ c }: { c: FuncionamientoContract }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="bg-muted/30 border-t border-border px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">

        {/* Objeto */}
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Objeto del contrato</p>
          <p className="text-sm text-foreground leading-relaxed">{c.object ?? "—"}</p>
        </div>

        {/* Identificación del contrato */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Información general</p>
          <div className="space-y-1.5">
            <Row label="Clase" value={c.contract_class ?? "—"} />
            <Row label="Modalidad" value={modalityLabel(c.selection_modality)} />
            <Row label="Área responsable" value={c.area_name ?? "—"} />
            <Row label="Supervisor" value={c.supervisor_name ?? "—"} />
            <Row label="Año" value={String(c.year)} />
          </div>
        </div>

        {/* Fechas */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Fechas</p>
          <div className="space-y-1.5">
            <Row label="Suscripción" value={fmt(c.subscription_date)} />
            <Row label="Inicio" value={fmt(c.start_date)} />
            <Row label="Terminación" value={fmt(c.end_date)} />
            {c.days_remaining != null && (
              <Row
                label="Días restantes"
                value={c.days_remaining > 0 ? `${c.days_remaining} días` : "Vencido"}
                valueClass={c.days_remaining <= 0 ? "text-red-600 font-semibold" : c.days_remaining <= 30 ? "text-amber-600 font-semibold" : ""}
              />
            )}
          </div>
        </div>

        {/* Financiero */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Información financiera</p>
          <div className="space-y-1.5">
            <Row label="Valor inicial contratado" value={formatCOP(c.initial_value)} valueClass="font-semibold" />
            {c.total_additions_value > 0 && (
              <Row label="Valor de adición" value={formatCOP(c.total_additions_value)} valueClass="text-amber-700 font-semibold" />
            )}
            <div className="pt-1 border-t border-border/60">
              <Row
                label={c.total_additions_value > 0 ? "Total (inicial + adición)" : "Valor total contratado"}
                value={formatCOP(c.final_value)}
                valueClass="font-bold text-foreground"
              />
            </div>
            <Row label="Valor pagado" value={formatCOP(c.paid_value)} />
          </div>
        </div>

        {/* Estado y proyecto contenedor */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Estado:</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClass(c.status)}`}>
              {statusLabel(c.status)}
            </span>
          </div>
          {c.project_code && (
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Proyecto contenedor:</p>
              <span className="text-xs font-semibold text-teal-700">{c.project_code}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs text-right", valueClass ?? "text-foreground")}>{value}</span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  contracts: FuncionamientoContract[]
  availableProjects: ProjectDetail[]
}

export function FuncionamientoPageClient({ contracts, availableProjects }: Props) {
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterArea, setFilterArea] = useState("all")
  const [showNewModal, setShowNewModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const years = useMemo(
    () => [...new Set(contracts.map((c) => c.year))].sort((a, b) => b - a),
    [contracts]
  )
  const areas = useMemo(
    () => [...new Set(contracts.map((c) => c.area_name).filter(Boolean))].sort() as string[],
    [contracts]
  )
  const statuses = useMemo(
    () => [...new Set(contracts.map((c) => c.status))].sort(),
    [contracts]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (filterYear !== "all" && c.year !== Number(filterYear)) return false
      if (filterStatus !== "all" && c.status !== filterStatus) return false
      if (filterArea !== "all" && c.area_name !== filterArea) return false
      if (q) {
        const hay = [c.contract_number, c.contractor_name, c.object, c.area_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, filterYear, filterStatus, filterArea])

  const totalInitial = filtered.reduce((s, c) => s + c.initial_value, 0)
  const totalAdditions = filtered.reduce((s, c) => s + c.total_additions_value, 0)
  const totalFinal = filtered.reduce((s, c) => s + c.final_value, 0)

  const chartData = useMemo(() => {
    const byYear = new Map<number, number>()
    for (const c of contracts) {
      byYear.set(c.year, (byYear.get(c.year) ?? 0) + 1)
    }
    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, count]) => ({ year: String(year), count }))
  }, [contracts])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (contracts.length === 0) {
    return (
      <div className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          No hay contratos de funcionamiento registrados.
        </p>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold"
        >
          <Plus size={14} />
          Nuevo Contrato Funcionamiento
        </button>
        {showNewModal && (
          <NewFuncionamientoContractModal
            open={showNewModal}
            onClose={() => setShowNewModal(false)}
            availableProjects={availableProjects}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Acciones */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} contrato{filtered.length !== 1 ? "s" : ""}
          {filterYear !== "all" ? ` · ${filterYear}` : ""}
          <span className="ml-2 text-[10px] text-muted-foreground/60">Clic en una fila para ver el detalle</span>
        </p>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:opacity-90"
        >
          <Plus size={13} />
          Nuevo Contrato Funcionamiento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Contratos", value: String(filtered.length), mono: false },
          { label: "Valor inicial total", value: formatCOP(totalInitial), mono: true },
          { label: "Total adiciones", value: formatCOP(totalAdditions), mono: true },
          { label: "Valor total contratado", value: formatCOP(totalFinal), mono: true },
        ].map((k) => (
          <div key={k.label} className="epuxua-card px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              {k.label}
            </p>
            <p className={`text-sm font-bold text-foreground mt-1 ${k.mono ? "tabular-nums" : ""}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico por año */}
      <div className="epuxua-card p-5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4">
          Contratos por año
        </h4>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v} contratos`, "Cantidad"]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#0D9488" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtros */}
      <div className="epuxua-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="N° contrato, contratista, objeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="h-9 rounded-lg border border-border px-3 text-sm"
        >
          <option value="all">Todos los años</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-lg border border-border px-3 text-sm"
        >
          <option value="all">Todos los estados</option>
          {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="h-9 rounded-lg border border-border px-3 text-sm"
        >
          <option value="all">Todas las áreas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tabla con filas expandibles */}
      <div className="epuxua-card overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="w-8 px-3 py-3" />
              {[
                { label: "N° Contrato" },
                { label: "Contratista" },
                { label: "Clase" },
                { label: "Modalidad" },
                { label: "Área" },
                { label: "Valor inicial", align: "text-right" },
                { label: "Adición", align: "text-right" },
                { label: "Total contratado", align: "text-right" },
                { label: "Inicio" },
                { label: "Terminación" },
                { label: "Estado" },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${h.align ?? ""}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay contratos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isOpen = expandedId === c.id
                return (
                  <>
                    <tr
                      key={c.id}
                      onClick={() => toggleExpand(c.id)}
                      className={cn(
                        "border-b border-border/60 cursor-pointer transition-colors",
                        isOpen ? "bg-teal-50/60" : "hover:bg-muted/20"
                      )}
                    >
                      {/* Chevron */}
                      <td className="px-3 py-3 text-center">
                        <ChevronDown
                          size={14}
                          className={cn(
                            "text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-teal-700 whitespace-nowrap">
                        {c.contract_number}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="truncate">{c.contractor_name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {c.contract_class ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {modalityLabel(c.selection_modality)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px]">
                        <p className="truncate">{c.area_name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">
                        {formatCOP(c.initial_value)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                        {c.total_additions_value > 0 ? formatCOP(c.total_additions_value) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap">
                        {formatCOP(c.final_value)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmt(c.start_date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmt(c.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClass(c.status)}`}>
                          {statusLabel(c.status)}
                        </span>
                      </td>
                    </tr>

                    {/* Fila de detalle expandible — span de toda la tabla */}
                    {isOpen && (
                      <tr key={`${c.id}-detail`} className="border-b border-teal-200/60">
                        <td colSpan={12} className="p-0">
                          <AnimatePresence initial={false}>
                            <ContractDetail c={c} />
                          </AnimatePresence>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <NewFuncionamientoContractModal
          open={showNewModal}
          onClose={() => setShowNewModal(false)}
          availableProjects={availableProjects}
        />
      )}
    </div>
  )
}
