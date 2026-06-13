"use client"

import { useState, useMemo } from "react"
import { Plus, Search, AlertTriangle, Clock, CheckCircle2, TrendingUp, FileText } from "lucide-react"
import { ProposalStatusBadge } from "./proposal-status-badge"
import { ProposalFormModal } from "./proposal-form-modal"
import { ProposalDetailModal } from "./proposal-detail-modal"
import {
  PROPOSAL_TYPE_LABELS, PROPOSAL_STATUS_CONFIG, PROPOSAL_STATUS_ORDER,
  calcProposalKPIs, daysUntilDeadline,
} from "@/types/proposals"
import type { ProposalRequest, ProposalStatus } from "@/types/proposals"
import type { UserRole } from "@/types/project"
import { canCreateProposal, canEditProposal, canDeleteProposal } from "@/modules/proposals/lib/access"

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className={`bg-white border border-[#EAEAEA] rounded-xl px-5 py-4 flex flex-col gap-1 shadow-sm ${accent ? `border-l-4 ${accent}` : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#747783]">{label}</p>
      <p className="text-2xl font-bold text-[#002869]">{value}</p>
      {sub && <p className="text-[11px] text-[#747783]">{sub}</p>}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialProposals: ProposalRequest[]
  userRole: UserRole | null
}

export function ProposalsPageClient({ initialProposals, userRole }: Props) {
  const [proposals, setProposals] = useState<ProposalRequest[]>(initialProposals)
  const [search, setSearch]       = useState("")
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | "">("")
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]     = useState<ProposalRequest | null>(null)
  const [detail, setDetail]       = useState<ProposalRequest | null>(null)

  const canCreate = canCreateProposal(userRole)
  const canEdit   = canEditProposal(userRole)
  const canDelete = canDeleteProposal(userRole)

  const kpis = useMemo(() => calcProposalKPIs(proposals), [proposals])

  const filtered = useMemo(() => {
    let list = proposals
    if (filterStatus) list = list.filter(p => p.status === filterStatus)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.client_name.toLowerCase().includes(q) ||
        p.proposal_object.toLowerCase().includes(q) ||
        p.proposal_type.toLowerCase().includes(q)
      )
    }
    return list
  }, [proposals, filterStatus, search])

  const alerts = useMemo(() => {
    const ACTIVE = ["RECIBIDA", "EN_ESTRUCTURACION", "EN_REVISION", "PRESENTADA"]
    const active = proposals.filter(p => ACTIVE.includes(p.status))
    const today = new Date(); today.setHours(0,0,0,0)
    return {
      vencidas:      active.filter(p => new Date(p.proposal_delivery_deadline + "T00:00:00") < today),
      proximas:      active.filter(p => { const d = daysUntilDeadline(p.proposal_delivery_deadline); return d >= 0 && d <= 3 }),
      sinRemitir:    proposals.filter(p => p.status === "PRESENTADA" && !p.submission_date),
      enRevision:    proposals.filter(p => p.status === "EN_REVISION"),
    }
  }, [proposals])

  function handleSaved() {
    // Reload is triggered by revalidatePath — page.tsx re-fetches on next navigation.
    // For instant UX, refetch via the same server action approach would require a round-trip.
    // Simple approach: page will refresh on next navigation. For now just close.
  }

  function openDetail(p: ProposalRequest) {
    setDetail(p)
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#002869] leading-tight">Propuestas</h1>
          <p className="text-sm text-[#747783] mt-1">Gestión de solicitudes y propuestas precontractuales</p>
        </div>
        {canCreate && (
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B3D91] text-white rounded-lg text-sm font-semibold hover:bg-[#002869] transition-colors whitespace-nowrap">
            <Plus size={16} /> Nueva Propuesta
          </button>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Total" value={kpis.total} />
        <KpiCard label="Recibidas"         value={kpis.recibidas}        accent="border-l-blue-400"   />
        <KpiCard label="Estructurando"     value={kpis.enEstructuracion} accent="border-l-amber-400"  />
        <KpiCard label="En Revisión"       value={kpis.enRevision}       accent="border-l-purple-400" />
        <KpiCard label="Presentadas"       value={kpis.presentadas}      accent="border-l-cyan-400"   />
        <KpiCard label="Ganadas"           value={kpis.ganadas}          accent="border-l-emerald-500"/>
        <KpiCard label="No Adjudicadas"    value={kpis.noAdjudicadas}    accent="border-l-red-400"    />
      </div>

      {/* ── Alertas ── */}
      {(alerts.vencidas.length > 0 || alerts.proximas.length > 0 || alerts.sinRemitir.length > 0 || alerts.enRevision.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {alerts.vencidas.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">{alerts.vencidas.length} Propuesta{alerts.vencidas.length > 1 ? "s" : ""} Vencida{alerts.vencidas.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-red-600 mt-0.5">Plazo de entrega superado</p>
              </div>
            </div>
          )}
          {alerts.proximas.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">{alerts.proximas.length} Vencen en 3 días</p>
                <p className="text-xs text-amber-600 mt-0.5">Requieren atención urgente</p>
              </div>
            </div>
          )}
          {alerts.sinRemitir.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
              <FileText size={16} className="text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-purple-800">{alerts.sinRemitir.length} Sin fecha de remisión</p>
                <p className="text-xs text-purple-600 mt-0.5">Presentadas sin registrar remisión</p>
              </div>
            </div>
          )}
          {alerts.enRevision.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl">
              <TrendingUp size={16} className="text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-cyan-800">{alerts.enRevision.length} En Revisión</p>
                <p className="text-xs text-cyan-600 mt-0.5">Pendientes de retroalimentación</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747783]" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, objeto o tipo…"
            className="w-full pl-9 pr-3 h-9 text-sm border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value as ProposalStatus | "")}
          className="h-9 px-3 text-sm border border-[#EAEAEA] rounded-lg focus:outline-none appearance-none"
        >
          <option value="">Todos los estados</option>
          {PROPOSAL_STATUS_ORDER.map(s => (
            <option key={s} value={s}>{PROPOSAL_STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        {(search || filterStatus) && (
          <button type="button" onClick={() => { setSearch(""); setFilterStatus("") }}
            className="h-9 px-3 text-xs text-[#747783] border border-[#EAEAEA] rounded-lg hover:bg-[#f9f9f9]">
            Limpiar
          </button>
        )}
        <span className="h-9 flex items-center text-xs text-[#747783] ml-auto">
          {filtered.length} de {proposals.length} propuesta{proposals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <CheckCircle2 size={36} className="text-[#EAEAEA] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#151c27]">
              {proposals.length === 0 ? "Sin propuestas registradas" : "Sin resultados para el filtro"}
            </p>
            <p className="text-xs text-[#747783] mt-1">
              {proposals.length === 0 && canCreate ? "Crea la primera propuesta con el botón «Nueva Propuesta»." : ""}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-[#EAEAEA]">
                <tr>
                  {["Estado", "Cliente", "Objeto", "Tipología", "F. Recepción", "Plazo Entrega", "F. Remisión", "Días Rest.", "Responsable"].map(h => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filtered.map(p => {
                  const days = daysUntilDeadline(p.proposal_delivery_deadline)
                  const isActive = ["RECIBIDA", "EN_ESTRUCTURACION", "EN_REVISION", "PRESENTADA"].includes(p.status)
                  const daysColor = !isActive ? "text-[#747783]"
                    : days < 0 ? "text-red-600 font-bold"
                    : days <= 3 ? "text-amber-600 font-bold"
                    : "text-[#434652]"
                  return (
                    <tr key={p.id}
                      onClick={() => openDetail(p)}
                      className="hover:bg-[#f0f3ff] transition-colors cursor-pointer">
                      <td className="px-5 py-3.5 whitespace-nowrap"><ProposalStatusBadge status={p.status} /></td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#151c27] max-w-[160px]">
                        <span className="truncate block">{p.client_name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#434652] max-w-xs">
                        <span className="line-clamp-2">{p.proposal_object}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#434652] whitespace-nowrap">
                        {PROPOSAL_TYPE_LABELS[p.proposal_type] ?? p.proposal_type}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#747783] whitespace-nowrap">{fmtDate(p.reception_date)}</td>
                      <td className="px-5 py-3.5 text-sm text-[#747783] whitespace-nowrap">{fmtDate(p.proposal_delivery_deadline)}</td>
                      <td className="px-5 py-3.5 text-sm text-[#747783] whitespace-nowrap">{fmtDate(p.submission_date)}</td>
                      <td className={`px-5 py-3.5 text-sm whitespace-nowrap ${daysColor}`}>
                        {isActive
                          ? days < 0 ? `${Math.abs(days)}d vencida` : days === 0 ? "Hoy" : `${days}d`
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#747783] whitespace-nowrap max-w-[120px]">
                        <span className="truncate block">{p.created_by ?? "—"}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <ProposalFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); window.location.reload() }}
        />
      )}
      {editing && (
        <ProposalFormModal
          proposal={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); window.location.reload() }}
        />
      )}
      {detail && !editing && (
        <ProposalDetailModal
          proposal={detail}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null) }}
          onDeleted={() => { setDetail(null); window.location.reload() }}
        />
      )}
    </div>
  )
}
