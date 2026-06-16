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

function InfoTab({ c, parent }: { c: Contrato; parent: ParentInfo | null }) {
  const diasRestantes = (() => {
    if (!c.fecha_terminacion) return null
    const d = Math.ceil((new Date(c.fecha_terminacion).getTime() - Date.now()) / 86400000)
    return d
  })()

  const pctPagado = c.valor_final && c.valor_final > 0 && c.valor_pagado != null
    ? Math.min(100, Math.round((c.valor_pagado / c.valor_final) * 100))
    : null

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Valor Contrato"   value={formatCOP(c.valor_final ?? c.valor_inicial)} />
        <KpiCard label="Valor Pagado"     value={c.valor_pagado != null ? formatCOP(c.valor_pagado) : "—"} color="text-[#10B981]" />
        <KpiCard label="Saldo Pendiente"  value={c.valor_pendiente != null ? formatCOP(c.valor_pendiente) : "—"} color={c.valor_pendiente && c.valor_pendiente > 0 ? "text-[#D97706]" : "text-[#10B981]"} />
        <KpiCard
          label="% Ejecutado"
          value={pctPagado != null ? `${pctPagado}%` : "—"}
          color={pctPagado != null && pctPagado >= 80 ? "text-[#10B981]" : "text-[#D97706]"}
        />
        <KpiCard
          label="Días Restantes"
          value={diasRestantes != null ? (diasRestantes < 0 ? "Vencido" : `${diasRestantes}d`) : "—"}
          color={diasRestantes != null && diasRestantes < 0 ? "text-red-600" : diasRestantes != null && diasRestantes <= 30 ? "text-[#D97706]" : "text-[#002869]"}
          sub={diasRestantes != null && diasRestantes < 0 ? `${Math.abs(diasRestantes)}d vencido` : undefined}
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
              ["N° Contrato",        c.numero_contrato],
              ["N° Proceso",         c.numero_proceso],
              ["Modalidad",          c.modalidad_seleccion],
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
              ["CDP",            c.fecha_cdp],
              ["CRP",            c.fecha_crp],
              ["Aprobación póliza", c.fecha_aprobacion_poliza],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex gap-3">
                <span className="text-[11px] font-semibold text-[#747783] w-36 shrink-0">{label}</span>
                <span className="text-sm text-[#151C27]">{formatDateShort(value)}</span>
              </div>
            ) : null)}
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
              ["Adiciones",        c.adicion ? formatCOP(c.adicion) : null],
              ["Valor final",      formatCOP(c.valor_final ?? c.valor_inicial)],
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

        {/* Mini KPIs header */}
        <div className="flex flex-wrap gap-4 pt-1 border-t border-[#EAEAEA]">
          <div className="text-sm">
            <span className="text-[#747783] text-xs">Valor final: </span>
            <span className="font-bold text-[#002869]">{formatCOP(c.valor_final ?? c.valor_inicial)}</span>
          </div>
          {c.fecha_terminacion && (
            <div className="text-sm">
              <span className="text-[#747783] text-xs">Terminación: </span>
              <span className="font-semibold text-[#434652]">{formatDateShort(c.fecha_terminacion)}</span>
            </div>
          )}
          {c.supervisor && (
            <div className="text-sm">
              <span className="text-[#747783] text-xs">Supervisor: </span>
              <span className="font-semibold text-[#434652]">{c.supervisor}</span>
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
          <InfoTab c={c} parent={parent} />
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
