"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import {
  createContractAdicion, deleteContractAdicion,
  createContractProrroga, deleteContractProrroga,
  createContractSuspension, deleteContractSuspension,
  createContractReinicio, deleteContractReinicio,
  createContractAclaratorio, deleteContractAclaratorio,
} from "@/services/contract-modificaciones.actions"
import type { ContractModificacionesData } from "@/types/contract-derivado"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function ordinal(n: number) {
  const labels = ["", "Primera", "Segunda", "Tercera", "Cuarta", "Quinta"]
  return labels[n] ?? `N°${n}`
}

const CHIP: Record<string, string> = {
  ADICIÓN:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  PRÓRROGA:   "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENSIÓN: "bg-yellow-50 text-yellow-700 border-yellow-200",
  REINICIO:   "bg-blue-50 text-blue-700 border-blue-200",
  ACLARATORIO:"bg-violet-50 text-violet-700 border-violet-200",
}

function TypeChip({ tipo }: { tipo: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${CHIP[tipo] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {tipo}
    </span>
  )
}

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

const inputCls   = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
const textCls    = "w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none"
const btnCls     = "flex-1 h-10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"

function FormButtons({ onClose, isPending, label }: { onClose: () => void; isPending: boolean; label: string }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onClose} disabled={isPending}
        className={`${btnCls} border border-[#EAEAEA] text-[#434652] hover:bg-[#f9f9ff]`}>
        Cancelar
      </button>
      <button type="submit" disabled={isPending}
        className={`${btnCls} bg-[#0B3D91] text-white hover:bg-[#002869]`}>
        {isPending ? "Guardando…" : label}
      </button>
    </div>
  )
}

// ── Accordion section ─────────────────────────────────────────────────────────

function Section({ title, tipo, count, children }: {
  title: string; tipo: string; count: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f9f9ff] hover:bg-[#f0f3ff] transition-colors">
        <div className="flex items-center gap-3">
          <TypeChip tipo={tipo} />
          <span className="text-sm font-semibold text-[#151C27]">{title}</span>
          <span className="text-xs text-[#747783]">({count})</span>
        </div>
        {open ? <ChevronUp size={16} className="text-[#747783]" /> : <ChevronDown size={16} className="text-[#747783]" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

// ── Modales de cada tipo ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B3D91] border-b border-[#EAEAEA] pb-1 mb-3">{children}</p>
  )
}

function AdicionModal({ contratoId, projectId, onClose }: { contratoId: number; projectId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    fecha_adicion: "", motivo: "",
    valor_adicion: "", valor_bienes_servicios: "", valor_cuota_gerencia: "",
    numero_cdp: "", fecha_cdp: "", numero_rp: "", fecha_rp: "",
    link_documental: "", observaciones: "",
  })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()
  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function parseVal(s: string) { return parseFloat(s.replace(/[^0-9.]/g, "")) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    const valTotal  = parseVal(form.valor_adicion)
    const valBienes = parseVal(form.valor_bienes_servicios)
    const valCuota  = parseVal(form.valor_cuota_gerencia)
    if (isNaN(valTotal) || valTotal <= 0)   { setError("Ingrese un valor total válido."); return }
    if (isNaN(valBienes) || valBienes < 0)  { setError("Ingrese un valor bienes y servicios válido."); return }
    if (isNaN(valCuota)  || valCuota  < 0)  { setError("Ingrese un valor cuota de gerencia válido."); return }
    start(async () => {
      const res = await createContractAdicion({
        contrato_id: contratoId, project_id: projectId,
        fecha_adicion:          form.fecha_adicion,
        valor_adicion:          valTotal,
        valor_bienes_servicios: valBienes,
        valor_cuota_gerencia:   valCuota,
        motivo:                 form.motivo,
        numero_cdp:             form.numero_cdp,
        fecha_cdp:              form.fecha_cdp,
        numero_rp:              form.numero_rp,
        fecha_rp:               form.fecha_rp,
        link_documental:        form.link_documental || undefined,
        observaciones:          form.observaciones   || undefined,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <Modal title="Registrar Adición" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-5">

        {/* Información General */}
        <div>
          <SectionLabel>Información General</SectionLabel>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de Suscripción *">
                <input type="date" required value={form.fecha_adicion} onChange={e => set("fecha_adicion", e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Motivo de la Adición *">
              <textarea rows={2} required value={form.motivo} onChange={e => set("motivo", e.target.value)} className={textCls} />
            </Field>
          </div>
        </div>

        {/* Valores */}
        <div>
          <SectionLabel>Valores</SectionLabel>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Valor Total Adición *">
              <input required value={form.valor_adicion} onChange={e => set("valor_adicion", e.target.value)} placeholder="Ej: 10000000" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor Bolsa Bienes y Servicios *">
                <input required value={form.valor_bienes_servicios} onChange={e => set("valor_bienes_servicios", e.target.value)} placeholder="Ej: 8000000" className={inputCls} />
              </Field>
              <Field label="Valor Cuota de Gerencia *">
                <input required value={form.valor_cuota_gerencia} onChange={e => set("valor_cuota_gerencia", e.target.value)} placeholder="Ej: 2000000" className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* Soporte Presupuestal */}
        <div>
          <SectionLabel>Soporte Presupuestal</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número CDP *">
              <input required value={form.numero_cdp} onChange={e => set("numero_cdp", e.target.value)} placeholder="Ej: CDP-2026-00125" className={inputCls} />
            </Field>
            <Field label="Fecha CDP *">
              <input type="date" required value={form.fecha_cdp} onChange={e => set("fecha_cdp", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Número RP *">
              <input required value={form.numero_rp} onChange={e => set("numero_rp", e.target.value)} placeholder="Ej: RP-2026-00458" className={inputCls} />
            </Field>
            <Field label="Fecha RP *">
              <input type="date" required value={form.fecha_rp} onChange={e => set("fecha_rp", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Documentación */}
        <div>
          <SectionLabel>Documentación</SectionLabel>
          <div className="space-y-4">
            <Field label="Enlace Carpeta Externa">
              <input type="url" value={form.link_documental} onChange={e => set("link_documental", e.target.value)} placeholder="https://…" className={inputCls} />
            </Field>
            <Field label="Observaciones">
              <textarea rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} className={textCls} />
            </Field>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <FormButtons onClose={onClose} isPending={isPending} label="Registrar Adición" />
      </form>
    </Modal>
  )
}

function ProrrogaModal({ contratoId, projectId, onClose }: { contratoId: number; projectId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ fecha_suscripcion: "", nueva_fecha_terminacion: "", plazo_prorroga: "", justificacion: "" })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()
  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await createContractProrroga({
        contrato_id: contratoId, project_id: projectId,
        fecha_suscripcion: form.fecha_suscripcion,
        nueva_fecha_terminacion: form.nueva_fecha_terminacion,
        plazo_prorroga: form.plazo_prorroga, justificacion: form.justificacion,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <Modal title="Registrar Prórroga" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha suscripción *"><input type="date" required value={form.fecha_suscripcion} onChange={e => set("fecha_suscripcion", e.target.value)} className={inputCls} /></Field>
          <Field label="Nueva terminación *"><input type="date" required value={form.nueva_fecha_terminacion} onChange={e => set("nueva_fecha_terminacion", e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Plazo prórroga"><input value={form.plazo_prorroga} onChange={e => set("plazo_prorroga", e.target.value)} placeholder="Ej: 3 meses" className={inputCls} /></Field>
        <Field label="Justificación"><textarea rows={2} value={form.justificacion} onChange={e => set("justificacion", e.target.value)} className={textCls} /></Field>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <FormButtons onClose={onClose} isPending={isPending} label="Registrar Prórroga" />
      </form>
    </Modal>
  )
}

function SuspensionModal({ contratoId, projectId, onClose }: { contratoId: number; projectId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ fecha_suscripcion: "", inicio_suspension: "", fin_suspension: "", plazo_suspension: "", motivo: "" })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()
  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await createContractSuspension({
        contrato_id: contratoId, project_id: projectId,
        fecha_suscripcion: form.fecha_suscripcion || undefined,
        inicio_suspension: form.inicio_suspension,
        fin_suspension: form.fin_suspension || undefined,
        plazo_suspension: form.plazo_suspension, motivo: form.motivo,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <Modal title="Registrar Suspensión" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Inicio suspensión *"><input type="date" required value={form.inicio_suspension} onChange={e => set("inicio_suspension", e.target.value)} className={inputCls} /></Field>
          <Field label="Fin suspensión"><input type="date" value={form.fin_suspension} onChange={e => set("fin_suspension", e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha suscripción"><input type="date" value={form.fecha_suscripcion} onChange={e => set("fecha_suscripcion", e.target.value)} className={inputCls} /></Field>
          <Field label="Plazo suspensión"><input value={form.plazo_suspension} onChange={e => set("plazo_suspension", e.target.value)} placeholder="Ej: 15 días" className={inputCls} /></Field>
        </div>
        <Field label="Motivo"><textarea rows={2} value={form.motivo} onChange={e => set("motivo", e.target.value)} className={textCls} /></Field>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <FormButtons onClose={onClose} isPending={isPending} label="Registrar Suspensión" />
      </form>
    </Modal>
  )
}

function ReinicioModal({ contratoId, projectId, onClose }: { contratoId: number; projectId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ fecha_reinicio: "", fecha_suscripcion: "", motivo: "", observaciones: "" })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()
  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await createContractReinicio({
        contrato_id: contratoId, project_id: projectId,
        fecha_reinicio: form.fecha_reinicio,
        fecha_suscripcion: form.fecha_suscripcion || undefined,
        motivo: form.motivo, observaciones: form.observaciones,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <Modal title="Registrar Reinicio" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha reinicio *"><input type="date" required value={form.fecha_reinicio} onChange={e => set("fecha_reinicio", e.target.value)} className={inputCls} /></Field>
          <Field label="Fecha suscripción"><input type="date" value={form.fecha_suscripcion} onChange={e => set("fecha_suscripcion", e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Motivo"><textarea rows={2} value={form.motivo} onChange={e => set("motivo", e.target.value)} className={textCls} /></Field>
        <Field label="Observaciones"><textarea rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} className={textCls} /></Field>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <FormButtons onClose={onClose} isPending={isPending} label="Registrar Reinicio" />
      </form>
    </Modal>
  )
}

function AclaratoriModal({ contratoId, projectId, onClose }: { contratoId: number; projectId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ fecha_suscripcion: "", motivo: "", descripcion: "" })
  const [error, setError]  = useState<string | null>(null)
  const [isPending, start] = useTransition()
  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const res = await createContractAclaratorio({
        contrato_id: contratoId, project_id: projectId,
        fecha_suscripcion: form.fecha_suscripcion,
        motivo: form.motivo, descripcion: form.descripcion,
      })
      if (res.error) { setError(res.error); return }
      onClose(); router.refresh()
    })
  }

  return (
    <Modal title="Registrar Aclaratorio" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <Field label="Fecha suscripción *"><input type="date" required value={form.fecha_suscripcion} onChange={e => set("fecha_suscripcion", e.target.value)} className={inputCls} /></Field>
        <Field label="Motivo"><input value={form.motivo} onChange={e => set("motivo", e.target.value)} className={inputCls} /></Field>
        <Field label="Descripción"><textarea rows={3} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} className={textCls} /></Field>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <FormButtons onClose={onClose} isPending={isPending} label="Registrar Aclaratorio" />
      </form>
    </Modal>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

type ModalType = "adicion" | "prorroga" | "suspension" | "reinicio" | "aclaratorio" | null

export function DerivedModificacionesTab({
  data, contratoId, projectId, canEdit,
  legacyAdicion, legacyProrroga, legacySuspension, legacyReinicio,
}: {
  data: ContractModificacionesData
  contratoId: number
  projectId: string
  canEdit: boolean
  legacyAdicion?: number | null
  legacyProrroga?: string | null
  legacySuspension?: string | null
  legacyReinicio?: string | null
}) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalType>(null)
  const [isPending, start] = useTransition()
  const total = data.adiciones.length + data.prorrogas.length + data.suspensiones.length +
    data.reinicios.length + data.aclaratorios.length

  function confirmDelete(action: () => Promise<{ error: string | null }>) {
    if (!confirm("¿Eliminar este registro?")) return
    start(async () => { await action(); router.refresh() })
  }

  return (
    <>
      {modal === "adicion"    && <AdicionModal    contratoId={contratoId} projectId={projectId} onClose={() => setModal(null)} />}
      {modal === "prorroga"   && <ProrrogaModal   contratoId={contratoId} projectId={projectId} onClose={() => setModal(null)} />}
      {modal === "suspension" && <SuspensionModal contratoId={contratoId} projectId={projectId} onClose={() => setModal(null)} />}
      {modal === "reinicio"   && <ReinicioModal   contratoId={contratoId} projectId={projectId} onClose={() => setModal(null)} />}
      {modal === "aclaratorio"&& <AclaratoriModal contratoId={contratoId} projectId={projectId} onClose={() => setModal(null)} />}

      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Adiciones",    count: data.adiciones.length,    tipo: "ADICIÓN" },
          { label: "Prórrogas",    count: data.prorrogas.length,    tipo: "PRÓRROGA" },
          { label: "Suspensiones", count: data.suspensiones.length, tipo: "SUSPENSIÓN" },
          { label: "Reinicios",    count: data.reinicios.length,    tipo: "REINICIO" },
          { label: "Aclaratorios", count: data.aclaratorios.length, tipo: "ACLARATORIO" },
        ].map(({ label, count }) => (
          <div key={label} className="bg-white border border-[#EAEAEA] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#002869]">{count}</p>
            <p className="text-[10px] text-[#747783] uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="flex flex-wrap gap-2 mb-5">
          {(["adicion","prorroga","suspension","reinicio","aclaratorio"] as const).map(t => (
            <button key={t} onClick={() => setModal(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#EAEAEA] bg-white text-[#434652] rounded-lg text-xs font-medium hover:bg-[#f0f3ff] transition-colors">
              <Plus size={12} />
              {{adicion:"Adición",prorroga:"Prórroga",suspension:"Suspensión",reinicio:"Reinicio",aclaratorio:"Aclaratorio"}[t]}
            </button>
          ))}
        </div>
      )}

      {/* Panel de datos legacy del contrato base */}
      {(legacyAdicion || legacyProrroga || legacySuspension || legacyReinicio) && (
        <div className="mb-5 border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
            Datos registrados en el contrato base
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {legacyAdicion != null && (
              <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-[#747783] uppercase mb-0.5">Adición (valor)</p>
                <p className="text-sm font-bold text-emerald-700">{formatCOP(legacyAdicion)}</p>
              </div>
            )}
            {legacyProrroga && (
              <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-[#747783] uppercase mb-0.5">Prórroga</p>
                <p className="text-sm text-[#434652]">{legacyProrroga}</p>
              </div>
            )}
            {legacySuspension && (
              <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-[#747783] uppercase mb-0.5">Suspensión</p>
                <p className="text-sm text-[#434652]">{legacySuspension}</p>
              </div>
            )}
            {legacyReinicio && (
              <div className="bg-white rounded-lg border border-amber-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-[#747783] uppercase mb-0.5">Reinicio</p>
                <p className="text-sm text-[#434652]">{legacyReinicio}</p>
              </div>
            )}
          </div>
          {canEdit && (
            <p className="text-[10px] text-amber-600">
              Usa los botones de arriba para registrar estas modificaciones en formato estructurado.
            </p>
          )}
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-semibold text-[#151C27]">Sin modificaciones estructuradas</p>
          <p className="text-xs text-[#747783] mt-1">
            {canEdit
              ? "Usa los botones de arriba para registrar adiciones, prórrogas y suspensiones."
              : "No hay modificaciones registradas en el expediente."}
          </p>
        </div>
      ) : (
        <div className="space-y-4" style={{ opacity: isPending ? 0.6 : 1 }}>

          {/* Adiciones */}
          {data.adiciones.length > 0 && (
            <Section title="Adiciones" tipo="ADICIÓN" count={data.adiciones.length}>
              <div className="space-y-4">
                {data.adiciones.map(a => (
                  <div key={a.id} className="bg-[#f9f9ff] rounded-xl border border-[#EAEAEA] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#EAEAEA]">
                      <p className="text-sm font-bold text-[#002869]">{ordinal(a.numero_adicion)} Adición — {formatCOP(a.valor_adicion)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#747783]">{fmtDate(a.fecha_adicion)}</span>
                        {canEdit && (
                          <button onClick={() => confirmDelete(() => deleteContractAdicion(a.id, contratoId, projectId))}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {/* Motivo */}
                      {a.motivo && (
                        <p className="text-xs text-[#434652]">{a.motivo}</p>
                      )}

                      {/* Soporte presupuestal */}
                      {(a.numero_cdp || a.numero_rp) && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[#0B3D91] mb-1.5">Soporte Presupuestal</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            {a.numero_cdp && (
                              <div>
                                <span className="text-[10px] text-[#747783]">CDP: </span>
                                <span className="text-[10px] font-semibold text-[#151C27]">{a.numero_cdp}</span>
                                {a.fecha_cdp && <span className="text-[10px] text-[#747783]"> · {fmtDate(a.fecha_cdp)}</span>}
                              </div>
                            )}
                            {a.numero_rp && (
                              <div>
                                <span className="text-[10px] text-[#747783]">RP: </span>
                                <span className="text-[10px] font-semibold text-[#151C27]">{a.numero_rp}</span>
                                {a.fecha_rp && <span className="text-[10px] text-[#747783]"> · {fmtDate(a.fecha_rp)}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Distribución económica */}
                      {(a.valor_bienes_servicios != null || a.valor_cuota_gerencia != null) && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[#0B3D91] mb-1.5">Distribución Económica</p>
                          <div className="grid grid-cols-2 gap-3">
                            {a.valor_bienes_servicios != null && (
                              <div className="bg-white rounded-lg px-3 py-2 border border-[#EAEAEA]">
                                <p className="text-[9px] text-[#747783] uppercase tracking-wide">Bienes y Servicios</p>
                                <p className="text-xs font-semibold text-[#151C27]">{formatCOP(a.valor_bienes_servicios)}</p>
                              </div>
                            )}
                            {a.valor_cuota_gerencia != null && (
                              <div className="bg-white rounded-lg px-3 py-2 border border-[#EAEAEA]">
                                <p className="text-[9px] text-[#747783] uppercase tracking-wide">Cuota de Gerencia</p>
                                <p className="text-xs font-semibold text-[#151C27]">{formatCOP(a.valor_cuota_gerencia)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Observaciones y enlace */}
                      {a.observaciones && <p className="text-xs text-[#747783] italic">{a.observaciones}</p>}
                      {a.link_documental && (
                        <a href={a.link_documental} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#0B3D91] hover:underline inline-block">Ver carpeta documental ↗</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Prórrogas */}
          {data.prorrogas.length > 0 && (
            <Section title="Prórrogas" tipo="PRÓRROGA" count={data.prorrogas.length}>
              <div className="space-y-3">
                {data.prorrogas.map(pr => (
                  <div key={pr.id} className="flex items-start justify-between bg-[#f9f9ff] rounded-lg px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002869]">{ordinal(pr.numero_prorroga)} Prórroga</p>
                      <p className="text-xs text-[#747783] mt-0.5">Nueva terminación: <strong>{fmtDate(pr.nueva_fecha_terminacion)}</strong></p>
                      {pr.plazo_prorroga && <p className="text-xs text-[#434652]">Plazo: {pr.plazo_prorroga}</p>}
                      {pr.justificacion && <p className="text-xs text-[#434652] mt-1">{pr.justificacion}</p>}
                    </div>
                    {canEdit && (
                      <button onClick={() => confirmDelete(() => deleteContractProrroga(pr.id, contratoId, projectId))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 shrink-0"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Suspensiones */}
          {data.suspensiones.length > 0 && (
            <Section title="Suspensiones" tipo="SUSPENSIÓN" count={data.suspensiones.length}>
              <div className="space-y-3">
                {data.suspensiones.map(s => (
                  <div key={s.id} className="flex items-start justify-between bg-[#f9f9ff] rounded-lg px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002869]">{ordinal(s.numero_suspension)} Suspensión</p>
                      <p className="text-xs text-[#747783] mt-0.5">Inicio: {fmtDate(s.inicio_suspension)} {s.fin_suspension ? `— Fin: ${fmtDate(s.fin_suspension)}` : ""}</p>
                      {s.motivo && <p className="text-xs text-[#434652] mt-1">{s.motivo}</p>}
                    </div>
                    {canEdit && (
                      <button onClick={() => confirmDelete(() => deleteContractSuspension(s.id, contratoId, projectId))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 shrink-0"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Reinicios */}
          {data.reinicios.length > 0 && (
            <Section title="Reinicios" tipo="REINICIO" count={data.reinicios.length}>
              <div className="space-y-3">
                {data.reinicios.map(r => (
                  <div key={r.id} className="flex items-start justify-between bg-[#f9f9ff] rounded-lg px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002869]">{ordinal(r.numero_reinicio)} Reinicio</p>
                      <p className="text-xs text-[#747783] mt-0.5">Fecha reinicio: {fmtDate(r.fecha_reinicio)}</p>
                      {r.motivo && <p className="text-xs text-[#434652] mt-1">{r.motivo}</p>}
                    </div>
                    {canEdit && (
                      <button onClick={() => confirmDelete(() => deleteContractReinicio(r.id, contratoId, projectId))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 shrink-0"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Aclaratorios */}
          {data.aclaratorios.length > 0 && (
            <Section title="Aclaratorios" tipo="ACLARATORIO" count={data.aclaratorios.length}>
              <div className="space-y-3">
                {data.aclaratorios.map(ac => (
                  <div key={ac.id} className="flex items-start justify-between bg-[#f9f9ff] rounded-lg px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002869]">{ordinal(ac.numero_aclaratorio)} Aclaratorio</p>
                      <p className="text-xs text-[#747783] mt-0.5">Suscrito: {fmtDate(ac.fecha_suscripcion)}</p>
                      {ac.motivo && <p className="text-xs text-[#434652] mt-1">{ac.motivo}</p>}
                      {ac.descripcion && <p className="text-xs text-[#747783] mt-0.5">{ac.descripcion}</p>}
                    </div>
                    {canEdit && (
                      <button onClick={() => confirmDelete(() => deleteContractAclaratorio(ac.id, contratoId, projectId))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 shrink-0"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>
      )}
    </>
  )
}
