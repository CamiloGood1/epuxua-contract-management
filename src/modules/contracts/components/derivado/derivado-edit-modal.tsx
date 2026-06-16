"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { updateContrato } from "@/services/contract-update.actions"
import type { Contrato, EstadoContrato } from "@/types/database"

const ESTADOS: EstadoContrato[] = [
  "EN EJECUCIÓN", "CIERRE CONTRACTUAL", "TERMINADO", "LIQUIDADO",
  "TERMINADO ANTICIPADAMENTE", "SUSPENDIDO", "DECLARADO FALLIDO",
  "NO SUSCRITO", "TERMINADO ANORMALMENTE",
]

const inputCls    = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white"
const textareaCls = "w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none bg-white"
const labelCls    = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Section({ title }: { title: string }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-[#747783] pt-2 pb-1 border-b border-[#EAEAEA]">{title}</h3>
}

interface Props {
  contrato: Contrato
  projectId: string
  onClose: () => void
}

export function DerivedEditModal({ contrato: c, projectId, onClose }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [error, setError]  = useState<string | null>(null)

  const [form, setForm] = useState({
    estado:                   c.estado ?? "",
    contratista:              c.contratista ?? "",
    objeto_contrato:          c.objeto_contrato ?? "",
    supervisor:               c.supervisor ?? "",
    fecha_suscripcion:        c.fecha_suscripcion ?? "",
    fecha_inicio:             c.fecha_inicio ?? "",
    fecha_terminacion:        c.fecha_terminacion ?? "",
    plazo_ejecucion:          c.plazo_ejecucion ?? "",
    valor_inicial:            c.valor_inicial != null ? String(c.valor_inicial) : "",
    adicion:                  c.adicion != null ? String(c.adicion) : "",
    valor_final:              c.valor_final != null ? String(c.valor_final) : "",
    valor_pagado:             c.valor_pagado != null ? String(c.valor_pagado) : "",
    valor_pendiente:          c.valor_pendiente != null ? String(c.valor_pendiente) : "",
    modalidad_seleccion:      c.modalidad_seleccion ?? "",
    clase_contrato:           c.clase_contrato ?? "",
    area_responsable:         c.area_responsable ?? "",
    persona_natural_juridica: c.persona_natural_juridica ?? "",
    recurso:                  c.recurso ?? "",
    rubro:                    c.rubro ?? "",
    cdp:                      c.cdp ?? "",
    fecha_cdp:                c.fecha_cdp ?? "",
    numero_proceso_seleccion: c.numero_proceso_seleccion ?? c.numero_proceso ?? "",
    nit_identificacion:       c.nit_identificacion ?? "",
    crp:                      c.crp ?? "",
    fecha_crp:                c.fecha_crp ?? "",
    enlace_carpeta:           c.enlace_carpeta ?? "",
    numero_poliza:            c.numero_poliza ?? "",
    fecha_aprobacion_poliza:  c.fecha_aprobacion_poliza ?? "",
    link_ficha:               c.link_ficha ?? "",
    observaciones:            c.observaciones ?? "",
  })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function parseNum(s: string): number | null {
    const n = parseFloat(s.replace(/[^0-9.]/g, ""))
    return isNaN(n) ? null : n
  }

  function nullIfEmpty(s: string): string | null {
    return s.trim() === "" ? null : s.trim()
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await updateContrato({
        id: c.id,
        project_id: projectId,
        estado:                   (nullIfEmpty(form.estado) as EstadoContrato | null),
        contratista:              nullIfEmpty(form.contratista),
        objeto_contrato:          nullIfEmpty(form.objeto_contrato),
        supervisor:               nullIfEmpty(form.supervisor),
        fecha_suscripcion:        nullIfEmpty(form.fecha_suscripcion),
        fecha_inicio:             nullIfEmpty(form.fecha_inicio),
        fecha_terminacion:        nullIfEmpty(form.fecha_terminacion),
        plazo_ejecucion:          nullIfEmpty(form.plazo_ejecucion),
        valor_inicial:            parseNum(form.valor_inicial),
        adicion:                  parseNum(form.adicion),
        valor_final:              parseNum(form.valor_final),
        valor_pagado:             parseNum(form.valor_pagado),
        valor_pendiente:          parseNum(form.valor_pendiente),
        modalidad_seleccion:      nullIfEmpty(form.modalidad_seleccion),
        clase_contrato:           nullIfEmpty(form.clase_contrato),
        area_responsable:         nullIfEmpty(form.area_responsable),
        persona_natural_juridica: nullIfEmpty(form.persona_natural_juridica),
        recurso:                  nullIfEmpty(form.recurso),
        rubro:                    nullIfEmpty(form.rubro),
        cdp:                      nullIfEmpty(form.cdp),
        fecha_cdp:                nullIfEmpty(form.fecha_cdp),
        numero_proceso_seleccion: nullIfEmpty(form.numero_proceso_seleccion),
        nit_identificacion:       nullIfEmpty(form.nit_identificacion),
        crp:                      nullIfEmpty(form.crp),
        fecha_crp:                nullIfEmpty(form.fecha_crp),
        enlace_carpeta:           nullIfEmpty(form.enlace_carpeta),
        numero_poliza:            nullIfEmpty(form.numero_poliza),
        fecha_aprobacion_poliza:  nullIfEmpty(form.fecha_aprobacion_poliza),
        link_ficha:               nullIfEmpty(form.link_ficha),
        observaciones:            nullIfEmpty(form.observaciones),
      })
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-[#002869]">Editar Contrato Derivado</h2>
            <p className="text-xs text-[#747783] mt-0.5">{c.numero_contrato ?? `ID ${c.id}`}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">

          {/* Estado */}
          <Section title="Estado" />
          <Field label="Estado del contrato">
            <select value={form.estado} onChange={e => set("estado", e.target.value)} className={inputCls}>
              <option value="">— Sin estado —</option>
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          {/* Partes */}
          <Section title="Partes" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contratista">
              <input value={form.contratista} onChange={e => set("contratista", e.target.value)} className={inputCls} placeholder="Nombre / Razón social" />
            </Field>
            <Field label="Tipo de persona">
              <select value={form.persona_natural_juridica} onChange={e => set("persona_natural_juridica", e.target.value)} className={inputCls}>
                <option value="">—</option>
                <option value="NATURAL">Natural</option>
                <option value="JURÍDICA">Jurídica</option>
              </select>
            </Field>
          </div>
          <Field label="Objeto del contrato">
            <textarea value={form.objeto_contrato} onChange={e => set("objeto_contrato", e.target.value)} rows={3} className={textareaCls} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Supervisor">
              <input value={form.supervisor} onChange={e => set("supervisor", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Área responsable">
              <input value={form.area_responsable} onChange={e => set("area_responsable", e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Identificación */}
          <Section title="Identificación" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="N° Proceso de Selección">
              <input value={form.numero_proceso_seleccion} onChange={e => set("numero_proceso_seleccion", e.target.value)} className={inputCls} placeholder="Ej: SAMC-001-2026" />
            </Field>
            <Field label="NIT / Identificación">
              <input value={form.nit_identificacion} onChange={e => set("nit_identificacion", e.target.value)} className={inputCls} placeholder="Ej: 900123456-7" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Modalidad de selección">
              <input value={form.modalidad_seleccion} onChange={e => set("modalidad_seleccion", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Clase de contrato">
              <input value={form.clase_contrato} onChange={e => set("clase_contrato", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Recurso">
              <input value={form.recurso} onChange={e => set("recurso", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Rubro">
              <input value={form.rubro} onChange={e => set("rubro", e.target.value)} className={inputCls} />
            </Field>
            <Field label="CDP">
              <input value={form.cdp} onChange={e => set("cdp", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Fecha CDP">
              <input type="date" value={form.fecha_cdp} onChange={e => set("fecha_cdp", e.target.value)} className={inputCls} />
            </Field>
            <Field label="CRP">
              <input value={form.crp} onChange={e => set("crp", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fecha CRP">
              <input type="date" value={form.fecha_crp} onChange={e => set("fecha_crp", e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Fechas */}
          <Section title="Fechas y Plazos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha suscripción">
              <input type="date" value={form.fecha_suscripcion} onChange={e => set("fecha_suscripcion", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fecha inicio">
              <input type="date" value={form.fecha_inicio} onChange={e => set("fecha_inicio", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha terminación">
              <input type="date" value={form.fecha_terminacion} onChange={e => set("fecha_terminacion", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Plazo de ejecución">
              <input value={form.plazo_ejecucion} onChange={e => set("plazo_ejecucion", e.target.value)} className={inputCls} placeholder="Ej: 6 meses" />
            </Field>
          </div>

          {/* Financiero */}
          <Section title="Información Financiera" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Valor inicial">
              <input value={form.valor_inicial} onChange={e => set("valor_inicial", e.target.value)} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Adiciones">
              <input value={form.adicion} onChange={e => set("adicion", e.target.value)} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Valor final">
              <input value={form.valor_final} onChange={e => set("valor_final", e.target.value)} className={inputCls} placeholder="0" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Valor pagado">
              <input value={form.valor_pagado} onChange={e => set("valor_pagado", e.target.value)} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Valor pendiente">
              <input value={form.valor_pendiente} onChange={e => set("valor_pendiente", e.target.value)} className={inputCls} placeholder="0" />
            </Field>
          </div>

          {/* Póliza y enlaces */}
          <Section title="Póliza y Documentación" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="N° Póliza">
              <input value={form.numero_poliza} onChange={e => set("numero_poliza", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fecha aprobación póliza">
              <input type="date" value={form.fecha_aprobacion_poliza} onChange={e => set("fecha_aprobacion_poliza", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Enlace SECOP II (ficha)">
            <input type="url" value={form.link_ficha} onChange={e => set("link_ficha", e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <Field label="Enlace Carpeta Documental">
            <input type="url" value={form.enlace_carpeta} onChange={e => set("enlace_carpeta", e.target.value)} className={inputCls} placeholder="https://drive.google.com/…" />
          </Field>

          {/* Observaciones */}
          <Section title="Observaciones" />
          <Field label="Observaciones">
            <textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={3} className={textareaCls} />
          </Field>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2 border-t border-[#EAEAEA]">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9ff] transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-medium hover:bg-[#002869] transition-colors disabled:opacity-50">
              {isPending ? "Guardando…" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
