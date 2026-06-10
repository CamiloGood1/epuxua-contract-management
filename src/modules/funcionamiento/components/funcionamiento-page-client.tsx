"use client"

import { useMemo, useState } from "react"
import { Plus, Search, FileText, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearOf(c: FuncionamientoContrato): string {
  // proyecto_ref tiene formato NNN-AAAA → extraer año
  const mRef = c.proyecto_ref.match(/(\d{4})$/)
  if (mRef) return mRef[1]
  // origen_hoja: 'Contratación_AAAA'
  const mOrigen = c.origen_hoja.match(/_(\d{4})$/)
  return mOrigen ? mOrigen[1] : c.origen_hoja
}

function numOf(ref: string): string {
  // '025-2024' → '025'
  const m = ref.match(/^(\d+)/)
  return m ? m[1] : ref
}

// ── Grupo colapsable por año ─────────────────────────────────────────────────

function YearGroup({
  year,
  contratos,
}: {
  year: string
  contratos: FuncionamientoContrato[]
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
        <ChevronDown
          size={14}
          className={cn("text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold w-16">N°</th>
                <th className="px-4 py-2.5 font-semibold">Referencia contrato</th>
                <th className="px-4 py-2.5 font-semibold">Hoja de origen</th>
                <th className="px-4 py-2.5 font-semibold">Año</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-xs font-mono text-[var(--corporate-blue)]">
                      {c.proyecto_ref}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {c.origen_hoja}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {yearOf(c)}
                  </td>
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
  const [showNewModal, setShowModal] = useState(false)

  // Años únicos disponibles (más reciente primero)
  const years = useMemo(
    () => [...new Set(contracts.map(yearOf))].sort((a, b) => b.localeCompare(a)),
    [contracts]
  )

  // Filtro
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (yearFilter !== "all" && yearOf(c) !== yearFilter) return false
      if (q) {
        const hay = [c.proyecto_ref, c.origen_hoja, yearOf(c)].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, yearFilter])

  // Agrupación por año
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

  const hasFilters = search !== "" || yearFilter !== "all"

  return (
    <div className="p-6 space-y-6">
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
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* Búsqueda */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número de contrato…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setYearFilter("all") }}
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
            <YearGroup key={year} year={year} contratos={contratos} />
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
