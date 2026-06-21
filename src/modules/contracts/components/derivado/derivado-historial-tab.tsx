"use client"

import { History, Clock } from "lucide-react"
import type { ContractChangeLogEntry } from "@/types/contract-derivado"
import { CONTRACT_DERIVADO_FIELD_LABELS } from "@/types/contract-derivado"
import { formatDateTimeParts } from "@/lib/date-format"

// ── Formateo de valores ───────────────────────────────────────────────────────

const MONEY_FIELDS = new Set(["valor_inicial","adicion","valor_final","valor_pagado","valor_pendiente","pago"])

function fmtVal(field: string, val: string | null): string {
  if (!val) return "—"
  if (MONEY_FIELDS.has(field)) {
    const n = parseFloat(val)
    if (!isNaN(n)) { const d = n % 1 !== 0 ? 2 : 0; return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: d, maximumFractionDigits: d }).format(n) }
  }
  return val
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DerivedHistorialTab({ entries }: { entries: ContractChangeLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Clock size={36} className="text-[#EAEAEA] mb-3" />
        <p className="text-sm font-semibold text-[#151C27]">Sin cambios registrados</p>
        <p className="text-xs text-[#747783] mt-1">Los cambios futuros en el contrato aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <History size={18} className="text-[#0B3D91]" />
        <div>
          <h3 className="text-sm font-bold text-[#002869]">Historial de Cambios</h3>
          <p className="text-xs text-[#747783] mt-0.5">Registro permanente de modificaciones al contrato derivado</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#EAEAEA]">
        <table className="w-full text-sm">
          <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
            <tr>
              {["Fecha","Hora","Usuario","Campo","Valor Anterior","Valor Nuevo"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const { date, time } = formatDateTimeParts(e.changed_at)
              const label = CONTRACT_DERIVADO_FIELD_LABELS[e.field_name] ?? e.field_name
              return (
                <tr key={e.id} className={`border-b border-[#EAEAEA] last:border-0 ${i % 2 === 1 ? "bg-[#f9f9ff]" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">{date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[#747783]">{time}</td>
                  <td className="px-4 py-3 text-xs max-w-[140px] truncate">{e.changed_by ?? "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-[#0B3D91] bg-[#f0f3ff] px-2 py-0.5 rounded">{label}</span></td>
                  <td className="px-4 py-3 text-xs text-[#747783] max-w-[180px]">
                    <span className="block truncate" title={e.old_value ?? ""}>{fmtVal(e.field_name, e.old_value)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-[#151C27] max-w-[180px]">
                    <span className="block truncate" title={e.new_value ?? ""}>{fmtVal(e.field_name, e.new_value)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
