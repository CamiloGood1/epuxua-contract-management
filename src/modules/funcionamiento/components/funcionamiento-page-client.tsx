"use client"

import { useMemo, useState } from "react"
import { Plus, Search, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s: string): string {
  // 'Contratación_2024' → '2024', o devuelve tal cual
  const m = s.match(/_(\d{4})$/)
  return m ? m[1] : s
}

// ── Fila de contrato ─────────────────────────────────────────────────────────

function ContratoRow({ c }: { c: FuncionamientoContrato }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
        {c.proyecto_ref}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {c.origen_hoja}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {fmt(c.origen_hoja)}
      </td>
    </tr>
  )
}

// ── Grupo por origen_hoja ─────────────────────────────────────────────────────

function OrigenGroup({
  origen,
  contratos,
}: {
  origen: string
  contratos: FuncionamientoContrato[]
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">{origen}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {contratos.length}
          </span>
        </div>
        <span className={cn("text-muted-foreground transition-transform text-xs", open && "rotate-180")}>▼</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Referencia contrato</th>
                <th className="px-4 py-2 font-semibold">Origen / Hoja</th>
                <th className="px-4 py-2 font-semibold">Año</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <ContratoRow key={c.id} c={c} />
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
  const [search, setSearch]       = useState("")
  const [showNewModal, setShowNewModal] = useState(false)

  // Catálogo de orígenes únicos
  const origenes = useMemo(
    () => [...new Set(contracts.map((c) => c.origen_hoja))].sort((a, b) => b.localeCompare(a)),
    [contracts]
  )

  // Filtro por búsqueda
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return contracts
    return contracts.filter((c) =>
      c.proyecto_ref.toLowerCase().includes(q) ||
      c.origen_hoja.toLowerCase().includes(q)
    )
  }, [contracts, search])

  // Agrupación por origen_hoja
  const grouped = useMemo(() => {
    return origenes.map((origen) => ({
      origen,
      contratos: filtered.filter((c) => c.origen_hoja === origen),
    })).filter((g) => g.contratos.length > 0)
  }, [filtered, origenes])

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

      {/* KPI simple */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="epuxua-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total contratos</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{contracts.length}</p>
          </div>
        </div>
        <div className="epuxua-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hojas de origen</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{origenes.length}</p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por referencia u origen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
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

      {/* Grupos por origen */}
      {grouped.length === 0 ? (
        <div className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">Sin contratos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "No hay contratos que coincidan con la búsqueda."
              : "No hay contratos de funcionamiento registrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ origen, contratos }) => (
            <OrigenGroup key={origen} origen={origen} contratos={contratos} />
          ))}
        </div>
      )}

      <NewFuncionamientoContractModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  )
}
