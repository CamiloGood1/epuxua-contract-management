"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Search, X, GitBranch, Activity, CheckCircle2, Archive,
  Banknote, Layers, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { DerivedContractRow, DerivedContractsKPIs } from "@/services/derived-contracts.service"

function yearFromRef(ref: string | null | undefined): string {
  if (!ref) return "—"
  const m = ref.match(/(\d{4})$/)
  return m ? m[1] : "—"
}

function EstadoBadge({ estado }: { estado: DerivedContractRow["parent_estado"] }) {
  if (!estado) return <span className="text-muted-foreground text-xs">—</span>
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    "EN EJECUCIÓN": { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", label: "En ejecución" },
    "TERMINADO":    { cls: "bg-slate-50 text-slate-700 border-slate-200",   dot: "bg-slate-400",   label: "Terminado" },
    "LIQUIDADO":    { cls: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",    label: "Liquidado" },
  }
  const cfg = map[estado] ?? map["TERMINADO"]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function KpiCard({
  icon: Icon, iconColor, iconBg, label, value,
}: { icon: typeof Banknote; iconColor: string; iconBg: string; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon size={22} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

interface ParentGroup {
  id_interadministrativo: string
  parent_numeric_id: number | null
  parent_objeto: string | null
  parent_secretaria: string | null
  parent_estado: DerivedContractRow["parent_estado"]
  parent_total: number | null
  derivados: DerivedContractRow[]
}

function ParentGroupRow({ group, onSelect }: { group: ParentGroup; onSelect: (d: DerivedContractRow) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-[#F8FAFC] hover:bg-[#f0f4f8] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <GitBranch size={15} className="text-[var(--corporate-blue)] shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={group.parent_numeric_id != null ? `/proyectos/${group.parent_numeric_id}` : "#"}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-[var(--corporate-blue)] hover:underline shrink-0"
              >
                {group.id_interadministrativo}
              </Link>
              <EstadoBadge estado={group.parent_estado} />
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium shrink-0">
                {group.derivados.length} derivado{group.derivados.length !== 1 ? "s" : ""}
              </span>
            </div>
            {group.parent_objeto && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-lg">
                {group.parent_objeto}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 pl-4">
          {group.parent_secretaria && (
            <span className="text-[10px] text-muted-foreground hidden sm:block truncate max-w-[160px]">
              {group.parent_secretaria}
            </span>
          )}
          {group.parent_total != null && (
            <span className="text-xs font-semibold tabular-nums text-foreground hidden md:block">
              {formatCOP(group.parent_total)}
            </span>
          )}
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="divide-y divide-[#EAEAEA]">
          {group.derivados.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(d)}
              className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-[var(--corporate-blue)]/5 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground font-mono">{d.numero_contrato ?? "—"}</p>
                {d.contratista && (
                  <p className="text-[10px] text-muted-foreground truncate">{d.contratista}</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{d.objeto_contrato ?? d.origen_hoja ?? "—"}</p>
              </div>
              <span className="text-[10px] font-medium tabular-nums text-right">
                {d.valor_final != null ? formatCOP(d.valor_final) : "—"}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums text-right">
                {yearFromRef(d.numero_contrato)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  contracts: DerivedContractRow[]
  kpis: DerivedContractsKPIs
}

export function DerivedContractsClient({ contracts, kpis }: Props) {
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [selected, setSelected] = useState<DerivedContractRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (q) {
        const hay = [c.numero_contrato, c.contratista, c.objeto_contrato, c.id_interadministrativo, c.parent_objeto, c.parent_secretaria]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (estadoFilter !== "all" && c.parent_estado !== estadoFilter) return false
      return true
    })
  }, [contracts, search, estadoFilter])

  const groups = useMemo((): ParentGroup[] => {
    const map = new Map<string, ParentGroup>()
    for (const c of filtered) {
      const key = c.id_interadministrativo ?? "__sin_padre__"
      if (!map.has(key)) {
        map.set(key, {
          id_interadministrativo: c.id_interadministrativo ?? "Sin convenio",
          parent_numeric_id:      c.parent_id,
          parent_objeto:          c.parent_objeto,
          parent_secretaria:      c.parent_secretaria,
          parent_estado:          c.parent_estado,
          parent_total:           c.parent_total,
          derivados:              [],
        })
      }
      map.get(key)!.derivados.push(c)
    }
    return [...map.values()].sort((a, b) =>
      (a.id_interadministrativo ?? "").localeCompare(b.id_interadministrativo ?? "")
    )
  }, [filtered])

  const selCls = "h-9 rounded-lg border border-[#EAEAEA] bg-white pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20"

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Layers}      iconColor="text-[var(--corporate-blue)]" iconBg="bg-blue-50"    label="Total derivados"        value={String(kpis.totalContracts ?? contracts.length)} />
        <KpiCard icon={Activity}    iconColor="text-emerald-600"             iconBg="bg-emerald-50" label="Convenios en ejecución"  value={String(kpis.activeParents ?? kpis.activeContracts)} />
        <KpiCard icon={GitBranch}   iconColor="text-violet-600"              iconBg="bg-violet-50"  label="Convenios padre únicos"  value={String(kpis.uniqueParents ?? kpis.parentContractsCount)} />
        <KpiCard icon={Archive}     iconColor="text-slate-500"               iconBg="bg-slate-50"   label="Liquidados"              value={String(kpis.inLiquidation)} />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por N° contrato, convenio padre, objeto o secretaría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/30"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <select className={selCls} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
              <option value="all">Todos los estados (convenio)</option>
              <option value="EN EJECUCIÓN">En ejecución</option>
              <option value="TERMINADO">Terminado</option>
              <option value="LIQUIDADO">Liquidado</option>
            </select>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            <strong className="text-[var(--corporate-blue)]">{filtered.length}</strong> derivado{filtered.length !== 1 ? "s" : ""} en <strong>{groups.length}</strong> convenio{groups.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Lista agrupada por convenio padre */}
      {groups.length === 0 ? (
        <div className="bg-white border border-[#EAEAEA] rounded-xl flex flex-col items-center justify-center py-20 text-center">
          <GitBranch size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">Sin contratos derivados</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || estadoFilter !== "all"
              ? "Ningún derivado coincide con los filtros."
              : "No hay contratos derivados registrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <ParentGroupRow key={g.id_interadministrativo} group={g} onSelect={setSelected} />
          ))}
        </div>
      )}

      <ContractDetailDrawer
        contract={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
