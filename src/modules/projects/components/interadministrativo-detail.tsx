"use client"

import { useState, useMemo } from "react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_CONFIG } from "../lib/lifecycle"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { Interadministrativo, Contrato, EstadoInteradministrativo } from "@/types/database"
import type { ModificacionesData } from "@/types/modificaciones"
import { EMPTY_MODIFICACIONES } from "@/types/modificaciones"
import { EditBasicModal } from "./expediente/edit-basic-modal"
import { ChangeLogModal } from "./expediente/change-log-modal"
import { ModificacionesTab } from "./expediente/modificaciones-tab"
import { FacturacionTab } from "./expediente/facturacion-tab"
import type { Factura } from "./expediente/facturacion-tab"
import { FormaPagoTab } from "./expediente/forma-pago-tab"
import type { PaymentMilestone } from "./expediente/forma-pago-tab"
import { SeguimientoTab } from "./expediente/seguimiento-tab"
import type { Tarea, Avance } from "./expediente/seguimiento-tab"
import { InfoGeneralTab } from "./expediente/info-general-tab"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined) { return v ?? "—" }
function fmtMoney(v: number | null | undefined) { return v == null ? "—" : formatCOP(v) }

// ── Estado badge interadmin ───────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoInteradministrativo }) {
  const cfg = ESTADO_CONFIG[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  )
}

// ── Estado badge contrato ─────────────────────────────────────────────────────

const CONT_CFG: Record<string, { dot: string; text: string; bg: string }> = {
  "EN EJECUCIÓN":              { dot: "bg-[#10B981]", text: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  "CIERRE CONTRACTUAL":        { dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  "TERMINADO":                 { dot: "bg-[#747783]", text: "text-[#747783]", bg: "bg-[#747783]/10" },
  "LIQUIDADO":                 { dot: "bg-[#0B3D91]", text: "text-[#0B3D91]", bg: "bg-[#0B3D91]/10" },
  "SUSPENDIDO":                { dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  "TERMINADO ANTICIPADAMENTE": { dot: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
  "DECLARADO FALLIDO":         { dot: "bg-[#EF4444]", text: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
  "NO SUSCRITO":               { dot: "bg-gray-400",   text: "text-gray-500",   bg: "bg-gray-50" },
  "TERMINADO ANORMALMENTE":    { dot: "bg-rose-500",   text: "text-rose-600",   bg: "bg-rose-50" },
}

function ContratoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-xs text-[#747783]">Sin estado</span>
  const cfg = CONT_CFG[estado] ?? { dot: "bg-[#747783]", text: "text-[#747783]", bg: "bg-[#747783]/10" }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {estado}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  project: Interadministrativo
  contratos: Contrato[]
  canEdit: boolean
  canDelete?: boolean
  modificaciones?: ModificacionesData
  hitos?: PaymentMilestone[]
  facturas?: Factura[]
  tareas?: Tarea[]
  avances?: Avance[]
  contratosError?: string
}

type TabId = "info" | "contratos" | "modificaciones" | "forma_pago" | "facturacion" | "seguimiento"

// ── Componente principal ──────────────────────────────────────────────────────

export function InteradministrativoDetail({ project: p, contratos, contratosError, canEdit, canDelete = false, modificaciones = EMPTY_MODIFICACIONES, hitos = [], facturas = [], tareas = [], avances = [] }: Props) {
  const [tab, setTab]             = useState<TabId>("info")
  const [selected, setSelected]   = useState<Contrato | null>(null)
  const [showEdit, setShowEdit]   = useState(false)
  const [showChanges, setShowChanges] = useState(false)

  const derivados      = useMemo(() => contratos.filter((c) => c.tipo_contrato === "DERIVADO"), [contratos])
  const enEjecucion    = useMemo(() => derivados.filter((c) => c.estado === "EN EJECUCIÓN").length, [derivados])
  const valorDerivados = useMemo(() => derivados.reduce((s, c) => s + (c.valor_final ?? c.valor_inicial ?? 0), 0), [derivados])

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 text-[12px] text-[#747783] mb-3">
          <span>Contratos</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="text-[#002869] font-semibold">{p.id_contrato}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {p.clase_contrato && (
              <span className="text-[11px] font-bold uppercase tracking-wide bg-[#0B3D91]/10 text-[#0B3D91] px-3 py-1 rounded-full">
                {p.clase_contrato}
              </span>
            )}
            <EstadoBadge estado={p.estado} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChanges(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#EAEAEA] bg-white rounded-lg text-sm text-[#434652] hover:bg-[#f0f3ff] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="12 8 12 12 14 14"/><circle cx="12" cy="12" r="10"/></svg>
              Historial
            </button>
            {canEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0B3D91] text-white rounded-lg text-sm font-medium hover:bg-[#002869] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar Registro
              </button>
            )}
          </div>
        </div>

        <h2 className="text-[24px] font-bold text-[#002869] mt-3 leading-snug">
          CONTRATO No. {p.id_contrato}
        </h2>
        {p.objeto_contrato && (
          <p className="text-[#434652] mt-2 max-w-3xl leading-relaxed">{p.objeto_contrato}</p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[#EAEAEA] flex gap-0 overflow-x-auto">
        {([
          { id: "info"           as TabId, label: "Información General" },
          { id: "contratos"      as TabId, label: "Contratos Derivados", badge: derivados.length },
          { id: "modificaciones" as TabId, label: "Modificaciones Contractuales", badge: modificaciones.adiciones.length + modificaciones.prorrogas.length + modificaciones.suspensiones.length + modificaciones.reinicios.length + modificaciones.aclaratorios.length || undefined },
          { id: "forma_pago"     as TabId, label: "Forma de Pago Contractual", badge: hitos.length || undefined },
          { id: "facturacion"    as TabId, label: "Facturación y Recaudo", badge: facturas.length || undefined },
          { id: "seguimiento"    as TabId, label: "Seguimiento", badge: tareas.filter(t => t.status !== "COMPLETADA").length || undefined },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.id
                ? "border-[#0B3D91] text-[#0B3D91]"
                : "border-transparent text-[#747783] hover:text-[#434652]"
            }`}
          >
            {t.label}
            {t.badge != null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-[#0B3D91]/10 text-[#0B3D91]" : "bg-[#f0f3ff] text-[#747783]"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Información General ── */}
      {tab === "info" && (
        <InfoGeneralTab
          project={p}
          contratos={contratos}
          modificaciones={modificaciones}
          hitos={hitos}
          facturas={facturas}
          tareas={tareas}
          canEdit={canEdit}
          onTabChange={setTab}
          onEditClick={() => setShowEdit(true)}
        />
      )}

      {/* ── Tab: Contratos Derivados ── */}
      {tab === "contratos" && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          {contratosError ? (
            <div className="p-6 text-sm text-red-600">{contratosError}</div>
          ) : derivados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-[#151c27]">Sin contratos derivados</p>
              <p className="text-xs text-[#747783] mt-1">No hay contratos derivados registrados para este convenio.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#f0f3ff] flex flex-wrap gap-6 text-sm">
                <span><strong>{derivados.length}</strong> contratos derivados</span>
                <span><strong className="text-[#10B981]">{enEjecucion}</strong> en ejecución</span>
                <span>Valor total: <strong className="text-[#D9A520]">{fmtMoney(valorDerivados)}</strong></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-[#EAEAEA]">
                    <tr>
                      {["N° Contrato", "Objeto", "Contratista", "Estado", "Supervisor", "Valor Final", "Pendiente", "F. Terminación"].map((h) => (
                        <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#747783]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {derivados.map((c) => (
                      <tr key={c.id} onClick={() => setSelected(c)}
                        className="hover:bg-[#f0f3ff] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-3.5 text-sm font-bold text-[#0B3D91] font-mono whitespace-nowrap">{c.numero_contrato ?? "—"}</td>
                        <td className="px-6 py-3.5 text-sm text-[#434652] max-w-xs"><span className="line-clamp-2">{c.objeto_contrato ?? "—"}</span></td>
                        <td className="px-6 py-3.5 text-sm font-medium text-[#151c27] max-w-[140px]"><span className="truncate block">{c.contratista ?? "—"}</span></td>
                        <td className="px-6 py-3.5"><ContratoBadge estado={c.estado} /></td>
                        <td className="px-6 py-3.5 text-sm text-[#434652] max-w-[110px]"><span className="truncate block">{c.supervisor ?? "—"}</span></td>
                        <td className="px-6 py-3.5 text-sm font-bold text-[#D9A520] text-right tabular-nums whitespace-nowrap">
                          {c.valor_final != null ? fmtMoney(c.valor_final) : fmtMoney(c.valor_inicial)}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-amber-600 font-medium text-right tabular-nums whitespace-nowrap">
                          {c.valor_pendiente != null ? fmtMoney(c.valor_pendiente) : "—"}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-[#747783] whitespace-nowrap">{c.fecha_terminacion ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Modificaciones Contractuales ── */}
      {tab === "modificaciones" && (
        <ModificacionesTab
          interadministrativoId={p.id}
          fechaTerminacionOriginal={p.fecha_terminacion}
          modificaciones={modificaciones}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* ── Tab: Forma de Pago Contractual ── */}
      {tab === "forma_pago" && (
        <FormaPagoTab
          project={p}
          hitos={hitos}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* ── Tab: Facturación y Recaudo ── */}
      {tab === "facturacion" && (
        <FacturacionTab
          interadministrativoId={p.id}
          facturas={facturas}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* ── Tab: Seguimiento ── */}
      {tab === "seguimiento" && (
        <SeguimientoTab
          interadministrativoId={p.id}
          tareas={tareas}
          avances={avances}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      <ContractDetailDrawer contract={selected} onClose={() => setSelected(null)} />

      {showEdit    && <EditBasicModal project={p} onClose={() => setShowEdit(false)} />}
      {showChanges && <ChangeLogModal interadministrativoId={p.id} contractId={p.id_contrato} onClose={() => setShowChanges(false)} />}
    </div>
  )
}
