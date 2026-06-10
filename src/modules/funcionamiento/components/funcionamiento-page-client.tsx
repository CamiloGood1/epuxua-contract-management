"use client"

import { useMemo, useState } from "react"
import { Plus, Search, FileText, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearOf(c: FuncionamientoContrato): string {
  if (c.year) return String(c.year)
  const m = c.origen_hoja.match(/_(\d{4})$/)
  return m ? m[1] : c.origen_hoja
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso + "T12:00:00")
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function StatusChip({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>
  const map: Record<string, { cls: string; label: string }> = {
    EN_EJECUCION:             { cls: "bg-emerald-50 text-emerald-700 border-emerald-200",    label: "En ejecución" },
    SUSPENDIDO:               { cls: "bg-amber-50 text-amber-700 border-amber-200",          label: "Suspendido" },
    TERMINADO:                { cls: "bg-slate-50 text-slate-600 border-slate-200",          label: "Terminado" },
    TERMINADO_ANTICIPADAMENTE:{ cls: "bg-orange-50 text-orange-700 border-orange-200",       label: "T. anticipado" },
    LIQUIDADO:                { cls: "bg-blue-50 text-blue-700 border-blue-200",             label: "Liquidado" },
    CIERRE_CONTRACTUAL:       { cls: "bg-violet-50 text-violet-700 border-violet-200",       label: "Cierre" },
    DECLARADO_FALLIDO:        { cls: "bg-red-50 text-red-700 border-red-200",                label: "Fallido" },
    ACTA_NO_EJECUCION:        { cls: "bg-gray-50 text-gray-600 border-gray-200",             label: "No ejecución" },
    NO_SUSCRIPCION:           { cls: "bg-gray-50 text-gray-500 border-gray-200",             label: "No suscrito" },
  }
  const cfg = map[status] ?? { cls: "bg-gray-50 text-gray-600 border-gray-200", label: status }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

// ── Fila de contrato (modo vista enriquecida) ─────────────────────────────────

function ContratoRowRich({ c }: { c: FuncionamientoContrato }) {
  const val = c.final_value ?? c.initial_value
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-semibold text-xs font-mono text-[var(--corporate-blue)]">
          {c.contract_number ?? c.proyecto_ref}
        </span>
        <p className="text-[10px] text-muted-foreground">{yearOf(c)}</p>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <p className="line-clamp-2 text-xs">{c.object ?? "—"}</p>
      </td>
      <td className="px-4 py-3 text-xs max-w-[150px] truncate">
        {c.contractor_name ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs">{c.supervisor_name ?? "—"}</td>
      <td className="px-4 py-3"><StatusChip status={c.status} /></td>
      <td className="px-4 py-3 whitespace-nowrap text-[10px]">{fmt(c.subscription_date)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-[10px]">{fmt(c.end_date)}</td>
      <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap text-xs">
        {val != null ? formatCOP(val) : "—"}
      </td>
    </tr>
  )
}

// ── Fila de contrato (modo tabla mínima) ──────────────────────────────────────

function ContratoRowSimple({ c }: { c: FuncionamientoContrato }) {
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--corporate-blue)]">
        {c.proyecto_ref}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{c.origen_hoja}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{yearOf(c)}</td>
    </tr>
  )
}

// ── Grupo colapsable por año ─────────────────────────────────────────────────

function YearGroup({ year, contratos, rich }: { year: string; contratos: FuncionamientoContrato[]; rich: boolean }) {
  const [open, setOpen] = useState(true)

  const activeCount   = contratos.filter((c) => c.status === "EN_EJECUCION").length
  const totalValue    = contratos.reduce((s, c) => s + (c.final_value ?? c.initial_value ?? 0), 0)

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">{year}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {contratos.length} contratos
          </span>
          {rich && activeCount > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {activeCount} activos
            </span>
          )}
          {rich && totalValue > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {formatCOP(totalValue)} total
            </span>
          )}
        </div>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                {rich ? (
                  <>
                    <th className="px-4 py-2 font-semibold">N° Contrato</th>
                    <th className="px-4 py-2 font-semibold">Objeto</th>
                    <th className="px-4 py-2 font-semibold">Contratista</th>
                    <th className="px-4 py-2 font-semibold">Supervisor</th>
                    <th className="px-4 py-2 font-semibold">Estado</th>
                    <th className="px-4 py-2 font-semibold">Suscripción</th>
                    <th className="px-4 py-2 font-semibold">Terminación</th>
                    <th className="px-4 py-2 font-semibold text-right">Valor</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 font-semibold">Referencia</th>
                    <th className="px-4 py-2 font-semibold">Origen / Hoja</th>
                    <th className="px-4 py-2 font-semibold">Año</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) =>
                rich
                  ? <ContratoRowRich key={c.id} c={c} />
                  : <ContratoRowSimple key={c.id} c={c} />
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="epuxua-card p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={cn("text-xl font-bold", color ?? "text-foreground")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  contracts: FuncionamientoContrato[]
  initialStatusFilter?: string
}

export function FuncionamientoPageClient({ contracts }: Props) {
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("all")
  const [showNewModal, setShowModal] = useState(false)

  const isRich = contracts.some((c) => c._source === "view")

  // KPIs
  const totalActive   = contracts.filter((c) => c.status === "EN_EJECUCION").length
  const totalValue    = contracts.reduce((s, c) => s + (c.final_value ?? c.initial_value ?? 0), 0)
  const uniqueYears   = [...new Set(contracts.map(yearOf))].sort((a, b) => b.localeCompare(a))

  // Filtro
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (q) {
        const hay = [
          c.proyecto_ref, c.contract_number, c.object,
          c.contractor_name, c.supervisor_name, c.origen_hoja,
        ].filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      return true
    })
  }, [contracts, search, statusFilter])

  // Agrupación por año
  const grouped = useMemo(() => {
    return uniqueYears
      .map((year) => ({
        year,
        contratos: filtered.filter((c) => yearOf(c) === year),
      }))
      .filter((g) => g.contratos.length > 0)
  }, [filtered, uniqueYears])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionamiento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Contratos de apoyo operativo EPUXUA · {contracts.length} contratos
            {isRich && <span className="ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">datos completos</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          Nuevo contrato
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total contratos"   value={contracts.length} />
        {isRich
          ? <KpiCard label="En ejecución" value={totalActive} color="text-emerald-600" sub={`${((totalActive/contracts.length)*100).toFixed(0)}% del total`} />
          : <KpiCard label="Años registrados" value={uniqueYears.length} />
        }
        <KpiCard label="Años en cartera"  value={uniqueYears.length} />
        {isRich && totalValue > 0
          ? <KpiCard label="Valor total" value={formatCOP(totalValue)} />
          : <KpiCard label="Contratos/año" value={(contracts.length / Math.max(uniqueYears.length, 1)).toFixed(0)} sub="promedio" />
        }
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={isRich ? "Buscar por N°, objeto, contratista…" : "Buscar por referencia u origen…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        {isRich && (
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-xl border border-border bg-white pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
          >
            <option value="all">Todos los estados</option>
            <option value="EN_EJECUCION">En ejecución</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="TERMINADO">Terminado</option>
            <option value="TERMINADO_ANTICIPADAMENTE">T. anticipado</option>
            <option value="LIQUIDADO">Liquidado</option>
            <option value="CIERRE_CONTRACTUAL">Cierre contractual</option>
          </select>
        )}
        {(search || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setStatus("all") }}
            className="h-9 px-3 rounded-xl text-sm text-muted-foreground border border-border hover:bg-muted inline-flex items-center gap-1.5"
          >
            <X size={13} />
            Limpiar
          </button>
        )}
        <span className="self-center text-xs text-muted-foreground">
          {filtered.length} contrato{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grupos por año */}
      {grouped.length === 0 ? (
        <div className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">Sin contratos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || statusFilter !== "all"
              ? "No hay contratos que coincidan con los filtros."
              : "No hay contratos de funcionamiento registrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ year, contratos }) => (
            <YearGroup key={year} year={year} contratos={contratos} rich={isRich} />
          ))}
        </div>
      )}

      <NewFuncionamientoContractModal
        open={showNewModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
