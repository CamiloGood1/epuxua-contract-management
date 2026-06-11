"use client"

import { useState, useMemo } from "react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_CONFIG } from "../lib/lifecycle"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { Interadministrativo, Contrato, EstadoInteradministrativo } from "@/types/database"
import type { ModificacionesData } from "@/types/modificaciones"
import { EMPTY_MODIFICACIONES } from "@/types/modificaciones"
import { EditBasicModal } from "./expediente/edit-basic-modal"
import { ModificacionesTab } from "./expediente/modificaciones-tab"
import { FacturacionTab } from "./expediente/facturacion-tab"
import type { Factura } from "./expediente/facturacion-tab"
import { FormaPagoTab } from "./expediente/forma-pago-tab"
import type { PaymentMilestone } from "./expediente/forma-pago-tab"
import { SeguimientoTab } from "./expediente/seguimiento-tab"
import type { Tarea, Avance } from "./expediente/seguimiento-tab"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined) { return v ?? "—" }
function fmtMoney(v: number | null | undefined) { return v == null ? "—" : formatCOP(v) }

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  const n = new Date();       n.setHours(0,0,0,0)
  return Math.round((d.getTime() - n.getTime()) / 86400000)
}

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

// ── Circular progress SVG ─────────────────────────────────────────────────────

function CircularProgress({ pct, label = "Avance Físico" }: { pct: number; label?: string }) {
  const r    = 15.915
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="transparent" stroke="#F1F5F9" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="transparent"
          stroke="#0B3D91" strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#002869]">{pct}%</span>
        <span className="text-[9px] uppercase font-bold text-[#434652] tracking-tight text-center leading-tight px-1">{label}</span>
      </div>
    </div>
  )
}

// ── Chip de tipo modificación ─────────────────────────────────────────────────

function ModChip({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    ADICIÓN:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PRÓRROGA:  "bg-amber-50   text-amber-700   border border-amber-200",
    SUSPENSIÓN:"bg-yellow-50  text-yellow-700  border border-yellow-200",
    REINICIO:  "bg-blue-50    text-blue-700    border border-blue-200",
    ACLARACIÓN:"bg-violet-50  text-violet-700  border border-violet-200",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[tipo] ?? "bg-gray-50 text-gray-600 border border-gray-200"}`}>
      {tipo}
    </span>
  )
}

// ── Hito timeline ─────────────────────────────────────────────────────────────

function HitosTimeline({ p }: { p: Interadministrativo }) {
  const hitos = [
    { label: "Suscripción",   date: p.fecha_suscripcion,    done: true },
    { label: "Inicio",        date: p.fecha_inicio_ejecucion,done: !!p.fecha_inicio_ejecucion },
    { label: "Ejecución",     date: null,                    done: p.estado === "EN EJECUCIÓN", active: p.estado === "EN EJECUCIÓN" },
    { label: "Terminación",   date: p.fecha_terminacion,    done: p.estado === "TERMINADO" || p.estado === "LIQUIDADO" },
    { label: "Liquidación",   date: null,                    done: p.estado === "LIQUIDADO" },
  ]

  return (
    <div className="relative">
      <div className="flex items-start justify-between">
        {hitos.map((h, i) => (
          <div key={h.label} className="flex flex-col items-center flex-1 relative">
            {i < hitos.length - 1 && (
              <div className="absolute top-3.5 left-1/2 w-full h-0.5" style={{ background: h.done ? "#0B3D91" : "#E2E8F0" }} />
            )}
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 ${
              h.done
                ? "bg-[#0B3D91] border-[#0B3D91]"
                : (h as { active?: boolean }).active
                  ? "bg-white border-[#0B3D91]"
                  : "bg-white border-[#E2E8F0]"
            }`}>
              {h.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {(h as { active?: boolean }).active && !h.done && (
                <div className="w-2 h-2 rounded-full bg-[#0B3D91]" />
              )}
            </div>
            <p className="text-[10px] font-semibold text-[#434652] mt-2 text-center">{h.label}</p>
            {h.date && <p className="text-[9px] text-[#747783] text-center">{h.date}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sidebar derecho ───────────────────────────────────────────────────────────

function Sidebar({ p, fechaTerminacionVigente, ultimaProrroga }: { p: Interadministrativo; fechaTerminacionVigente: string | null | undefined; ultimaProrroga?: { nueva_fecha_terminacion: string } | null }) {
  const days = daysUntil(fechaTerminacionVigente ?? p.fecha_terminacion)
  const isExpired  = days !== null && days < 0
  const isCritical = days !== null && !isExpired && days <= 30

  return (
    <div className="space-y-4 lg:sticky lg:top-4">

      {/* Actores Clave */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <h4 className="text-[12px] font-bold uppercase tracking-widest text-[#747783] mb-4 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Actores Clave
        </h4>
        <div className="space-y-3">
          {p.supervision && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0B3D91]/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#151c27] leading-tight">{p.supervision}</p>
                <p className="text-[10px] text-[#747783] mt-0.5">Supervisor del contrato</p>
                <span className="text-[9px] font-bold text-[#0B3D91] bg-[#0B3D91]/10 px-1.5 py-0.5 rounded mt-1 inline-block">Contactar</span>
              </div>
            </div>
          )}
          {p.secretaria && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#151c27] leading-tight">{p.secretaria}</p>
                <p className="text-[10px] text-[#747783] mt-0.5">Secretaría contratante</p>
              </div>
            </div>
          )}
          {p.area_responsable && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#151c27] leading-tight">{p.area_responsable}</p>
                <p className="text-[10px] text-[#747783] mt-0.5">Área responsable</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fechas y Plazos */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <h4 className="text-[12px] font-bold uppercase tracking-widest text-[#747783] mb-4 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Fechas y Plazos
        </h4>
        <div className="space-y-3">
          {[
            { label: "Suscripción",             value: p.fecha_suscripcion,        color: "text-[#151c27]" },
            { label: "Inicio de Plazo",          value: p.fecha_inicio_ejecucion,   color: "text-[#151c27]" },
            { label: "Vencimiento Original",     value: p.fecha_terminacion,        color: "text-[#151c27]" },
            { label: "Terminación Vigente",      value: ultimaProrroga ? ultimaProrroga.nueva_fecha_terminacion : null, color: "text-amber-600" },
          ].map(({ label, value, color }) => value && (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-[#434652]">{label}</span>
              <span className={`text-xs font-semibold tabular-nums ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Días restantes */}
        {days !== null && (
          <div className={`mt-4 rounded-xl p-4 text-center ${
            isExpired  ? "bg-red-50 border border-red-200" :
            isCritical ? "bg-amber-50 border border-amber-200" :
                        "bg-[#0B3D91]/5 border border-[#0B3D91]/20"
          }`}>
            <p className={`text-3xl font-bold tabular-nums ${isExpired ? "text-[#EF4444]" : isCritical ? "text-amber-600" : "text-[#0B3D91]"}`}>
              {Math.abs(days)}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#434652] mt-1">
              {isExpired ? "días vencido" : "días restantes"}
            </p>
            {p.plazo_ejecucion_inicial && (
              <p className="text-[9px] text-[#747783] mt-1">Plazo inicial: {p.plazo_ejecucion_inicial}</p>
            )}
          </div>
        )}
      </div>

    </div>
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
  const [tab, setTab]           = useState<TabId>("info")
  const [selected, setSelected] = useState<Contrato | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  const derivados      = useMemo(() => contratos.filter((c) => c.tipo_contrato === "DERIVADO"), [contratos])
  const enEjecucion    = useMemo(() => derivados.filter((c) => c.estado === "EN EJECUCIÓN").length, [derivados])
  const valorDerivados = useMemo(() => derivados.reduce((s, c) => s + (c.valor_final ?? c.valor_inicial ?? 0), 0), [derivados])

  // Financiero
  const total    = p.total_contrato    ?? 0
  const cuota    = p.total_cuota_admin ?? 0
  const pendiente = p.valor_pendiente_cobrar ?? cuota
  const cobrado   = Math.max(0, cuota - pendiente)
  const avanceFisico = p.avance_fisico_pct ?? 0

  // Impacto de modificaciones sobre valores y fechas
  const totalAdicionesNuevo = modificaciones.adiciones.reduce((s, a) => s + (a.valor_total ?? 0), 0)
  const ultimaProrroga      = modificaciones.prorrogas.at(-1)
  const fechaTerminacionVigente = ultimaProrroga?.nueva_fecha_terminacion ?? p.fecha_terminacion

  // Modificaciones: armar desde campos disponibles
  const mods = [
    p.adicion && p.adicion > 0
      ? { tipo: "ADICIÓN",    fecha: p.fecha_suscripcion ?? "—", detalle: "Adición al valor del contrato", impacto: `+${fmtMoney(p.adicion)}`, accent: "text-emerald-600" }
      : null,
    p.prorroga
      ? { tipo: "PRÓRROGA",   fecha: p.fecha_terminacion ?? "—", detalle: p.prorroga, impacto: "Extensión de plazo", accent: "text-amber-600" }
      : null,
    p.suspension
      ? { tipo: "SUSPENSIÓN", fecha: "—", detalle: p.suspension, impacto: "Suspensión efectiva", accent: "text-yellow-600" }
      : null,
    p.reinicio
      ? { tipo: "REINICIO",   fecha: "—", detalle: p.reinicio, impacto: "Reinicio de ejecución", accent: "text-blue-600" }
      : null,
  ].filter(Boolean) as { tipo: string; fecha: string; detalle: string; impacto: string; accent: string }[]

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
            <button className="flex items-center gap-1.5 px-4 py-2 border border-[#EAEAEA] bg-white rounded-lg text-sm text-[#434652] hover:bg-[#f0f3ff] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Ficha
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Contenido principal */}
          <div className="space-y-5">

            {/* Resumen Financiero */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-6" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[18px] font-semibold text-[#151c27] flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Resumen Financiero
                </h3>
                <span className="text-[11px] text-[#747783]">Corte: {new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>

              <div className="flex flex-wrap items-center gap-8">
                <CircularProgress pct={Math.round(avanceFisico)} label="Avance Físico" />

                <div className="flex-1 min-w-[240px] space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#747783] mb-0.5">Valor Inicial</p>
                    <p className="text-xl font-bold text-[#151c27] tabular-nums">{fmtMoney(p.valor_inicial)}</p>
                  </div>
                  {(totalAdicionesNuevo > 0 || (p.adicion != null && p.adicion > 0)) && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#747783] mb-0.5">+ Adiciones</p>
                      <p className="text-xl font-bold text-emerald-600 tabular-nums">+{fmtMoney(totalAdicionesNuevo > 0 ? totalAdicionesNuevo : p.adicion)}</p>
                      {totalAdicionesNuevo > 0 && (
                        <p className="text-[10px] text-[#747783] mt-0.5">Total contrato actualizado: <strong className="text-[#151c27]">{fmtMoney((p.valor_inicial ?? 0) + totalAdicionesNuevo)}</strong></p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#EAEAEA]">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#747783] mb-0.5">Cuota Admin Total</p>
                      <p className="text-base font-bold text-[#0B3D91] tabular-nums">{fmtMoney(cuota)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#747783] mb-0.5">Saldo Pendiente</p>
                      <p className="text-base font-bold text-amber-600 tabular-nums">{fmtMoney(pendiente)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modificaciones al Contrato */}
            {mods.length > 0 && (
              <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
                  <h3 className="text-[18px] font-semibold text-[#151c27] flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
                    Modificaciones al Contrato
                  </h3>
                  <span className="text-[11px] text-[#0B3D91] font-semibold cursor-pointer hover:underline">HISTORIAL COMPLETO</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
                    <tr>
                      {["Tipo", "Fecha", "Detalle", "Impacto"].map((h) => (
                        <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#747783]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {mods.map((m, i) => (
                      <tr key={i} className="hover:bg-[#f0f3ff] transition-colors">
                        <td className="px-6 py-3.5"><ModChip tipo={m.tipo} /></td>
                        <td className="px-6 py-3.5 text-sm text-[#434652]">{m.fecha}</td>
                        <td className="px-6 py-3.5 text-sm text-[#434652] max-w-xs"><span className="line-clamp-2">{m.detalle}</span></td>
                        <td className={`px-6 py-3.5 text-sm font-semibold ${m.accent}`}>{m.impacto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Avance Físico & Hitos */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-6" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <h3 className="text-[18px] font-semibold text-[#151c27] mb-6 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Avance Físico &amp; Hitos
              </h3>
              <HitosTimeline p={p} />

              {/* Info adicional */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Plazo inicial",   value: fmt(p.plazo_ejecucion_inicial) },
                  { label: "Suspensión",      value: fmt(p.suspension) },
                  { label: "Reinicio",        value: fmt(p.reinicio) },
                  { label: "Vigencias fut.",  value: fmtMoney(p.vigencias_futuras) },
                ].map((k) => (
                  <div key={k.label} className="bg-[#f9f9ff] rounded-lg p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mb-1">{k.label}</p>
                    <p className="text-sm font-semibold text-[#151c27]">{k.value}</p>
                  </div>
                ))}
              </div>

              {(p.observaciones) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <svg width="16" height="16" className="text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p className="text-sm text-amber-800 leading-relaxed">{p.observaciones}</p>
                </div>
              )}
            </div>

            {/* Identificación */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-6" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <h3 className="text-[18px] font-semibold text-[#151c27] mb-5">Información General</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                {[
                  { label: "N° Contrato",              value: fmt(p.id_contrato),            mono: true },
                  { label: "Modalidad de selección",   value: fmt(p.modalidad_seleccion) },
                  { label: "Clase de contrato",        value: fmt(p.clase_contrato) },
                  { label: "Secretaría",               value: fmt(p.secretaria) },
                  { label: "Área responsable",         value: fmt(p.area_responsable) },
                  { label: "Supervisión",              value: fmt(p.supervision) },
                  { label: "Valor inicial",            value: fmtMoney(p.valor_inicial),     mono: true },
                  { label: "Adición",                  value: fmtMoney(p.adicion),           mono: true },
                  { label: "Total contrato",           value: fmtMoney(p.total_contrato),    mono: true },
                  { label: "Cuota admin inicial",      value: fmtMoney(p.cuota_admin_inicial), mono: true },
                  { label: "Total cuota admin",        value: fmtMoney(p.total_cuota_admin), mono: true },
                  { label: "Pendiente por cobrar",     value: fmtMoney(p.valor_pendiente_cobrar ?? p.total_cuota_admin), mono: true },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#747783] mb-0.5">{f.label}</p>
                    <p className={`text-sm ${f.value === "—" ? "text-[#747783]" : "text-[#151c27] font-medium"} ${f.mono ? "font-mono" : ""}`}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <Sidebar p={p} fechaTerminacionVigente={fechaTerminacionVigente} ultimaProrroga={ultimaProrroga} />
        </div>
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

      {showEdit && <EditBasicModal project={p} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
