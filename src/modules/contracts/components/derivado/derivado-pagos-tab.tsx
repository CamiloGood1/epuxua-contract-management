"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Trash2, ExternalLink, DollarSign } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { createContractPago, deleteContractPago } from "@/services/contract-pagos.actions"
import type { ContractPago } from "@/types/contract-derivado"
import type { DerivedContractFinancials } from "@/modules/contracts/lib/derived-contract-financials"
import { formatPctEjecutado } from "@/modules/contracts/lib/derived-contract-financials"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function parseMoney(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function PagoModal({ contratoId, projectId, valorContrato, valorPagadoAcumulado, onClose }: {
  contratoId: number; projectId: string
  valorContrato: number; valorPagadoAcumulado: number; onClose: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    fecha_pago: "", valor_pagado: "", numero_orden_pago: "",
    numero_factura_contratista: "", descuentos: "", observaciones: "", enlace_soporte: "",
  })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  const valorPagado   = parseMoney(form.valor_pagado)
  const descuentos    = parseMoney(form.descuentos)
  const valorNeto     = Math.max(0, valorPagado - descuentos)
  const saldoDisp     = Math.max(0, valorContrato - valorPagadoAcumulado)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (!form.fecha_pago) { setError("La fecha de pago es obligatoria."); return }
    if (valorPagado <= 0) { setError("Ingrese un valor pagado válido."); return }
    start(async () => {
      const res = await createContractPago({
        contrato_id: contratoId, project_id: projectId,
        fecha_pago: form.fecha_pago, valor_pagado: valorPagado,
        numero_orden_pago: form.numero_orden_pago,
        numero_factura_contratista: form.numero_factura_contratista,
        descuentos, valor_neto_girado: valorNeto,
        observaciones: form.observaciones, enlace_soporte: form.enlace_soporte,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  const inputCls = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">Registrar Pago al Contratista</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Saldo disponible */}
          <div className="bg-[#f0f3ff] rounded-xl px-4 py-3 flex items-center gap-3">
            <DollarSign size={16} className="text-[#0B3D91] shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-[#747783] uppercase">Saldo disponible</p>
              <p className="text-sm font-bold text-[#0B3D91]">{formatCOP(saldoDisp)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha de pago *</label>
              <input type="date" required value={form.fecha_pago}
                onChange={e => set("fecha_pago", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valor pagado *</label>
              <input value={form.valor_pagado}
                onChange={e => set("valor_pagado", e.target.value)}
                placeholder="Ej: 5000000" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>N° Orden de pago</label>
              <input value={form.numero_orden_pago}
                onChange={e => set("numero_orden_pago", e.target.value)}
                placeholder="OP-2024-001" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>N° Factura contratista</label>
              <input value={form.numero_factura_contratista}
                onChange={e => set("numero_factura_contratista", e.target.value)}
                placeholder="FV-001" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Descuentos</label>
            <input value={form.descuentos}
              onChange={e => set("descuentos", e.target.value)}
              placeholder="Retenciones, seguridad social…" className={inputCls} />
          </div>

          {/* Valor neto calculado */}
          {valorPagado > 0 && (
            <div className="bg-[#f9f9ff] rounded-xl px-4 py-3 flex flex-wrap gap-4 sm:gap-6 text-sm">
              <div><p className="text-[10px] text-[#747783] uppercase">Valor bruto</p><p className="font-bold">{formatCOP(valorPagado)}</p></div>
              <div><p className="text-[10px] text-[#747783] uppercase">Descuentos</p><p className="font-bold text-red-500">-{formatCOP(descuentos)}</p></div>
              <div><p className="text-[10px] text-[#747783] uppercase">Valor neto a girar</p><p className="font-bold text-[#10B981]">{formatCOP(valorNeto)}</p></div>
            </div>
          )}

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea value={form.observaciones} rows={2}
              onChange={e => set("observaciones", e.target.value)}
              className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none" />
          </div>

          <div>
            <label className={labelCls}>Enlace soporte</label>
            <input type="url" value={form.enlace_soporte}
              onChange={e => set("enlace_soporte", e.target.value)}
              placeholder="https://…" className={inputCls} />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9ff] disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#002869] text-white text-sm font-medium hover:bg-[#001a4d] transition-colors disabled:opacity-50">
              {isPending ? "Guardando…" : "Registrar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DerivedPagosTab({
  pagos, contratoId, projectId, financials, canEdit,
}: {
  pagos: ContractPago[]
  contratoId: number
  projectId: string
  financials: DerivedContractFinancials
  canEdit: boolean
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isPending, start]        = useTransition()

  const { valorActual, valorPagado, saldoPendiente, pctEjecutado } = financials
  const netoTotal = pagos.reduce((s, p) => s + Number(p.valor_neto_girado ?? p.valor_pagado), 0)

  function handleDelete(id: number) {
    if (!confirm("¿Eliminar este pago?")) return
    start(async () => { await deleteContractPago(id, contratoId, projectId); router.refresh() })
  }

  return (
    <>
      {showModal && (
        <PagoModal
          contratoId={contratoId} projectId={projectId}
          valorContrato={valorActual} valorPagadoAcumulado={valorPagado}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Valor Contrato",   val: formatCOP(valorActual), color: "text-[#002869]" },
          { label: "Pagado Acumulado", val: formatCOP(valorPagado),   color: "text-[#10B981]" },
          { label: "Saldo Pendiente",  val: formatCOP(saldoPendiente), color: saldoPendiente > 0 ? "text-[#D97706]" : "text-[#10B981]" },
          { label: "% Ejecutado",      val: formatPctEjecutado(pctEjecutado), color: "text-[#0B3D91]" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#EAEAEA] p-4 text-center">
            <p className={`text-lg font-bold ${color} leading-tight`}>{val}</p>
            <p className="text-[10px] text-[#747783] uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      <div className="bg-white rounded-xl border border-[#EAEAEA] p-4 mb-5">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-[#434652]">Avance financiero</span>
          <span className="font-bold text-[#0B3D91]">{formatPctEjecutado(pctEjecutado)}</span>
        </div>
        <div className="w-full h-2.5 bg-[#EAEAEA] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${pctEjecutado != null ? Math.min(100, pctEjecutado) : 0}%`,
              backgroundColor: (pctEjecutado ?? 0) >= 80 ? "#10B981" : (pctEjecutado ?? 0) >= 50 ? "#D97706" : "#EF4444",
            }} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#002869]">Registro de Pagos</h3>
        {canEdit && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002869] text-white rounded-lg text-xs font-medium hover:bg-[#001a4d] transition-colors">
            <Plus size={13} /> Registrar Pago
          </button>
        )}
      </div>

      {pagos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign size={36} className="text-[#EAEAEA] mb-3" />
          <p className="text-sm font-semibold text-[#151C27]">Sin pagos registrados</p>
          <p className="text-xs text-[#747783] mt-1">Los pagos realizados al contratista aparecerán aquí.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#EAEAEA]" style={{ opacity: isPending ? 0.6 : 1 }}>
          <table className="w-full text-sm">
            <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
              <tr>
                {["N°","Fecha","N° Orden","N° Factura","Valor Bruto","Descuentos","Valor Neto","Obs.",""].map(h => (
                  <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos.map((p, i) => (
                <tr key={p.id} className={`border-b border-[#EAEAEA] last:border-0 ${i % 2 === 1 ? "bg-[#f9f9ff]" : ""}`}>
                  <td className="px-3 py-3 font-mono text-xs">{p.numero_pago}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmtDate(p.fecha_pago)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{p.numero_orden_pago ?? "—"}</td>
                  <td className="px-3 py-3 font-mono text-xs">{p.numero_factura_contratista ?? "—"}</td>
                  <td className="px-3 py-3 tabular-nums text-[#10B981] font-semibold">{formatCOP(p.valor_pagado)}</td>
                  <td className="px-3 py-3 tabular-nums text-red-500">{p.descuentos > 0 ? formatCOP(p.descuentos) : "—"}</td>
                  <td className="px-3 py-3 tabular-nums font-bold text-[#002869]">{formatCOP(p.valor_neto_girado ?? p.valor_pagado)}</td>
                  <td className="px-3 py-3 max-w-[160px]">
                    {p.enlace_soporte ? (
                      <a href={p.enlace_soporte} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0B3D91] hover:underline">
                        <ExternalLink size={11} /> Soporte
                      </a>
                    ) : (
                      <span className="text-xs text-[#747783] truncate block max-w-[120px]" title={p.observaciones ?? ""}>
                        {p.observaciones?.slice(0, 30) ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {canEdit && (
                      <button onClick={() => handleDelete(p.id)} title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f0f3ff] border-t-2 border-[#0B3D91]/20">
              <tr>
                <td colSpan={4} className="px-3 py-2.5 text-xs font-bold text-[#747783] uppercase">Totales</td>
                <td className="px-3 py-2.5 font-bold text-[#10B981]">{formatCOP(valorPagado)}</td>
                <td className="px-3 py-2.5 font-bold text-red-500">{formatCOP(pagos.reduce((s, p) => s + Number(p.descuentos), 0))}</td>
                <td className="px-3 py-2.5 font-bold text-[#002869]">{formatCOP(netoTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  )
}
