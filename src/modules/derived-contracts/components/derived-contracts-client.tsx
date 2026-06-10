"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X, Download, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { DerivedContractRow, DerivedContractsKPIs } from "@/services/derived-contracts.service"

const PAGE_SIZE = 15

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", accent ?? "text-foreground")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ── Estado badge contrato ─────────────────────────────────────────────────────

const ESTADO_CFG: Record<string, { cls: string; dot: string }> = {
  "EN EJECUCIÓN":              { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "CIERRE CONTRACTUAL":        { cls: "bg-amber-50  text-amber-700  border-amber-200",    dot: "bg-amber-500"  },
  "TERMINADO":                 { cls: "bg-slate-50  text-slate-600  border-slate-200",    dot: "bg-slate-400"  },
  "LIQUIDADO":                 { cls: "bg-blue-50   text-blue-700   border-blue-200",     dot: "bg-blue-500"   },
  "TERMINADO ANTICIPADAMENTE": { cls: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
  "SUSPENDIDO":                { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500" },
  "DECLARADO FALLIDO":         { cls: "bg-red-50    text-red-700    border-red-200",      dot: "bg-red-500"    },
  "NO SUSCRITO":               { cls: "bg-gray-50   text-gray-500   border-gray-200",     dot: "bg-gray-400"   },
  "TERMINADO ANORMALMENTE":    { cls: "bg-rose-50   text-rose-700   border-rose-200",     dot: "bg-rose-500"   },
}

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-[10px] text-muted-foreground">—</span>
  const cfg = ESTADO_CFG[estado] ?? { cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" }
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap", cfg.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {estado}
    </span>
  )
}

// ── Parent estado badge ───────────────────────────────────────────────────────

const PARENT_CFG: Record<string, { cls: string }> = {
  "EN EJECUCIÓN": { cls: "bg-blue-100 text-blue-700" },
  "TERMINADO":    { cls: "bg-slate-100 text-slate-600" },
  "LIQUIDADO":    { cls: "bg-teal-100 text-teal-700" },
}

function ParentBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-[10px] text-muted-foreground">—</span>
  const cfg = PARENT_CFG[estado] ?? { cls: "bg-muted text-muted-foreground" }
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", cfg.cls)}>
      {estado}
    </span>
  )
}

// ── Paginación ────────────────────────────────────────────────────────────────

function Paginator({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages: (number | "…")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("…")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("…")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total} resultados
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p as number)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                page === p
                  ? "bg-[var(--corporate-blue)] text-white border-[var(--corporate-blue)]"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  contracts: DerivedContractRow[]
  kpis: DerivedContractsKPIs
}

const UNIQUE_INTERADMIN = (contracts: DerivedContractRow[]) =>
  [...new Set(contracts.map((c) => c.id_interadministrativo).filter(Boolean))].sort() as string[]

export function DerivedContractsClient({ contracts, kpis }: Props) {
  const [search, setSearch]             = useState("")
  const [convenioFilter, setConvenio]   = useState("all")
  const [estadoFilter, setEstado]       = useState("all")
  const [minVal, setMinVal]             = useState("")
  const [maxVal, setMaxVal]             = useState("")
  const [showFilters, setShowFilters]   = useState(false)
  const [page, setPage]                 = useState(1)
  const [selected, setSelected]         = useState<DerivedContractRow | null>(null)

  const convenios = useMemo(() => UNIQUE_INTERADMIN(contracts), [contracts])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const min = minVal ? Number(minVal.replace(/\D/g, "")) : null
    const max = maxVal ? Number(maxVal.replace(/\D/g, "")) : null
    return contracts.filter((c) => {
      if (q) {
        const hay = [c.numero_contrato, c.contratista, c.objeto_contrato, c.id_interadministrativo, c.parent_objeto, c.parent_secretaria]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (convenioFilter !== "all" && c.id_interadministrativo !== convenioFilter) return false
      if (estadoFilter !== "all" && c.estado !== estadoFilter) return false
      const val = c.valor_final ?? c.valor_inicial ?? 0
      if (min !== null && val < min) return false
      if (max !== null && val > max) return false
      return true
    })
  }, [contracts, search, convenioFilter, estadoFilter, minVal, maxVal])

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const activeFilters = [convenioFilter !== "all", estadoFilter !== "all", !!minVal, !!maxVal].filter(Boolean).length

  function resetPage() { setPage(1) }

  // KPIs derivados
  const vigentes    = contracts.filter((c) => c.estado === "EN EJECUCIÓN").length
  const proximos    = contracts.filter((c) => {
    if (!c.fecha_terminacion || c.estado !== "EN EJECUCIÓN") return false
    const d = new Date(c.fecha_terminacion)
    const now = new Date()
    const diff = Math.round((d.getTime() - now.getTime()) / 86400000)
    return diff >= 0 && diff <= 30
  }).length
  const liquidacion = contracts.filter((c) => c.estado === "CIERRE CONTRACTUAL" || c.estado === "LIQUIDADO").length
  const montoTotal  = contracts.reduce((s, c) => s + (c.valor_final ?? c.valor_inicial ?? 0), 0)

  const selCls = "h-9 rounded-xl border border-[#EAEAEA] bg-white pl-3 pr-8 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20 w-full"

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#151c27]">Gestión de Contratos Derivados</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Contratos derivados de convenios interadministrativos
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90 shadow-sm self-start sm:self-auto"
        >
          <Download size={13} />
          Descargar Excel
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Monto Total Comprometido" value={`$ ${(montoTotal / 1_000_000).toFixed(0)}M`} sub={`${contracts.length} contratos`} accent="text-[var(--corporate-blue)]" />
        <KpiCard label="Contratos Vigentes"       value={String(vigentes)}    sub="Estado EN EJECUCIÓN" />
        <KpiCard label="Próximos a Vencer"         value={String(proximos)}    sub="Vencen en ≤ 30 días" accent={proximos > 0 ? "text-amber-600" : undefined} />
        <KpiCard label="En Trámite Liquidación"    value={String(liquidacion)} sub="Cierre o Liquidado"  accent={liquidacion > 0 ? "text-blue-600" : undefined} />
      </div>

      {/* ── Panel de filtros ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Panel de Filtros Avanzados</span>
            {activeFilters > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--corporate-blue)] text-white">
                {activeFilters} activo{activeFilters !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showFilters ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Búsqueda siempre visible */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por N° contrato, convenio padre, objeto, contratista…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-[#EAEAEA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/30"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); resetPage() }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Convenio Interadmin</label>
                <div className="relative">
                  <select className={selCls} value={convenioFilter} onChange={(e) => { setConvenio(e.target.value); resetPage() }}>
                    <option value="all">Todos los convenios</option>
                    {convenios.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Estado del Contrato</label>
                <div className="relative">
                  <select className={selCls} value={estadoFilter} onChange={(e) => { setEstado(e.target.value); resetPage() }}>
                    <option value="all">Todos los estados</option>
                    <option value="EN EJECUCIÓN">En ejecución</option>
                    <option value="CIERRE CONTRACTUAL">Cierre contractual</option>
                    <option value="TERMINADO">Terminado</option>
                    <option value="LIQUIDADO">Liquidado</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                    <option value="TERMINADO ANTICIPADAMENTE">Terminado anticipadamente</option>
                    <option value="DECLARADO FALLIDO">Declarado fallido</option>
                    <option value="TERMINADO ANORMALMENTE">Terminado anormalmente</option>
                    <option value="NO SUSCRITO">No suscrito</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Valor mínimo</label>
                <input
                  type="text"
                  placeholder="Ej: 50000000"
                  value={minVal}
                  onChange={(e) => { setMinVal(e.target.value); resetPage() }}
                  className="h-9 rounded-xl border border-[#EAEAEA] bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Valor máximo</label>
                <input
                  type="text"
                  placeholder="Ej: 500000000"
                  value={maxVal}
                  onChange={(e) => { setMaxVal(e.target.value); resetPage() }}
                  className="h-9 rounded-xl border border-[#EAEAEA] bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground">
            Registros Contractuales
            <span className="ml-2 text-[10px] font-semibold text-muted-foreground normal-case">
              {filtered.length} Contrato{filtered.length !== 1 ? "s" : ""}
            </span>
          </h4>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-foreground">Sin contratos</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || activeFilters > 0 ? "Ningún derivado coincide con los filtros." : "No hay contratos derivados registrados."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#F8FAFC] text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">N° Contrato</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Convenio Padre</th>
                    <th className="px-4 py-3 font-semibold min-w-[140px]">Contratista</th>
                    <th className="px-4 py-3 font-semibold min-w-[200px]">Objeto</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Supervisor</th>
                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Valor Total</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">F. Terminación</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className="border-b border-border/60 last:border-0 hover:bg-[var(--corporate-blue)]/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-bold text-[var(--corporate-blue)] font-mono group-hover:underline">
                          {d.numero_contrato ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {d.id_interadministrativo ? (
                          <Link
                            href={d.parent_id != null ? `/proyectos/${d.parent_id}` : "#"}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold font-mono text-violet-700 hover:underline whitespace-nowrap"
                          >
                            {d.id_interadministrativo}
                          </Link>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                        {d.parent_estado && (
                          <div className="mt-0.5">
                            <ParentBadge estado={d.parent_estado} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <span className="text-xs truncate block">{d.contratista ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="text-xs line-clamp-2 text-muted-foreground">{d.objeto_contrato ?? d.origen_hoja ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={d.estado} />
                      </td>
                      <td className="px-4 py-3 max-w-[120px]">
                        <span className="text-xs truncate block text-muted-foreground">{d.supervisor ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold tabular-nums">
                          {d.valor_final != null ? formatCOP(d.valor_final) : d.valor_inicial != null ? formatCOP(d.valor_inicial) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {d.fecha_terminacion ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginator page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      <ContractDetailDrawer contract={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
