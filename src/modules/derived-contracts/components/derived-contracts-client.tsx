"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { DerivedContractRow, DerivedContractsKPIs } from "@/services/derived-contracts.service"
import { formatCOP } from "@/modules/contracts/lib/status"
import { NewContractModal, type SimpleInteradmin } from "./new-contract-modal"

const PAGE_SIZE = 10

// ── Estado badge ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-xs text-[#747783]">—</span>

  const map: Record<string, { dot: string; text: string; bg: string }> = {
    "EN EJECUCIÓN":              { dot: "bg-[#10B981]", text: "text-[#10B981]", bg: "bg-[#10B981]/10" },
    "CIERRE CONTRACTUAL":        { dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
    "TERMINADO":                 { dot: "bg-[#747783]", text: "text-[#747783]", bg: "bg-[#747783]/10" },
    "LIQUIDADO":                 { dot: "bg-[#0B3D91]", text: "text-[#0B3D91]", bg: "bg-[#0B3D91]/10" },
    "SUSPENDIDO":                { dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
    "TERMINADO ANTICIPADAMENTE": { dot: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
    "DECLARADO FALLIDO":         { dot: "bg-[#EF4444]", text: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
    "NO SUSCRITO":               { dot: "bg-gray-400",  text: "text-gray-500",  bg: "bg-gray-50" },
    "TERMINADO ANORMALMENTE":    { dot: "bg-rose-500",  text: "text-rose-600",  bg: "bg-rose-50" },
  }
  const cfg = map[estado] ?? { dot: "bg-[#747783]", text: "text-[#747783]", bg: "bg-[#747783]/10" }
  const label = estado === "EN EJECUCIÓN" ? "Ejecución" : estado === "CIERRE CONTRACTUAL" ? "Cierre" : estado

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 ${cfg.dot} rounded-full mr-1.5`} />
      {label}
    </span>
  )
}

// ── Paginación ────────────────────────────────────────────────────────────────

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
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
    <div className="px-3 sm:px-6 py-4 border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-2">
      <p className="text-sm text-[#434652]">
        Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total} resultados
      </p>
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-2 border border-[#c4c6ce] rounded-lg hover:bg-[#f0f3ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-2 text-[#747783]">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p as number)}
              className={`w-10 h-10 rounded-lg text-[12px] font-semibold transition-colors ${
                page === p
                  ? "bg-[#0B3D91] text-white"
                  : "hover:bg-[#f0f3ff] text-[#151c27]"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === Math.ceil(total / PAGE_SIZE)}
          className="p-2 border border-[#c4c6ce] rounded-lg hover:bg-[#f0f3ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  contracts: DerivedContractRow[]
  kpis: DerivedContractsKPIs
  canCreate?: boolean
  canCreateFuncionamiento?: boolean
  interadmins?: SimpleInteradmin[]
}

const UNIQUE_INTERADMIN = (contracts: DerivedContractRow[]) =>
  [...new Set(contracts.map((c) => c.id_interadministrativo).filter(Boolean))].sort() as string[]

export function DerivedContractsClient({ contracts, kpis, canCreate = false, canCreateFuncionamiento = false, interadmins = [] }: Props) {
  const [search, setSearch]           = useState("")
  const [convenioFilter, setConvenio] = useState("all")
  const [estadoFilter, setEstado]     = useState("all")
  const [minVal, setMinVal]           = useState("")
  const [maxVal, setMaxVal]           = useState("")
  const [claseFilter, setClase]       = useState("all")
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState<DerivedContractRow | null>(null)
  const [numSearch, setNumSearch]     = useState("")
  const [showNewModal, setShowNew]    = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const router = useRouter()

  const convenios = useMemo(() => UNIQUE_INTERADMIN(contracts), [contracts])
  const clases    = useMemo(() => [...new Set(contracts.map((c) => c.clase_contrato).filter(Boolean))].sort() as string[], [contracts])

  const filtered = useMemo(() => {
    const q   = search.toLowerCase().trim()
    const num = numSearch.toLowerCase().trim()
    const min = minVal ? Number(minVal.replace(/\D/g, "")) : null
    const max = maxVal ? Number(maxVal.replace(/\D/g, "")) : null
    return contracts.filter((c) => {
      if (num && !(c.numero_contrato ?? "").toLowerCase().includes(num)) return false
      if (q) {
        const hay = [c.numero_contrato, c.contratista, c.objeto_contrato, c.id_interadministrativo, c.parent_objeto]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (convenioFilter !== "all" && c.id_interadministrativo !== convenioFilter) return false
      if (estadoFilter   !== "all" && c.estado               !== estadoFilter)   return false
      if (claseFilter    !== "all" && c.clase_contrato        !== claseFilter)    return false
      const val = c.financials.valorActual
      if (min !== null && val < min) return false
      if (max !== null && val > max) return false
      return true
    })
  }, [contracts, search, numSearch, convenioFilter, estadoFilter, claseFilter, minVal, maxVal])

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  function resetPage() { setPage(1) }

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const res = await fetch("/api/reports/excel/derivados")
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `EPUXUA_Contratos_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("Error al generar el Excel: " + String(err))
    } finally {
      setIsDownloading(false)
    }
  }

  // KPIs
  const vigentes    = contracts.filter((c) => c.estado === "EN EJECUCIÓN").length
  const proximos    = contracts.filter((c) => {
    if (!c.fecha_terminacion || c.estado !== "EN EJECUCIÓN") return false
    const diff = Math.round((new Date(c.fecha_terminacion).getTime() - Date.now()) / 86400000)
    return diff >= 0 && diff <= 30
  }).length
  const liquidacion = contracts.filter((c) => c.estado === "CIERRE CONTRACTUAL" || c.estado === "LIQUIDADO").length
  const montoTotal  = contracts.reduce((s, c) => s + c.financials.valorActual, 0)

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-8 gap-4">
        <div>
          <nav className="flex items-center text-[#747783] text-[12px] font-medium mb-2 space-x-2">
            <Link href="/proyectos" className="hover:text-[#002869] transition-colors">Contratos</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="text-[#002869] font-semibold">Derivados</span>
          </nav>
          <h2 className="text-[32px] font-bold leading-[40px] text-[#002869]">Gestión de Contratos Derivados</h2>
          <p className="text-[#434652] text-base mt-1 max-w-3xl">
            Administración centralizada de contratos derivados de convenios interadministrativos o contratos marco operativos para la ejecución del plan de acción.
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center px-5 py-2.5 bg-[#0B3D91] text-white rounded-lg text-[12px] font-semibold hover:bg-[#002869] transition-all shadow-sm"
            >
              <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Contrato
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center px-5 py-2.5 border border-[#0B3D91] text-[#0B3D91] rounded-lg text-[12px] font-semibold hover:bg-[#f0f3ff] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {isDownloading ? "Generando…" : "Descargar Excel"}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
        {[
          {
            icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
            iconColor: "text-[#0B3D91]",
            iconBg: "bg-[#0B3D91]/10",
            label: "Monto Total Comprometido",
            value: `$ ${(montoTotal / 1_000_000).toFixed(0)}M`,
          },
          {
            icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
            iconColor: "text-[#10B981]",
            iconBg: "bg-[#10B981]/10",
            label: "Contratos Vigentes",
            value: String(vigentes),
          },
          {
            icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
            iconColor: "text-[#D9A520]",
            iconBg: "bg-[#D9A520]/10",
            label: "Próximos a Vencer",
            value: String(proximos),
          },
          {
            icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4",
            iconColor: "text-[#EF4444]",
            iconBg: "bg-[#EF4444]/10",
            label: "En Trámite Liquidación",
            value: String(liquidacion),
          },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#EAEAEA] rounded-xl p-4 sm:p-6 flex flex-col items-center text-center shadow-sm" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className={`w-12 h-12 ${k.iconBg} rounded-full flex items-center justify-center mb-4`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={k.iconColor}>
                <path d={k.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-[#747783] uppercase tracking-wider mb-1">{k.label}</p>
            <h4 className="text-[24px] font-semibold leading-[32px] text-[#151c27]">{k.value}</h4>
          </div>
        ))}
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 sm:p-6 mb-8" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center mb-4 space-x-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          <h3 className="text-[18px] font-semibold leading-[26px] text-[#151c27]">Panel de Filtros Avanzados</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="flex flex-col space-y-2">
            <label className="text-[12px] font-medium text-[#434652] tracking-wide">Número de Contrato</label>
            <input
              type="text"
              placeholder="Ej: 2024-DER-001"
              value={numSearch}
              onChange={(e) => { setNumSearch(e.target.value); resetPage() }}
              className="w-full px-4 py-2 border border-[#c4c6ce] rounded-lg focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent text-sm outline-none"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-[12px] font-medium text-[#434652] tracking-wide">Contrato Interadministrativo</label>
            <select
              value={convenioFilter}
              onChange={(e) => { setConvenio(e.target.value); resetPage() }}
              className="w-full px-4 py-2 border border-[#c4c6ce] rounded-lg focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent text-sm outline-none appearance-none bg-white"
            >
              <option value="all">Todos los convenios</option>
              {convenios.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-[12px] font-medium text-[#434652] tracking-wide">Nombre / Objeto</label>
            <input
              type="text"
              placeholder="Palabra clave..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full px-4 py-2 border border-[#c4c6ce] rounded-lg focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent text-sm outline-none"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-[12px] font-medium text-[#434652] tracking-wide">Rango de Valores</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={minVal}
                onChange={(e) => { setMinVal(e.target.value); resetPage() }}
                className="w-1/2 px-3 py-2 border border-[#c4c6ce] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]"
              />
              <span className="text-[#747783]">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxVal}
                onChange={(e) => { setMaxVal(e.target.value); resetPage() }}
                className="w-1/2 px-3 py-2 border border-[#c4c6ce] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-[12px] font-medium text-[#434652] tracking-wide">Tipología</label>
            <select
              value={claseFilter}
              onChange={(e) => { setClase(e.target.value); resetPage() }}
              className="w-full px-4 py-2 border border-[#c4c6ce] rounded-lg focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent text-sm outline-none appearance-none bg-white"
            >
              <option value="all">Todas las tipologías</option>
              {clases.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#f0f3ff] flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-[18px] font-semibold leading-[26px] text-[#151c27]">Registros Contractuales</span>
            <span className="bg-[#0B3D91]/10 text-[#0B3D91] text-[12px] font-semibold px-2 py-0.5 rounded-full">
              {filtered.length} Contrato{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => { setSearch(""); setNumSearch(""); setConvenio("all"); setEstado("all"); setClase("all"); setMinVal(""); setMaxVal(""); resetPage() }}
              className="p-2 hover:bg-[#e7eefe] rounded-lg text-[#747783] transition-colors"
              title="Limpiar filtros"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-[#151c27]">Sin contratos</p>
            <p className="text-xs text-[#434652] mt-1">Ningún derivado coincide con los filtros actuales.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-[#EAEAEA]">
                  <tr>
                    {["Número de Contrato", "Convenio Padre", "Contratista", "Objeto", "Tipología", "Valor Total", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="px-6 py-4 text-[11px] font-semibold text-[#434652] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {paginated.map((d) => {
                    // Ruta dedicada: /contratacion/derivados/[id numérico]
                    const expedientePath = d.id != null
                      ? `/contratacion/derivados/${d.id}`
                      : null
                    function openRow() {
                      if (expedientePath) router.push(expedientePath)
                      else setSelected(d)
                    }
                    return (
                    <tr
                      key={d.id}
                      className="hover:bg-[#f0f3ff] transition-colors group cursor-pointer"
                      onClick={openRow}
                    >
                      <td className="px-6 py-4 text-sm font-bold text-[#0B3D91] font-mono">
                        {d.numero_contrato ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#434652]">
                        {d.id_interadministrativo ? (
                          <Link
                            href={d.id_interadministrativo ? `/proyectos/${d.id_interadministrativo}` : "#"}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline hover:text-[#0B3D91] transition-colors"
                          >
                            {d.id_interadministrativo}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#151c27] max-w-[160px]">
                        <span className="truncate block">{d.contratista ?? "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#434652]">
                        <span className="truncate block max-w-[200px]" title={d.objeto_contrato ?? ""}>
                          {d.objeto_contrato
                            ? d.objeto_contrato.length > 60 ? d.objeto_contrato.slice(0, 60) + "…" : d.objeto_contrato
                            : d.origen_hoja ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {d.clase_contrato ? (
                          <span className="text-[11px] font-medium text-[#747783] px-2 py-1 rounded bg-[#f9f9ff] border border-[#c4c6ce]">
                            {d.clase_contrato}
                          </span>
                        ) : <span className="text-xs text-[#747783]">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-[#D9A520]">
                        {formatCOP(d.financials.valorActual)}
                      </td>
                      <td className="px-6 py-4">
                        <EstadoBadge estado={d.estado} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openRow() }}
                          className="text-[#747783] hover:text-[#0B3D91] transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <Paginator page={page} total={filtered.length} onChange={setPage} />
          </>
        )}
      </div>

      <ContractDetailDrawer contract={selected} onClose={() => setSelected(null)} />

      <NewContractModal
        open={showNewModal}
        onClose={() => setShowNew(false)}
        interadmins={interadmins}
        canCreateFuncionamiento={canCreateFuncionamiento}
      />
    </div>
  )
}
