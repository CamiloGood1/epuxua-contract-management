"use client"

import { useState, useTransition, useEffect } from "react"
import { X, History, Clock } from "lucide-react"
import { getChangeLog } from "@/services/update-interadmin.actions"
import { FIELD_LABELS } from "@/types/change-log"
import type { ChangeLogEntry } from "@/types/change-log"
import { formatDateTimeParts } from "@/lib/date-format"

interface Props {
  interadministrativoId: number
  contractId: string
  onClose: () => void
}

export function ChangeLogModal({ interadministrativoId, contractId, onClose }: Props) {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([])
  const [loading, startLoad]  = useTransition()
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    startLoad(async () => {
      const data = await getChangeLog(interadministrativoId)
      setEntries(data)
      setLoaded(true)
    })
  }, [interadministrativoId])

  function fmtDateTime(ts: string) {
    return formatDateTimeParts(ts)
  }

  const fmtVal = (field: string, val: string | null) => {
    if (!val) return "—"
    if (["valor_inicial","cuota_admin_inicial","total_contrato"].includes(field)) {
      const n = parseFloat(val)
      return isNaN(n) ? val : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
    }
    if (["pct_cuota_gerencia","avance_fisico_pct"].includes(field)) return `${val}%`
    return val
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] shrink-0">
          <div className="flex items-center gap-2.5">
            <History size={18} className="text-[#0B3D91]" />
            <div>
              <h2 className="text-base font-bold text-[#002869]">Historial de Cambios</h2>
              <p className="text-xs text-[#747783] mt-0.5">Contrato {contractId} — registro permanente de modificaciones</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !loaded && (
            <div className="flex items-center justify-center py-16 text-[#747783] text-sm">Cargando historial…</div>
          )}
          {loaded && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Clock size={36} className="text-[#EAEAEA] mb-3" />
              <p className="text-sm font-semibold text-[#151c27]">Sin cambios registrados</p>
              <p className="text-xs text-[#747783] mt-1">Los cambios futuros aparecerán aquí.</p>
            </div>
          )}
          {loaded && entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
                  <tr>
                    {["Fecha", "Hora", "Usuario", "Campo", "Valor Anterior", "Valor Nuevo"].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {entries.map(e => {
                    const dt = fmtDateTime(e.changed_at)
                    return (
                      <tr key={e.id} className="hover:bg-[#f9f9ff]">
                        <td className="px-4 py-2.5 text-xs text-[#434652] whitespace-nowrap">{dt.date}</td>
                        <td className="px-4 py-2.5 text-xs text-[#747783] whitespace-nowrap">{dt.time}</td>
                        <td className="px-4 py-2.5 text-xs text-[#434652] max-w-[150px]">
                          <span className="truncate block">{e.changed_by ?? "—"}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-[#151c27] whitespace-nowrap">
                          {FIELD_LABELS[e.field_name] ?? e.field_name}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[#747783] line-through max-w-[140px]">
                          <span className="truncate block" title={e.old_value ?? undefined}>
                            {fmtVal(e.field_name, e.old_value)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-emerald-700 font-semibold max-w-[140px]">
                          <span className="truncate block" title={e.new_value ?? undefined}>
                            {fmtVal(e.field_name, e.new_value)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#EAEAEA] shrink-0 flex items-center justify-between">
          <p className="text-xs text-[#747783]">{loaded ? `${entries.length} registro${entries.length !== 1 ? "s" : ""}` : ""}</p>
          <button type="button" onClick={onClose}
            className="h-9 px-5 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
