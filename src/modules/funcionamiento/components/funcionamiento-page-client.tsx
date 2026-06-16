"use client"

import { useMemo, useState } from "react"
import { Plus, Search, FileText, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearOf(c: FuncionamientoContrato): string {
  const mRef = c.numero_contrato?.match(/(\d{4})$/)
  if (mRef) return mRef[1]
  const mOrigen = c.origen_hoja?.match(/_(\d{4})$/)
  return mOrigen ? mOrigen[1] : (c.origen_hoja ?? "—")
}

const ESTADO_COLORS: Record<string, { cls: string; dot: string }> = {
  "EN EJECUCIÓN":             { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  "CIERRE CONTRACTUAL":       { cls: "bg-amber-50  text-amber-700  border-amber-200",  dot: "bg-amber-400"  },
  "TERMINADO":                { cls: "bg-slate-50  text-slate-700  border-slate-200",   dot: "bg-slate-400"  },
  "LIQUIDADO":                { cls: "bg-blue-50   text-blue-700   border-blue-200",    dot: "bg-blue-400"   },
  "TERMINADO ANTICIPADAMENTE":{ cls: "bg-orange-50 text-orange-700 border-orange-200",  dot: "bg-orange-400" },
  "SUSPENDIDO":               { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",  dot: "bg-yellow-400" },
  "DECLARADO FALLIDO":        { cls: "bg-red-50    text-red-700    border-red-200",     dot: "bg-red-400"    },
  "NO SUSCRITO":              { cls: "bg-gray-50   text-gray-500   border-gray-200",    dot: "bg-gray-400"   },
  "TERMINADO ANORMALMENTE":   { cls: "bg-rose-50   text-rose-700   border-rose-200",    dot: "bg-rose-400"   },
}

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-muted-foreground text-xs">—</span>
  const cfg = ESTADO_COLORS[estado] ?? { cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" }
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap", cfg.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {estado}
    </span>
  )
}

// ── Grupo colapsable por año ──────────────────────────────────────────────────

function YearGroup({
  year,
  contratos,
  onSelect,
}: {
  year: string
  contratos: FuncionamientoContrato[]
  onSelect: (c: FuncionamientoContrato) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">{year}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {contratos.length} contrato{contratos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">N° Contrato</th>
                <th className="px-4 py-2.5 font-semibold min-w-[200px]">Objeto</th>
                <th className="px-4 py-2.5 font-semibold min-w-[140px]">Contratista</th>
                <th className="px-4 py-2.5 font-semibold">Estado</th>
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Supervisor</th>
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Área</th>
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap text-right">Valor final</th>
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">F. inicio</th>
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">F. terminación</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="border-b border-border/60 last:border-0 hover:bg-[var(--corporate-blue)]/5 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="font-semibold text-xs font-mono text-[var(--corporate-blue)]">
                      {c.numero_contrato ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <span className="text-xs line-clamp-2">{c.objeto_contrato ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2.5 max-w-[160px]">
                    <span className="text-xs truncate block">{c.contratista ?? "—"}</span>
                    {c.persona_natural_juridica && (
                      <span className="text-[10px] text-muted-foreground">{c.persona_natural_juridica}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <EstadoBadge estado={c.estado} />
                  </td>
                  <td className="px-4 py-2.5 text-xs max-w-[120px] truncate">{c.supervisor ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs max-w-[120px] truncate">{c.area_responsable ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-xs whitespace-nowrap">
                    {c.valor_final != null ? formatCOP(c.valor_final) : c.valor_inicial != null ? formatCOP(c.valor_inicial) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{c.fecha_inicio ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{c.fecha_terminacion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  contracts: FuncionamientoContrato[]
  initialStatusFilter?: string
}

export function FuncionamientoPageClient({ contracts }: Props) {
  const [search, setSearch]          = useState("")
  const [yearFilter, setYearFilter]  = useState("all")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [showNewModal, setShowModal] = useState(false)
  const [selected, setSelected]      = useState<FuncionamientoContrato | null>(null)

  const years = useMemo(
    () => [...new Set(contracts.map(yearOf))].sort((a, b) => b.localeCompare(a)),
    [contracts]
  )

  const estados = useMemo(
    () => [...new Set(contracts.map((c) => c.estado).filter(Boolean))].sort() as string[],
    [contracts]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (yearFilter !== "all" && yearOf(c) !== yearFilter) return false
      if (estadoFilter !== "all" && c.estado !== estadoFilter) return false
      if (q) {
        const hay = [c.numero_contrato, c.contratista, c.objeto_contrato, c.supervisor, c.area_responsable, c.origen_hoja]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, yearFilter, estadoFilter])

  const grouped = useMemo(
    () =>
      years
        .map((year) => ({
          year,
          contratos: filtered.filter((c) => yearOf(c) === year),
        }))
        .filter((g) => g.contratos.length > 0),
    [filtered, years]
  )

  const hasFilters = search !== "" || yearFilter !== "all" || estadoFilter !== "all"

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionamiento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Contratos de apoyo operativo EPUXUA · {contracts.length} registros · {years.length} años
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

      {/* KPIs por año */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {years.map((year) => {
          const cnt = contracts.filter((c) => yearOf(c) === year).length
          return (
            <button
              key={year}
              type="button"
              onClick={() => setYearFilter(yearFilter === year ? "all" : year)}
              className={cn(
                "epuxua-card p-4 text-center transition-all",
                yearFilter === year
                  ? "ring-2 ring-[var(--corporate-blue)] bg-[var(--corporate-blue)]/5"
                  : "hover:bg-muted/30"
              )}
            >
              <p className="text-base font-bold text-foreground">{year}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{cnt} contratos</p>
            </button>
          )
        })}
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por contrato, contratista, objeto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setYearFilter("all"); setEstadoFilter("all") }}
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

      {/* Lista agrupada por año */}
      {grouped.length === 0 ? (
        <div className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">Sin contratos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasFilters
              ? "No hay contratos que coincidan con la búsqueda."
              : "No hay contratos de funcionamiento registrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ year, contratos }) => (
            <YearGroup key={year} year={year} contratos={contratos} onSelect={setSelected} />
          ))}
        </div>
      )}

      <NewFuncionamientoContractModal
        open={showNewModal}
        onClose={() => setShowModal(false)}
      />

      <ContractDetailDrawer
        contract={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
