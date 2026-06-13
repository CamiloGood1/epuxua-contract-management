"use client"

import { useState, useTransition, useEffect } from "react"
import { X, History, ExternalLink, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { getProposalAuditLog, deleteProposal } from "@/services/proposals.actions"
import { PROPOSAL_FIELD_LABELS, PROPOSAL_TYPE_LABELS, daysUntilDeadline } from "@/types/proposals"
import type { ProposalRequest, ProposalAuditEntry } from "@/types/proposals"
import { ProposalStatusBadge } from "./proposal-status-badge"

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtDateTime(ts: string) {
  const d = new Date(ts)
  return {
    date: d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
  }
}

interface Props {
  proposal: ProposalRequest
  canEdit: boolean
  canDelete: boolean
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}

export function ProposalDetailModal({ proposal: p, canEdit, canDelete, onClose, onEdit, onDeleted }: Props) {
  const [tab, setTab]           = useState<"info" | "history">("info")
  const [audit, setAudit]       = useState<ProposalAuditEntry[]>([])
  const [auditLoaded, setAuditLoaded] = useState(false)
  const [loadingAudit, startAudit]    = useTransition()
  const [confirmDel, setConfirmDel]   = useState(false)
  const [delPending, startDel]        = useTransition()
  const [delError, setDelError]       = useState<string | null>(null)
  const [showObs, setShowObs]   = useState(false)

  useEffect(() => {
    if (tab === "history" && !auditLoaded) {
      startAudit(async () => {
        const data = await getProposalAuditLog(p.id)
        setAudit(data)
        setAuditLoaded(true)
      })
    }
  }, [tab, auditLoaded, p.id])

  function handleDelete() {
    setDelError(null)
    startDel(async () => {
      const res = await deleteProposal(p.id)
      if (res.error) { setDelError(res.error); return }
      onDeleted()
    })
  }

  const days = daysUntilDeadline(p.proposal_delivery_deadline)
  const isActive = ["RECIBIDA", "EN_ESTRUCTURACION", "EN_REVISION", "PRESENTADA"].includes(p.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#EAEAEA] shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#747783]">Propuesta #{p.id}</span>
              <ProposalStatusBadge status={p.status} />
            </div>
            <h2 className="text-base font-bold text-[#002869] leading-snug line-clamp-2">{p.client_name}</h2>
            <p className="text-xs text-[#747783] mt-0.5">
              {PROPOSAL_TYPE_LABELS[p.proposal_type] ?? p.proposal_type}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {canEdit && (
              <button type="button" onClick={onEdit}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[#EAEAEA] rounded-lg hover:bg-[#f0f3ff] text-[#0B3D91]">
                <Edit2 size={12} /> Editar
              </button>
            )}
            {canDelete && !confirmDel && (
              <button type="button" onClick={() => setConfirmDel(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-600">
                <Trash2 size={12} /> Eliminar
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Confirm delete */}
        {confirmDel && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-semibold text-red-800 mb-2">¿Eliminar esta propuesta permanentemente?</p>
            {delError && <p className="text-xs text-red-600 mb-2">{delError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDel(false)} className="flex-1 h-8 text-xs rounded-lg border border-[#EAEAEA] hover:bg-white">Cancelar</button>
              <button type="button" onClick={handleDelete} disabled={delPending}
                className="flex-1 h-8 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60">
                {delPending ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[#EAEAEA] flex px-6">
          {[
            { id: "info" as const,    label: "Información General" },
            { id: "history" as const, label: "Trazabilidad", icon: <History size={12} /> },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
                tab === t.id ? "border-[#0B3D91] text-[#0B3D91]" : "border-transparent text-[#747783] hover:text-[#434652]"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {tab === "info" && (
            <div className="space-y-5">
              {/* Alerta días */}
              {isActive && days <= 3 && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${days < 0 ? "bg-red-50 border border-red-200 text-red-700" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
                  <span>{days < 0 ? `⚠ Vencida hace ${Math.abs(days)} días` : days === 0 ? "⚠ Vence hoy" : `⚠ Vence en ${days} días`}</span>
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f0f3ff] rounded-xl p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#747783] mb-1">Fecha Recepción</p>
                  <p className="text-sm font-bold text-[#002869]">{fmtDate(p.reception_date)}</p>
                </div>
                <div className="bg-[#f0f3ff] rounded-xl p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#747783] mb-1">Plazo de Entrega</p>
                  <p className={`text-sm font-bold ${isActive && days < 0 ? "text-red-600" : isActive && days <= 3 ? "text-amber-700" : "text-[#002869]"}`}>
                    {fmtDate(p.proposal_delivery_deadline)}
                  </p>
                </div>
                {p.submission_date && (
                  <div className="bg-emerald-50 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#747783] mb-1">Fecha Remisión</p>
                    <p className="text-sm font-bold text-emerald-700">{fmtDate(p.submission_date)}</p>
                  </div>
                )}
                <div className="bg-[#f0f3ff] rounded-xl p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#747783] mb-1">Responsable</p>
                  <p className="text-sm font-bold text-[#002869]">{p.created_by ?? "—"}</p>
                </div>
              </div>

              {/* Objeto */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3D91] mb-2">Objeto</p>
                <p className="text-sm text-[#434652] leading-relaxed">{p.proposal_object}</p>
              </div>

              {/* Observaciones */}
              {p.observations && (
                <div>
                  <button type="button" onClick={() => setShowObs(v => !v)}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#0B3D91] mb-2">
                    Observaciones {showObs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showObs && (
                    <p className="text-sm text-[#434652] leading-relaxed bg-[#f9f9ff] rounded-xl px-3 py-2.5">{p.observations}</p>
                  )}
                </div>
              )}

              {/* Links */}
              {(p.request_link || p.proposal_link) && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3D91] mb-2">Enlaces</p>
                  <div className="space-y-2">
                    {p.request_link && (
                      <a href={p.request_link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-[#f0f3ff] border border-[#0B3D91]/10 rounded-lg text-sm text-[#0B3D91] hover:bg-[#e6ecff] transition-colors">
                        <ExternalLink size={14} /> Solicitud de Propuesta
                      </a>
                    )}
                    {p.proposal_link && (
                      <a href={p.proposal_link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-[#f0f3ff] border border-[#0B3D91]/10 rounded-lg text-sm text-[#0B3D91] hover:bg-[#e6ecff] transition-colors">
                        <ExternalLink size={14} /> Propuesta
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "history" && (
            <div>
              {loadingAudit && !auditLoaded && (
                <p className="text-sm text-[#747783] py-8 text-center">Cargando trazabilidad…</p>
              )}
              {auditLoaded && audit.length === 0 && (
                <p className="text-sm text-[#747783] py-8 text-center">Sin registros de trazabilidad.</p>
              )}
              {auditLoaded && audit.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
                      <tr>
                        {["Fecha", "Hora", "Usuario", "Acción", "Campo", "Valor Anterior", "Valor Nuevo"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {audit.map(e => {
                        const dt = fmtDateTime(e.changed_at)
                        return (
                          <tr key={e.id} className="hover:bg-[#f9f9ff]">
                            <td className="px-3 py-2 text-xs text-[#434652] whitespace-nowrap">{dt.date}</td>
                            <td className="px-3 py-2 text-xs text-[#747783] whitespace-nowrap">{dt.time}</td>
                            <td className="px-3 py-2 text-xs text-[#434652] max-w-[120px]"><span className="truncate block">{e.changed_by ?? "—"}</span></td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                e.action === "CREATE" ? "bg-emerald-100 text-emerald-700" :
                                e.action === "UPDATE" ? "bg-blue-100 text-blue-700" :
                                "bg-red-100 text-red-700"
                              }`}>{e.action}</span>
                            </td>
                            <td className="px-3 py-2 text-xs font-semibold text-[#151c27] whitespace-nowrap">
                              {e.field_name ? (PROPOSAL_FIELD_LABELS[e.field_name] ?? e.field_name) : "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#747783] line-through max-w-[120px]"><span className="truncate block">{e.old_value ?? "—"}</span></td>
                            <td className="px-3 py-2 text-xs text-emerald-700 font-semibold max-w-[120px]"><span className="truncate block">{e.new_value ?? "—"}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#EAEAEA] shrink-0 flex justify-end">
          <button type="button" onClick={onClose}
            className="h-9 px-5 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
