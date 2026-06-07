"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search, X, Download, GitBranch, ShieldCheck,
  AlertTriangle, Clock, Banknote, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import { resolveStatus, formatCOP, formatDate, STATUS_OPTIONS } from "@/modules/contracts/lib/status"
import type { Contract, ContractType } from "@/types/contract"
import type {
  DerivedContractRow,
  DerivedContractsKPIs,
} from "@/services/derived-contracts.service"
import { derivedContractHref } from "../lib/derived-contract-utils"

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: typeof Banknote
  iconColor: string
  iconBg: string
  label: string
  value: string
}) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon size={22} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const CONTRACT_CLASS_OPTIONS = [
  "Obra",
  "Consultoría",
  "Interventoría",
  "Prestación de Servicios",
  "Suministro",
  "Estudios y Diseños",
  "Otro",
]

interface Filters {
  search: string
  parentNumber: string
  status: string
  minValue: string
  maxValue: string
  contractClass: string
}

const EMPTY_FILTERS: Filters = {
  search: "",
  parentNumber: "all",
  status: "all",
  minValue: "",
  maxValue: "",
  contractClass: "all",
}

// ── Main client component ─────────────────────────────────────────────────────

interface Props {
  contracts: DerivedContractRow[]
  kpis: DerivedContractsKPIs
}

export function DerivedContractsClient({ contracts, kpis }: Props) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const set = (partial: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...partial }))

  // Lista de contratos padre para el select
  const parentOptions = useMemo(() => {
    const map = new Map<string, string>()
    contracts.forEach((c) => {
      if (c.parent_contract_id && c.parent_contract_number) {
        map.set(c.parent_contract_id, c.parent_contract_number)
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [contracts])

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    const min = filters.minValue ? Number(filters.minValue) : null
    const max = filters.maxValue ? Number(filters.maxValue) : null

    return contracts.filter((c) => {
      if (q) {
        const hay = [
          c.contract_number,
          c.object,
          c.contractor_name,
          c.parent_contract_number,
          c.project_code,
        ]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.parentNumber !== "all" && c.parent_contract_id !== filters.parentNumber) return false
      if (filters.status !== "all" && c.status !== filters.status) return false
      if (min !== null && (c.final_value ?? 0) < min) return false
      if (max !== null && (c.final_value ?? 0) > max) return false
      if (filters.contractClass !== "all") {
        const classLower = (c.contract_class ?? "").toLowerCase()
        if (!classLower.includes(filters.contractClass.toLowerCase())) return false
      }
      return true
    })
  }, [contracts, filters])

  const hasFilters = Object.entries(filters).some(([k, v]) =>
    k !== "minValue" && k !== "maxValue" ? v !== "" && v !== "all" : v !== ""
  )

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Banknote}
          iconColor="text-[var(--corporate-blue)]"
          iconBg="bg-blue-50"
          label="Monto total comprometido"
          value={formatCOP(kpis.totalCommitted)}
        />
        <KpiCard
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Contratos vigentes"
          value={String(kpis.activeContracts)}
        />
        <KpiCard
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Próximos a vencer"
          value={String(kpis.expiringContracts)}
        />
        <KpiCard
          icon={Clock}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          label="En trámite liquidación"
          value={String(kpis.inLiquidation)}
        />
      </div>

      {/* Búsqueda principal */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-4">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Buscar derivado
        </label>
        <div className="relative mt-1.5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Número de contrato, objeto, contratista o convenio padre..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/30"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Search size={15} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filtros adicionales</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Contrato interadministrativo padre */}
          <select
            value={filters.parentNumber}
            onChange={(e) => set({ parentNumber: e.target.value })}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="all">Todos los convenios</option>
            {parentOptions.map(([id, num]) => (
              <option key={id} value={id}>{num}</option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={filters.status}
            onChange={(e) => set({ status: e.target.value })}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Rango de valores */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Mín $"
              value={filters.minValue}
              onChange={(e) => set({ minValue: e.target.value })}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <span className="text-muted-foreground text-xs shrink-0">—</span>
            <input
              type="number"
              placeholder="Máx $"
              value={filters.maxValue}
              onChange={(e) => set({ maxValue: e.target.value })}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* Tipología */}
          <select
            value={filters.contractClass}
            onChange={(e) => set({ contractClass: e.target.value })}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="all">Todas las tipologías</option>
            {CONTRACT_CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Registros Contractuales</h3>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {filtered.length} {filtered.length === 1 ? "Contrato" : "Contratos"}
            </span>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <Download size={13} />
            Descargar Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#F8FAFC] text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Número de Contrato</th>
                <th className="px-4 py-3 font-semibold">Proyecto / Convenio</th>
                <th className="px-4 py-3 font-semibold">Contratista</th>
                <th className="px-4 py-3 font-semibold">Objeto</th>
                <th className="px-4 py-3 font-semibold">Tipología</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Valor Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                    <GitBranch size={28} className="mx-auto mb-3 text-muted-foreground/30" />
                    {hasFilters
                      ? "Ningún contrato coincide con los filtros."
                      : "No hay contratos derivados registrados."}
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(derivedContractHref(c))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        router.push(derivedContractHref(c))
                      }
                    }}
                    className="border-b border-[#EAEAEA] last:border-0 hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                  >
                    {/* Número */}
                    <td className="px-4 py-3.5">
                      <span
                        className="font-bold text-[var(--corporate-blue)] font-mono text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.contract_number}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.year}</p>
                    </td>

                    {/* Proyecto / convenio padre */}
                    <td className="px-4 py-3.5">
                      {c.project_id && c.project_code ? (
                        <Link
                          href={`/proyectos/${c.project_id}`}
                          className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.project_code}
                        </Link>
                      ) : c.parent_contract_number ? (
                        <span className="text-xs font-mono text-muted-foreground">
                          {c.parent_contract_number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </td>

                    {/* Contratista */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground text-xs leading-snug max-w-[160px] truncate">
                        {c.contractor_name}
                      </p>
                    </td>

                    {/* Objeto */}
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                        {c.object}
                      </p>
                    </td>

                    {/* Tipología */}
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                        {c.contract_class?.split(" ")[0] ?? "—"}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Valor */}
                    <td className="px-4 py-3.5 text-right">
                      <p className={cn(
                        "text-sm font-bold tabular-nums",
                        (c.final_value ?? 0) >= 1_000_000_000
                          ? "text-[var(--corporate-blue)]"
                          : (c.final_value ?? 0) >= 500_000_000
                          ? "text-amber-600"
                          : "text-foreground"
                      )}>
                        {formatCOP(c.final_value)}
                      </p>
                      {c.days_remaining != null && c.days_remaining <= 30 && c.status === "EN_EJECUCION" && (
                        <p className="text-[10px] text-destructive font-medium mt-0.5">
                          Vence {formatDate(c.end_date)}
                        </p>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="px-4 py-3.5">
                      <span
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground"
                        aria-hidden
                      >
                        <ExternalLink size={13} />
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#EAEAEA] text-xs text-muted-foreground">
            Mostrando 1 a {filtered.length} de {filtered.length} resultados
          </div>
        )}
      </div>
    </div>
  )
}
