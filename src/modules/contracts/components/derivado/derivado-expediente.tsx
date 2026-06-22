"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Building2, CalendarDays, DollarSign, ClipboardList, GitMerge, Receipt, History, Pencil } from "lucide-react"
import { DerivedEditModal } from "./derivado-edit-modal"
import { formatCOP } from "@/modules/contracts/lib/status"
import { formatDateShort } from "@/lib/date-format"
import type { Contrato } from "@/types/database"
import type { Interadministrativo } from "@/types/database"
import type { ContractModificacionesData, ContractTask, ContractPago, ContractChangeLogEntry } from "@/types/contract-derivado"
import { DerivedSeguimientoTab }     from "./derivado-seguimiento-tab"
import { DerivedModificacionesTab }  from "./derivado-modificaciones-tab"
import { DerivedPagosTab }           from "./derivado-pagos-tab"
import { DerivedHistorialTab }       from "./derivado-historial-tab"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ParentInfo = Pick<Interadministrativo,
  "id_contrato" | "objeto_contrato" | "secretaria" | "estado" | "total_contrato"
>

type ConsolidadoDerivado = {
  totalAdiciones: number
  valorActual: number
  tieneAdiciones: boolean
  valorVigente: number | null
  ultimaProrroga: ContractModificacionesData["prorrogas"][number] | null
  fechaVigente: string | null
  diasRestantesVigentes: number | null
  diasSuspendidos: number
  ultimoAclaratorio: ContractModificacionesData["aclaratorios"][number] | null
  hayModificaciones: boolean
  valorParaPct: number | null
}

// ── Estado badge ──────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<string, { cls: string; dot: string }> = {
  "EN EJECUCIÓN":             { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "CIERRE CONTRACTUAL":       { cls: "bg-amber-50  text-amber-700  border-amber-200",    dot: "bg-amber-500"  },
  "TERMINADO":                { cls: "bg-slate-50  text-slate-600  border-slate-200",    dot: "bg-slate-400"  },
  "LIQUIDADO":                { cls: "bg-blue-50   text-blue-700   border-blue-200",     dot: "bg-blue-500"   },
  "TERMINADO ANTICIPADAMENTE":{ cls: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
  "SUSPENDIDO":               { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500" },
  "DECLARADO FALLIDO":        { cls: "bg-red-50    text-red-700    border-red-200",      dot: "bg-red-500"    },
  "NO SUSCRITO":              { cls: "bg-gray-50   text-gray-500   border-gray-200",     dot: "bg-gray-400"   },
  "TERMINADO ANORMALMENTE":   { cls: "bg-rose-50   text-rose-700   border-rose-200",     dot: "bg-rose-500"   },
}

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-xs text-[#747783]">Sin estado</span>
  const cfg = ESTADO_CFG[estado] ?? { cls: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {estado}
    </span>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = "text-[#002869]" }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#EAEAEA] px-4 py-3.5 text-center">
      <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#10B981] font-semibold mt-0.5">{sub}</p>}
      <p className="text-[10px] text-[#747783] uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}

// ── Información General ───────────────────────────────────────────────────────

function InfoTab({ c, parent, modificaciones, cons }: {
  c: Contrato
  parent: ParentInfo | null
  modificaciones: ContractModificacionesData
  cons: ConsolidadoDerivado
}) {
  const {
    totalAdiciones, valorActual, tieneAdiciones, valorVigente,
    ultimaProrroga, fechaVigente, diasRestantesVigentes,
    diasSuspendidos, ultimoAclaratorio, hayModificaciones, valorParaPct,
  } = cons
  const pctPagado = valorParaPct && valorParaPct > 0 && c.valor_pagado != null
    ? Math.min(100, Math.round((c.valor_pagado / valorParaPct) * 100))
    : null

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Valor Contrato"   value={formatCOP(valorVigente)} />
        <KpiCard label="Valor Pagado"     value={c.valor_pagado != null ? formatCOP(c.valor_pagado) : "—"} color="text-[#10B981]" />
        <KpiCard label="Saldo Pendiente"  value={c.valor_pendiente != null ? formatCOP(c.valor_pendiente) : "—"} color={c.valor_pendiente && c.valor_pendiente > 0 ? "text-[#D97706]" : "text-[#10B981]"} />
        <KpiCard
          label="% Ejecutado"
          value={pctPagado != null ? `${pctPagado}%` : "—"}
          color={pctPagado != null && pctPagado >= 80 ? "text-[#10B981]" : "text-[#D97706]"}
        />
        <KpiCard
          label="Días Restantes"
          value={diasRestantesVigentes != null ? (diasRestantesVigentes < 0 ? "Vencido" : `${diasRestantesVigentes}d`) : "—"}
          color={diasRestantesVigentes != null && diasRestantesVigentes < 0 ? "text-red-600" : diasRestantesVigentes != null && diasRestantesVigentes <= 30 ? "text-[#D97706]" : "text-[#002869]"}
          sub={diasRestantesVigentes != null && diasRestantesVigentes < 0 ? `${Math.abs(diasRestantesVigentes)}d vencido` : undefined}
        />
        <KpiCard label="Estado" value={c.estado ?? "—"} />
      </div>

      {/* Barra avance */}
      {pctPagado != null && (
        <div className="bg-white rounded-xl border border-[#EAEAEA] px-5 py-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-[#434652]">Avance financiero</span>
            <span className="font-bold text-[#0B3D91]">{pctPagado}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#EAEAEA] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pctPagado}%`, backgroundColor: pctPagado >= 80 ? "#10B981" : pctPagado >= 50 ? "#D97706" : "#EF4444" }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Datos generales */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#747783] flex items-center gap-2">
            <Building2 size={13} /> Datos Generales
          </h3>
          <div className="space-y-3">
            {[
              ["N° Contrato",              c.numero_contrato],
              ["N° Proceso de Selección",  c.numero_proceso_seleccion ?? c.numero_proceso],
              ["NIT / Identificación",     c.nit_identificacion],
              ["Modalidad",                c.modalidad_seleccion],
              ["Clase de contrato",  c.clase_contrato],
              ["Área responsable",   c.area_responsable],
              ["Supervisor",         c.supervisor],
              ["Tipo persona",       c.persona_natural_juridica],
              ["Recurso",            c.recurso],
              ["Rubro",              c.rubro],
              ["CDP",                c.cdp],
              ["CRP",                c.crp],
              ["N° Póliza",          c.numero_poliza],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex gap-3">
                <span className="text-[11px] font-semibold text-[#747783] w-36 shrink-0">{label}</span>
                <span className="text-sm text-[#151C27] flex-1">{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#747783] flex items-center gap-2">
            <CalendarDays size={13} /> Fechas y Plazos
          </h3>
          <div className="space-y-3">
            {[
              ["Suscripción",    c.fecha_suscripcion],
              ["Inicio",         c.fecha_inicio],
              ["Plazo ejecución",c.plazo_ejecucion],
              ["Terminación",    c.fecha_terminacion],
              ["Fecha Final Vigente", ultimaProrroga ? ultimaProrroga.nueva_fecha_terminacion : null],
              ["CDP",            c.fecha_cdp],
              ["CRP",            c.fecha_crp],
              ["Aprobación póliza", c.fecha_aprobacion_poliza],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex gap-3">
                <span className="text-[11px] font-semibold text-[#747783] w-36 shrink-0">{label}</span>
                <span className="text-sm text-[#151C27]">{formatDateShort(value)}</span>
              </div>
            ) : null)}
            {modificaciones.prorrogas.length > 0 && (
              <div className="flex gap-3">
                <span className="text-[11px] font-semibold text-[#747783] w-36 shrink-0">Prórrogas</span>
                <span className="text-sm text-[#151C27]">{modificaciones.prorrogas.length} registrada{modificaciones.prorrogas.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#747783] flex items-center gap-2">
            <DollarSign size={13} /> Resumen Financiero
          </h3>
          <div className="space-y-3">
            {[
              ["Valor inicial",    formatCOP(c.valor_inicial)],
              ["Total Adiciones",  tieneAdiciones ? `${formatCOP(totalAdiciones)} (${modificaciones.adiciones.length})` : c.adicion ? formatCOP(c.adicion) : null],
              ["Valor Actual",     tieneAdiciones ? formatCOP(valorActual) : null],
              ["Valor final",      !tieneAdiciones ? formatCOP(c.valor_final ?? c.valor_inicial) : null],
              ["Vigencia futura",  c.vigencia_futura ? formatCOP(c.vigencia_futura) : null],
              ["Valor pagado",     c.valor_pagado != null ? formatCOP(c.valor_pagado) : null],
              ["Valor pendiente",  c.valor_pendiente != null ? formatCOP(c.valor_pendiente) : null],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex gap-3">
                <span className="text-[11px] font-semibold text-[#747783] w-36 shrink-0">{label}</span>
                <span className="text-sm font-semibold text-[#151C27] tabular-nums">{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Modificaciones consolidadas */}
        {hayModificaciones && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#0B3D91]/20 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#0B3D91] flex items-center gap-2">
              <GitMerge size={13} /> Estado Actualizado por Modificaciones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Financiero */}
              {tieneAdiciones && (
                <div className="sm:col-span-2 bg-[#f0f3ff] rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B3D91] mb-2">Valor Actualizado</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Valor Inicial</span>
                      <span className="font-semibold tabular-nums">{formatCOP(c.valor_inicial)}</span>
                    </div>
                    {modificaciones.adiciones.map((a) => (
                      <div key={a.id} className="flex justify-between text-xs">
                        <span className="text-[#747783]">Adición N°{a.numero_adicion} ({formatDateShort(a.fecha_adicion)})</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">+{formatCOP(a.valor_adicion)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#0B3D91]/20 pt-1.5 flex justify-between text-sm">
                      <span className="font-bold text-[#002869]">Valor Actual</span>
                      <span className="font-bold text-[#002869] tabular-nums">{formatCOP(valorActual)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Plazo */}
              {ultimaProrroga && (
                <div className="bg-amber-50 rounded-xl p-4 space-y-2 border border-amber-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">Plazo Vigente</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Terminación inicial</span>
                      <span className="font-semibold">{formatDateShort(c.fecha_terminacion)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Prórrogas</span>
                      <span className="font-semibold">{modificaciones.prorrogas.length}</span>
                    </div>
                    <div className="border-t border-amber-200 pt-1.5 flex justify-between text-sm">
                      <span className="font-bold text-amber-800">Fecha Final Vigente</span>
                      <span className="font-bold text-amber-800">{formatDateShort(ultimaProrroga.nueva_fecha_terminacion)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Suspensiones */}
              {modificaciones.suspensiones.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 space-y-2 border border-yellow-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-700 mb-2">Suspensiones</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Total</span>
                      <span className="font-semibold">{modificaciones.suspensiones.length}</span>
                    </div>
                    {diasSuspendidos > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#747783]">Días suspendidos</span>
                        <span className="font-semibold">{diasSuspendidos}d</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aclaratorios */}
              {ultimoAclaratorio && (
                <div className="bg-violet-50 rounded-xl p-4 space-y-2 border border-violet-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 mb-2">Aclaratorios</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Total</span>
                      <span className="font-semibold">{modificaciones.aclaratorios.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Último</span>
                      <span className="font-semibold">N°{ultimoAclaratorio.numero_aclaratorio}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#747783]">Fecha</span>
                      <span className="font-semibold">{formatDateShort(ultimoAclaratorio.fecha_suscripcion)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Contrato padre */}
        {parent && (
          <div className="bg-[#f0f3ff] rounded-xl border border-[#0B3D91]/20 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#0B3D91] flex items-center gap-2">
              <ExternalLink size={13} /> Contrato Interadministrativo Padre
            </h3>
            <div className="space-y-3">
              {[
                ["N° Contrato", parent.id_contrato],
                ["Secretaría",  parent.secretaria],
                ["Estado",      parent.estado],
                ["Valor total", parent.total_contrato != null ? formatCOP(parent.total_contrato) : null],
              ].map(([label, value]) => value ? (
                <div key={label} className="flex gap-3">
                  <span className="text-[11px] font-semibold text-[#747783] w-36 shrink-0">{label}</span>
                  <span className="text-sm text-[#002869] font-medium">{value}</span>
                </div>
              ) : null)}
              {parent.objeto_contrato && (
                <div className="mt-2 pt-2 border-t border-[#0B3D91]/10">
                  <p className="text-[11px] font-semibold text-[#747783] mb-1">Objeto</p>
                  <p className="text-xs text-[#002869] leading-relaxed">{parent.objeto_contrato}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECOP link */}
      {c.link_ficha && (
        <div className="bg-white rounded-xl border border-[#EAEAEA] px-5 py-4 flex items-center gap-3">
          <ExternalLink size={16} className="text-[#0B3D91] shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-[#747783] uppercase mb-0.5">Ficha SECOP II</p>
            <a href={c.link_ficha} target="_blank" rel="noopener noreferrer"
              className="text-sm text-[#0B3D91] hover:underline break-all">{c.link_ficha}</a>
          </div>
        </div>
      )}

      {/* Enlace Carpeta Documental */}
      {c.enlace_carpeta && (
        <div className="bg-white rounded-xl border border-[#EAEAEA] px-5 py-4 flex items-center gap-3">
          <ExternalLink size={16} className="text-[#747783] shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-[#747783] uppercase mb-0.5">Carpeta Documental</p>
            <a href={c.enlace_carpeta} target="_blank" rel="noopener noreferrer"
              className="text-sm text-[#0B3D91] hover:underline break-all">{c.enlace_carpeta}</a>
          </div>
        </div>
      )}

      {/* Observaciones */}
      {c.observaciones && (
        <div className="bg-white rounded-xl border border-[#EAEAEA] px-5 py-4">
          <p className="text-[10px] font-bold text-[#747783] uppercase mb-2">Observaciones</p>
          <p className="text-sm text-[#434652] leading-relaxed whitespace-pre-wrap">{c.observaciones}</p>
        </div>
      )}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = "info" | "seguimiento" | "modificaciones" | "pagos" | "historial"

const TABS: Array<{ id: TabId; label: string; icon: typeof ArrowLeft }> = [
  { id: "info",          label: "Información General",       icon: Building2    },
  { id: "seguimiento",   label: "Seguimiento",               icon: ClipboardList },
  { id: "modificaciones",label: "Modificaciones",            icon: GitMerge     },
  { id: "pagos",         label: "Pagos al Contratista",      icon: Receipt      },
  { id: "historial",     label: "Historial",                 icon: History      },
]

// ── Componente principal ──────────────────────────────────────────────────────

export interface DerivedContractExpedienteProps {
  contrato: Contrato
  parent: ParentInfo | null
  canEdit: boolean
  projectId: string
  tasks: ContractTask[]
  modificaciones: ContractModificacionesData
  pagos: ContractPago[]
  changeLog: ContractChangeLogEntry[]
  backHref?: string
  backLabel?: string
}

export function DerivedContractExpediente({
  contrato: c, parent, canEdit, projectId,
  tasks, modificaciones, pagos, changeLog,
  backHref, backLabel,
}: DerivedContractExpedienteProps) {
  const [tab, setTab]       = useState<TabId>("info")
  const [editing, setEditing] = useState(false)

  const modCount  = modificaciones.adiciones.length + modificaciones.prorrogas.length +
    modificaciones.suspensiones.length + modificaciones.reinicios.length + modificaciones.aclaratorios.length
  const taskPend  = tasks.filter(t => t.status !== "COMPLETADA").length

  // ── Única fuente de verdad contractual (header + InfoTab comparten este objeto) ──
  const _totalAdiciones = modificaciones.adiciones.reduce((s, a) => s + a.valor_adicion, 0)
  const _valorActual    = (c.valor_inicial ?? 0) + _totalAdiciones
  const _tieneAdiciones = modificaciones.adiciones.length > 0
  const _ultimaProrroga = modificaciones.prorrogas.length > 0
    ? [...modificaciones.prorrogas].sort((a, b) => b.numero_prorroga - a.numero_prorroga)[0]
    : null
  const _fechaVigente   = _ultimaProrroga?.nueva_fecha_terminacion ?? c.fecha_terminacion ?? null
  const cons: ConsolidadoDerivado = {
    totalAdiciones:       _totalAdiciones,
    valorActual:          _valorActual,
    tieneAdiciones:       _tieneAdiciones,
    valorVigente:         _tieneAdiciones ? _valorActual : (c.valor_final ?? c.valor_inicial ?? null),
    ultimaProrroga:       _ultimaProrroga ?? null,
    fechaVigente:         _fechaVigente ?? null,
    diasRestantesVigentes: _fechaVigente
      ? Math.ceil((new Date(_fechaVigente).getTime() - Date.now()) / 86400000)
      : null,
    diasSuspendidos: modificaciones.suspensiones.reduce((s, sus) => {
      if (!sus.fin_suspension) return s
      return s + Math.max(0, Math.round(
        (new Date(sus.fin_suspension).getTime() - new Date(sus.inicio_suspension).getTime()) / 86400000
      ))
    }, 0),
    ultimoAclaratorio: modificaciones.aclaratorios.length > 0
      ? [...modificaciones.aclaratorios].sort((a, b) => b.numero_aclaratorio - a.numero_aclaratorio)[0]
      : null,
    hayModificaciones: modificaciones.adiciones.length > 0 || modificaciones.prorrogas.length > 0 ||
      modificaciones.suspensiones.length > 0 || modificaciones.aclaratorios.length > 0,
    valorParaPct: _tieneAdiciones ? _valorActual : (c.valor_final ?? c.valor_inicial ?? null),
  }

  const badges: Partial<Record<TabId, number>> = {
    seguimiento:    taskPend    > 0 ? taskPend    : undefined,
    modificaciones: modCount    > 0 ? modCount    : undefined,
    pagos:          pagos.length > 0 ? pagos.length : undefined,
    historial:      changeLog.length > 0 ? changeLog.length : undefined,
  } as Partial<Record<TabId, number>>

  return (
    <div className="p-0 sm:p-2 lg:p-4 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">

      {/* Back */}
      <div className="px-0 sm:px-0">
        <Link href={backHref ?? `/proyectos/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#747783] hover:text-[#002869] transition-colors">
          <ArrowLeft size={14} />
          {backLabel ?? (parent ? `Volver al contrato ${parent.id_contrato}` : "Volver al proyecto")}
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {c.clase_contrato && (
            <span className="text-[11px] font-bold uppercase tracking-wide bg-[#0B3D91]/10 text-[#0B3D91] px-3 py-1 rounded-full">
              {c.clase_contrato}
            </span>
          )}
          <EstadoBadge estado={c.estado} />
          {c.contratista && (
            <span className="text-[11px] text-[#747783] bg-[#f9f9ff] border border-[#EAEAEA] px-3 py-1 rounded-full">
              {c.contratista}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#002869] leading-tight">
            CONTRATO N° {c.numero_contrato ?? c.id}
          </h2>
          {c.objeto_contrato && (
            <p className="text-[#434652] mt-2 leading-relaxed">{c.objeto_contrato}</p>
          )}
        </div>
        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B3D91]/10 hover:bg-[#0B3D91]/20 text-[#0B3D91] text-xs font-semibold transition-colors"
            >
              <Pencil size={12} />
              Editar contrato
            </button>
          </div>
        )}

        {/* Mini KPIs header — consume cons (única fuente de verdad) */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-[#EAEAEA]">
          <div className="text-sm flex items-baseline gap-1.5">
            <span className="text-[#747783] text-xs">
              {cons.tieneAdiciones ? "Valor vigente:" : "Valor final:"}
            </span>
            <span className="font-bold text-[#002869]">{formatCOP(cons.valorVigente)}</span>
          </div>
          {cons.fechaVigente && (
            <div className="text-sm flex items-baseline gap-1.5">
              <span className="text-[#747783] text-xs">
                {cons.ultimaProrroga ? "Terminación vigente:" : "Terminación:"}
              </span>
              <span className="font-semibold text-[#434652]">{formatDateShort(cons.fechaVigente)}</span>
            </div>
          )}
          {c.supervisor && (
            <div className="text-sm flex items-baseline gap-1.5">
              <span className="text-[#747783] text-xs">Supervisor:</span>
              <span className="font-semibold text-[#434652]">{c.supervisor}</span>
            </div>
          )}
          {cons.hayModificaciones && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {modificaciones.adiciones.length > 0 && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {modificaciones.adiciones.length} adición{modificaciones.adiciones.length > 1 ? "es" : ""}
                </span>
              )}
              {modificaciones.prorrogas.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {modificaciones.prorrogas.length} prórroga{modificaciones.prorrogas.length > 1 ? "s" : ""}
                </span>
              )}
              {modificaciones.suspensiones.length > 0 && (
                <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  {modificaciones.suspensiones.length} suspensión{modificaciones.suspensiones.length > 1 ? "es" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EAEAEA] flex gap-0 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const badge = badges[id]
          return (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                tab === id ? "border-[#0B3D91] text-[#0B3D91]" : "border-transparent text-[#747783] hover:text-[#434652]"
              }`}>
              <Icon size={14} />
              {label}
              {badge != null && (
                <span className="text-[10px] font-bold bg-[#0B3D91] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {editing && (
        <DerivedEditModal
          contrato={c}
          projectId={projectId}
          onClose={() => setEditing(false)}
        />
      )}

      <div className="pb-10">
        {tab === "info" && (
          <InfoTab c={c} parent={parent} modificaciones={modificaciones} cons={cons} />
        )}
        {tab === "seguimiento" && (
          <DerivedSeguimientoTab
            tasks={tasks} contratoId={c.id} projectId={projectId} canEdit={canEdit}
          />
        )}
        {tab === "modificaciones" && (
          <DerivedModificacionesTab
            data={modificaciones}
            contratoId={c.id}
            projectId={projectId}
            canEdit={canEdit}
            legacyAdicion={c.adicion ?? null}
            legacyProrroga={c.prorroga ?? null}
            legacySuspension={c.suspension ?? null}
            legacyReinicio={c.reinicio ?? null}
          />
        )}
        {tab === "pagos" && (
          <DerivedPagosTab
            pagos={pagos} contratoId={c.id} projectId={projectId}
            valorContrato={c.valor_final ?? c.valor_inicial ?? 0}
            canEdit={canEdit}
          />
        )}
        {tab === "historial" && (
          <DerivedHistorialTab entries={changeLog} />
        )}
      </div>
    </div>
  )
}
