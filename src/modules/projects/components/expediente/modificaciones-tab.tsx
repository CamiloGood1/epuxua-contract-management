"use client"

import { useState, useTransition } from "react"
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import {
  createAdicion, deleteAdicion,
  createProrroga, deleteProrroga,
  createSuspension, deleteSuspension,
  createReinicio, deleteReinicio,
  createAclaratorio, deleteAclaratorio,
} from "@/services/modificaciones.actions"
import type { ModificacionesData, Adicion, Prorroga, Suspension, Reinicio, Aclaratorio } from "@/types/modificaciones"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function daysBetween(a: string, b: string) {
  const diff = new Date(b).getTime() - new Date(a).getTime()
  return Math.round(diff / 86400000)
}

function ordinal(n: number) {
  const labels = ["", "Primera", "Segunda", "Tercera", "Cuarta", "Quinta"]
  return labels[n] ?? `N°${n}`
}

// ── Chip de tipo ─────────────────────────────────────────────────────────────

const CHIP_STYLE: Record<string, string> = {
  ADICIÓN:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  PRÓRROGA:   "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENSIÓN: "bg-yellow-50 text-yellow-700 border-yellow-200",
  REINICIO:   "bg-blue-50 text-blue-700 border-blue-200",
  ACLARATORIO:"bg-violet-50 text-violet-700 border-violet-200",
}

function TypeChip({ tipo }: { tipo: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${CHIP_STYLE[tipo] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {tipo}
    </span>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white">
          <h2 className="text-base font-bold text-[#002869]">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
const textareaCls = "w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none"

function FormButtons({ onClose, isPending, label }: { onClose: () => void; isPending: boolean; label: string }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">Cancelar</button>
      <button type="submit" disabled={isPending} className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60">
        {isPending ? "Guardando…" : label}
      </button>
    </div>
  )
}

// ── Modales de creación ───────────────────────────────────────────────────────

function AdicionModal({ interadministrativoId, nextNum, onClose }: { interadministrativoId: number; nextNum: number; onClose: () => void }) {
  const [f, setF] = useState({ fecha: "", valorTotal: "", valorCuota: "", valorBienes: "", numeroRp: "", motivo: "", link: "" })
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function handle(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    start(async () => {
      const res = await createAdicion({
        interadministrativo_id: interadministrativoId,
        numero_adicion:         nextNum,
        fecha_adicion:          f.fecha,
        valor_total:            f.valorTotal ? parseFloat(f.valorTotal.replace(/\./g, "").replace(",", ".")) : null,
        valor_cuota_gerencia:   f.valorCuota ? parseFloat(f.valorCuota.replace(/\./g, "").replace(",", ".")) : null,
        valor_bienes_servicios: f.valorBienes ? parseFloat(f.valorBienes.replace(/\./g, "").replace(",", ".")) : null,
        numero_rp:              f.numeroRp || null,
        motivo:                 f.motivo || null,
        link_documental:        f.link || null,
      })
      if (res.error) { setErr(res.error); return }
      onClose()
    })
  }

  return (
    <Modal title={`Nueva Adición — ${ordinal(nextNum)}`} onClose={onClose}>
      <form onSubmit={handle} className="p-6 space-y-4">
        <Field label="Fecha de la Adición *">
          <input type="date" required className={inputCls} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor Total (COP)">
            <input type="text" className={inputCls} placeholder="0" value={f.valorTotal} onChange={(e) => setF({ ...f, valorTotal: e.target.value })} />
          </Field>
          <Field label="Cuota de Gerencia (COP)">
            <input type="text" className={inputCls} placeholder="0" value={f.valorCuota} onChange={(e) => setF({ ...f, valorCuota: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bienes y Servicios (COP)">
            <input type="text" className={inputCls} placeholder="0" value={f.valorBienes} onChange={(e) => setF({ ...f, valorBienes: e.target.value })} />
          </Field>
          <Field label="Número RP">
            <input type="text" className={inputCls} placeholder="Ej: RP-2026-00458" value={f.numeroRp} onChange={(e) => setF({ ...f, numeroRp: e.target.value })} />
          </Field>
        </div>
        <Field label="Motivo de la Adición">
          <textarea rows={3} className={textareaCls} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} />
        </Field>
        <Field label="Enlace Documental (URL)">
          <input type="url" className={inputCls} placeholder="https://…" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
        </Field>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
        <FormButtons onClose={onClose} isPending={pending} label="Registrar Adición" />
      </form>
    </Modal>
  )
}

function ProrrogaModal({ interadministrativoId, nextNum, fechaTerminacionActual, onClose }: { interadministrativoId: number; nextNum: number; fechaTerminacionActual: string | null; onClose: () => void }) {
  const [f, setF] = useState({ fechaSusc: "", nuevaFecha: "", plazo: "", justificacion: "" })
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const diasPlazo = f.fechaSusc && f.nuevaFecha ? daysBetween(f.fechaSusc, f.nuevaFecha) : null

  function handle(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    start(async () => {
      const res = await createProrroga({
        interadministrativo_id:  interadministrativoId,
        numero_prorroga:         nextNum,
        fecha_suscripcion:       f.fechaSusc,
        nueva_fecha_terminacion: f.nuevaFecha,
        plazo_prorroga:          f.plazo || (diasPlazo != null ? `${diasPlazo} días` : null),
        justificacion:           f.justificacion || null,
      })
      if (res.error) { setErr(res.error); return }
      onClose()
    })
  }

  return (
    <Modal title={`Nueva Prórroga — ${ordinal(nextNum)}`} onClose={onClose}>
      <form onSubmit={handle} className="p-6 space-y-4">
        {fechaTerminacionActual && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            Fecha de terminación actual: <strong>{fmtDate(fechaTerminacionActual)}</strong>
          </div>
        )}
        <Field label="Fecha de Suscripción *">
          <input type="date" required className={inputCls} value={f.fechaSusc} onChange={(e) => setF({ ...f, fechaSusc: e.target.value })} />
        </Field>
        <Field label="Nueva Fecha de Terminación *">
          <input type="date" required className={inputCls} value={f.nuevaFecha} onChange={(e) => setF({ ...f, nuevaFecha: e.target.value })} />
        </Field>
        <Field label={`Plazo de la Prórroga${diasPlazo != null ? ` — calculado: ${diasPlazo} días` : ""}`}>
          <input type="text" className={inputCls} placeholder="Ej: 3 meses" value={f.plazo} onChange={(e) => setF({ ...f, plazo: e.target.value })} />
        </Field>
        <Field label="Justificación">
          <textarea rows={3} className={textareaCls} value={f.justificacion} onChange={(e) => setF({ ...f, justificacion: e.target.value })} />
        </Field>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
        <FormButtons onClose={onClose} isPending={pending} label="Registrar Prórroga" />
      </form>
    </Modal>
  )
}

function SuspensionModal({ interadministrativoId, nextNum, onClose }: { interadministrativoId: number; nextNum: number; onClose: () => void }) {
  const [f, setF] = useState({ fechaSusc: "", inicio: "", fin: "", plazo: "", motivo: "" })
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const diasSusp = f.inicio && f.fin ? daysBetween(f.inicio, f.fin) : null

  function handle(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    start(async () => {
      const res = await createSuspension({
        interadministrativo_id: interadministrativoId,
        numero_suspension:      nextNum,
        fecha_suscripcion:      f.fechaSusc || null,
        inicio_suspension:      f.inicio,
        fin_suspension:         f.fin || null,
        plazo_suspension:       f.plazo || (diasSusp != null ? `${diasSusp} días` : null),
        motivo:                 f.motivo || null,
      })
      if (res.error) { setErr(res.error); return }
      onClose()
    })
  }

  return (
    <Modal title={`Nueva Suspensión — N°${nextNum}`} onClose={onClose}>
      <form onSubmit={handle} className="p-6 space-y-4">
        <Field label="Fecha de Suscripción">
          <input type="date" className={inputCls} value={f.fechaSusc} onChange={(e) => setF({ ...f, fechaSusc: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio Suspensión *">
            <input type="date" required className={inputCls} value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} />
          </Field>
          <Field label="Fin Suspensión">
            <input type="date" className={inputCls} value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} />
          </Field>
        </div>
        <Field label={`Plazo de Suspensión${diasSusp != null ? ` — ${diasSusp} días` : ""}`}>
          <input type="text" className={inputCls} placeholder="Ej: 30 días" value={f.plazo} onChange={(e) => setF({ ...f, plazo: e.target.value })} />
        </Field>
        <Field label="Motivo / Justificación">
          <textarea rows={3} className={textareaCls} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} />
        </Field>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
        <FormButtons onClose={onClose} isPending={pending} label="Registrar Suspensión" />
      </form>
    </Modal>
  )
}

function ReinicioModal({ interadministrativoId, nextNum, onClose }: { interadministrativoId: number; nextNum: number; onClose: () => void }) {
  const [f, setF] = useState({ fechaReinicio: "", fechaSusc: "", motivo: "", obs: "" })
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function handle(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    start(async () => {
      const res = await createReinicio({
        interadministrativo_id: interadministrativoId,
        numero_reinicio:        nextNum,
        fecha_reinicio:         f.fechaReinicio,
        fecha_suscripcion:      f.fechaSusc || null,
        motivo:                 f.motivo || null,
        observaciones:          f.obs || null,
      })
      if (res.error) { setErr(res.error); return }
      onClose()
    })
  }

  return (
    <Modal title={`Nuevo Reinicio — N°${nextNum}`} onClose={onClose}>
      <form onSubmit={handle} className="p-6 space-y-4">
        <Field label="Fecha de Reinicio *">
          <input type="date" required className={inputCls} value={f.fechaReinicio} onChange={(e) => setF({ ...f, fechaReinicio: e.target.value })} />
        </Field>
        <Field label="Fecha de Suscripción">
          <input type="date" className={inputCls} value={f.fechaSusc} onChange={(e) => setF({ ...f, fechaSusc: e.target.value })} />
        </Field>
        <Field label="Motivo del Reinicio">
          <textarea rows={2} className={textareaCls} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} />
        </Field>
        <Field label="Observaciones">
          <textarea rows={2} className={textareaCls} value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} />
        </Field>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
        <FormButtons onClose={onClose} isPending={pending} label="Registrar Reinicio" />
      </form>
    </Modal>
  )
}

function AclaratorioModal({ interadministrativoId, nextNum, onClose }: { interadministrativoId: number; nextNum: number; onClose: () => void }) {
  const [f, setF] = useState({ fecha: "", motivo: "", descripcion: "" })
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function handle(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    start(async () => {
      const res = await createAclaratorio({
        interadministrativo_id: interadministrativoId,
        numero_aclaratorio:     nextNum,
        fecha_suscripcion:      f.fecha,
        motivo:                 f.motivo || null,
        descripcion:            f.descripcion || null,
      })
      if (res.error) { setErr(res.error); return }
      onClose()
    })
  }

  return (
    <Modal title={`Nuevo Aclaratorio — N°${nextNum}`} onClose={onClose}>
      <form onSubmit={handle} className="p-6 space-y-4">
        <Field label="Fecha de Suscripción *">
          <input type="date" required className={inputCls} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
        </Field>
        <Field label="Motivo">
          <input type="text" className={inputCls} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} />
        </Field>
        <Field label="Descripción del Aclaratorio">
          <textarea rows={4} className={textareaCls} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        </Field>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
        <FormButtons onClose={onClose} isPending={pending} label="Registrar Aclaratorio" />
      </form>
    </Modal>
  )
}

// ── Timeline unificada ────────────────────────────────────────────────────────

type TimelineEvent =
  | { tipo: "ADICIÓN";    fecha: string; data: Adicion }
  | { tipo: "PRÓRROGA";   fecha: string; data: Prorroga }
  | { tipo: "SUSPENSIÓN"; fecha: string; data: Suspension }
  | { tipo: "REINICIO";   fecha: string; data: Reinicio }
  | { tipo: "ACLARATORIO"; fecha: string; data: Aclaratorio }

function buildTimeline(m: ModificacionesData): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...m.adiciones.map(d    => ({ tipo: "ADICIÓN"    as const, fecha: d.fecha_adicion,       data: d })),
    ...m.prorrogas.map(d    => ({ tipo: "PRÓRROGA"   as const, fecha: d.fecha_suscripcion,   data: d })),
    ...m.suspensiones.map(d => ({ tipo: "SUSPENSIÓN" as const, fecha: d.inicio_suspension,   data: d })),
    ...m.reinicios.map(d    => ({ tipo: "REINICIO"   as const, fecha: d.fecha_reinicio,      data: d })),
    ...m.aclaratorios.map(d => ({ tipo: "ACLARATORIO" as const, fecha: d.fecha_suscripcion, data: d })),
  ]
  return events.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function EventDetail({ event, canDelete, onDelete }: { event: TimelineEvent; canDelete: boolean; onDelete?: () => void }) {
  const [open, setOpen] = useState(false)
  const [delPending, startDel] = useTransition()

  function handleDelete() {
    if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return
    startDel(async () => {
      if (!onDelete) return
      onDelete()
    })
  }

  return (
    <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f9f9ff] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#f0f3ff] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#0B3D91]">
          {fmtDate(event.fecha).slice(3)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <TypeChip tipo={event.tipo} />
            <span className="text-xs text-[#747783]">{fmtDate(event.fecha)}</span>
          </div>
          <p className="text-sm font-medium text-[#151c27] truncate">
            {event.tipo === "ADICIÓN"    && `${ordinal((event.data as Adicion).numero_adicion)} Adición${(event.data as Adicion).valor_total ? ` — +${formatCOP((event.data as Adicion).valor_total!)}` : ""}`}
            {event.tipo === "PRÓRROGA"   && `${ordinal((event.data as Prorroga).numero_prorroga)} Prórroga — hasta ${fmtDate((event.data as Prorroga).nueva_fecha_terminacion)}`}
            {event.tipo === "SUSPENSIÓN" && `Suspensión N°${(event.data as Suspension).numero_suspension}${(event.data as Suspension).fin_suspension ? ` — ${daysBetween((event.data as Suspension).inicio_suspension, (event.data as Suspension).fin_suspension!)} días` : " (en curso)"}`}
            {event.tipo === "REINICIO"   && `Reinicio N°${(event.data as Reinicio).numero_reinicio}`}
            {event.tipo === "ACLARATORIO"&& `Aclaratorio N°${(event.data as Aclaratorio).numero_aclaratorio}`}
          </p>
        </div>
        {open ? <ChevronUp size={14} className="text-[#747783] shrink-0" /> : <ChevronDown size={14} className="text-[#747783] shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#EAEAEA] bg-[#fafbff] space-y-2 pt-3">
          {event.tipo === "ADICIÓN" && (() => { const d = event.data as Adicion; return (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {d.valor_total            && <div><p className="text-[10px] text-[#747783] uppercase">Valor Total</p><p className="font-semibold">{formatCOP(d.valor_total)}</p></div>}
              {d.valor_cuota_gerencia   && <div><p className="text-[10px] text-[#747783] uppercase">Cuota Gerencia</p><p className="font-semibold">{formatCOP(d.valor_cuota_gerencia)}</p></div>}
              {d.valor_bienes_servicios && <div><p className="text-[10px] text-[#747783] uppercase">Bienes y Servicios</p><p className="font-semibold">{formatCOP(d.valor_bienes_servicios)}</p></div>}
              {d.numero_rp && <div><p className="text-[10px] text-[#747783] uppercase">Número RP</p><p className="font-semibold font-mono">{d.numero_rp}</p></div>}
              {d.motivo && <div className="col-span-2"><p className="text-[10px] text-[#747783] uppercase">Motivo</p><p>{d.motivo}</p></div>}
              {d.link_documental && <div className="col-span-2"><a href={d.link_documental} target="_blank" rel="noreferrer" className="text-xs text-[#0B3D91] underline">Ver documento</a></div>}
            </div>
          )})()}
          {event.tipo === "PRÓRROGA" && (() => { const d = event.data as Prorroga; return (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] text-[#747783] uppercase">Nueva Terminación</p><p className="font-semibold text-amber-600">{fmtDate(d.nueva_fecha_terminacion)}</p></div>
              {d.plazo_prorroga && <div><p className="text-[10px] text-[#747783] uppercase">Plazo</p><p>{d.plazo_prorroga}</p></div>}
              {d.justificacion && <div className="col-span-2"><p className="text-[10px] text-[#747783] uppercase">Justificación</p><p>{d.justificacion}</p></div>}
            </div>
          )})()}
          {event.tipo === "SUSPENSIÓN" && (() => { const d = event.data as Suspension; return (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] text-[#747783] uppercase">Inicio</p><p className="font-semibold">{fmtDate(d.inicio_suspension)}</p></div>
              <div><p className="text-[10px] text-[#747783] uppercase">Fin</p><p className="font-semibold">{d.fin_suspension ? fmtDate(d.fin_suspension) : "En curso"}</p></div>
              {d.plazo_suspension && <div><p className="text-[10px] text-[#747783] uppercase">Plazo</p><p>{d.plazo_suspension}</p></div>}
              {d.motivo && <div className="col-span-2"><p className="text-[10px] text-[#747783] uppercase">Motivo</p><p>{d.motivo}</p></div>}
            </div>
          )})()}
          {event.tipo === "REINICIO" && (() => { const d = event.data as Reinicio; return (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] text-[#747783] uppercase">Fecha Reinicio</p><p className="font-semibold">{fmtDate(d.fecha_reinicio)}</p></div>
              {d.fecha_suscripcion && <div><p className="text-[10px] text-[#747783] uppercase">Fecha Suscripción</p><p>{fmtDate(d.fecha_suscripcion)}</p></div>}
              {d.motivo && <div className="col-span-2"><p className="text-[10px] text-[#747783] uppercase">Motivo</p><p>{d.motivo}</p></div>}
              {d.observaciones && <div className="col-span-2"><p className="text-[10px] text-[#747783] uppercase">Observaciones</p><p>{d.observaciones}</p></div>}
            </div>
          )})()}
          {event.tipo === "ACLARATORIO" && (() => { const d = event.data as Aclaratorio; return (
            <div className="space-y-2 text-sm">
              {d.motivo && <div><p className="text-[10px] text-[#747783] uppercase">Motivo</p><p>{d.motivo}</p></div>}
              {d.descripcion && <div><p className="text-[10px] text-[#747783] uppercase">Descripción</p><p>{d.descripcion}</p></div>}
            </div>
          )})()}

          {canDelete && (
            <div className="pt-2 border-t border-[#EAEAEA] flex justify-end">
              <button type="button" disabled={delPending} onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">
                <Trash2 size={12} /> Eliminar registro
              </button>
            </div>
          )}
          <p className="text-[9px] text-[#747783]">Registrado por: {event.data.user_email ?? "sistema"}</p>
        </div>
      )}
    </div>
  )
}

// ── Props principales ─────────────────────────────────────────────────────────

interface Props {
  interadministrativoId: number
  fechaTerminacionOriginal: string | null
  modificaciones: ModificacionesData
  canEdit: boolean
  canDelete: boolean
}

type ModalType = "adicion" | "prorroga" | "suspension" | "reinicio" | "aclaratorio" | null

// ── Componente principal ──────────────────────────────────────────────────────

export function ModificacionesTab({ interadministrativoId, fechaTerminacionOriginal, modificaciones: m, canEdit, canDelete }: Props) {
  const [modal, setModal] = useState<ModalType>(null)

  const timeline = buildTimeline(m)
  const totalAdiciones = m.adiciones.reduce((s, a) => s + (a.valor_total ?? 0), 0)
  const diasSuspendidos = m.suspensiones.reduce((s, sus) => {
    if (!sus.fin_suspension) return s
    return s + daysBetween(sus.inicio_suspension, sus.fin_suspension)
  }, 0)
  const ultimaProrroga = m.prorrogas.at(-1)

  const handleDelete = (event: TimelineEvent) => async () => {
    if (event.tipo === "ADICIÓN")     await deleteAdicion((event.data as Adicion).id, interadministrativoId)
    if (event.tipo === "PRÓRROGA")    await deleteProrroga((event.data as Prorroga).id, interadministrativoId)
    if (event.tipo === "SUSPENSIÓN")  await deleteSuspension((event.data as Suspension).id, interadministrativoId)
    if (event.tipo === "REINICIO")    await deleteReinicio((event.data as Reinicio).id, interadministrativoId)
    if (event.tipo === "ACLARATORIO") await deleteAclaratorio((event.data as Aclaratorio).id, interadministrativoId)
  }

  return (
    <div className="space-y-6">

      {/* ── Resumen ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Adiciones",    count: m.adiciones.length,    detail: totalAdiciones > 0 ? formatCOP(totalAdiciones) : undefined, color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
          { label: "Prórrogas",    count: m.prorrogas.length,    detail: ultimaProrroga ? `Hasta ${fmtDate(ultimaProrroga.nueva_fecha_terminacion)}` : undefined, color: "border-amber-200 bg-amber-50", text: "text-amber-700" },
          { label: "Suspensiones", count: m.suspensiones.length, detail: diasSuspendidos > 0 ? `${diasSuspendidos} días` : undefined, color: "border-yellow-200 bg-yellow-50", text: "text-yellow-700" },
          { label: "Reinicios",    count: m.reinicios.length,    color: "border-blue-200 bg-blue-50", text: "text-blue-700" },
          { label: "Aclaratorios", count: m.aclaratorios.length, color: "border-violet-200 bg-violet-50", text: "text-violet-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className={`text-2xl font-bold tabular-nums ${s.text}`}>{s.count}</p>
            <p className="text-[11px] font-semibold text-[#434652] mt-0.5">{s.label}</p>
            {s.detail && <p className="text-[10px] text-[#747783] mt-0.5">{s.detail}</p>}
          </div>
        ))}
      </div>

      {/* ── Botones de acción ── */}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Nueva Adición",    tipo: "adicion"    as ModalType, color: "bg-emerald-600 hover:bg-emerald-700" },
            { label: "Nueva Prórroga",   tipo: "prorroga"   as ModalType, color: "bg-amber-600 hover:bg-amber-700" },
            { label: "Nueva Suspensión", tipo: "suspension" as ModalType, color: "bg-yellow-600 hover:bg-yellow-700" },
            { label: "Nuevo Reinicio",   tipo: "reinicio"   as ModalType, color: "bg-blue-600 hover:bg-blue-700" },
            { label: "Nuevo Aclaratorio",tipo: "aclaratorio"as ModalType, color: "bg-violet-600 hover:bg-violet-700" },
          ].map((btn) => (
            <button
              key={btn.tipo}
              type="button"
              onClick={() => setModal(btn.tipo)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${btn.color}`}
            >
              <Plus size={12} /> {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Timeline ── */}
      {timeline.length === 0 ? (
        <div className="border border-dashed border-[#EAEAEA] rounded-xl py-16 text-center">
          <p className="text-sm font-semibold text-[#151c27]">Sin modificaciones contractuales</p>
          <p className="text-xs text-[#747783] mt-1">Las adiciones, prórrogas y demás modificaciones aparecerán aquí.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-bold text-[#434652] uppercase tracking-wide mb-3">Línea de Tiempo</h3>
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[#EAEAEA]" />
            {timeline.map((event, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-4 top-4 w-3 h-3 rounded-full bg-white border-2 border-[#0B3D91]" />
                <EventDetail
                  event={event}
                  canDelete={canDelete}
                  onDelete={handleDelete(event)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modales ── */}
      {modal === "adicion"     && <AdicionModal     interadministrativoId={interadministrativoId} nextNum={m.adiciones.length + 1}     onClose={() => setModal(null)} />}
      {modal === "prorroga"    && <ProrrogaModal    interadministrativoId={interadministrativoId} nextNum={m.prorrogas.length + 1}     fechaTerminacionActual={ultimaProrroga?.nueva_fecha_terminacion ?? fechaTerminacionOriginal} onClose={() => setModal(null)} />}
      {modal === "suspension"  && <SuspensionModal  interadministrativoId={interadministrativoId} nextNum={m.suspensiones.length + 1}  onClose={() => setModal(null)} />}
      {modal === "reinicio"    && <ReinicioModal    interadministrativoId={interadministrativoId} nextNum={m.reinicios.length + 1}     onClose={() => setModal(null)} />}
      {modal === "aclaratorio" && <AclaratorioModal interadministrativoId={interadministrativoId} nextNum={m.aclaratorios.length + 1}  onClose={() => setModal(null)} />}
    </div>
  )
}
