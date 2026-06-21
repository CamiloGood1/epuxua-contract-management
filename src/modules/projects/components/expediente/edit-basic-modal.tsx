"use client"

import { useState, useMemo, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, AlertTriangle, CheckCircle2 } from "lucide-react"
import { updateInteradministrativo } from "@/services/update-interadmin.actions"
import { FIELD_LABELS } from "@/types/change-log"
import { ESTADO_ORDER, ESTADO_CONFIG } from "../../lib/lifecycle"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import type { UpdateInteradminInput } from "@/services/update-interadmin.actions"

// ── Helper types ──────────────────────────────────────────────────────────────

type Step = "editing" | "confirming"

interface FormState {
  id_contrato:            string
  objeto_contrato:        string
  secretaria:             string
  area_responsable:       string
  categoria:              string
  clase_contrato:         string
  modalidad_seleccion:    string
  estado:                 EstadoInteradministrativo
  supervision:            string
  fecha_suscripcion:      string
  fecha_inicio_ejecucion: string
  fecha_terminacion:      string
  plazo_ejecucion_inicial:string
  pct_cuota_gerencia:     string
  valor_inicial:          string
  cuota_admin_inicial:    string
  total_contrato:         string
  link_secop:             string
  link_documentacion:     string
  avance_fisico_pct:      string
  observaciones:          string
}

function toForm(p: Interadministrativo): FormState {
  return {
    id_contrato:             p.id_contrato                     ?? "",
    objeto_contrato:         p.objeto_contrato                 ?? "",
    secretaria:              p.secretaria                      ?? "",
    area_responsable:        p.area_responsable                ?? "",
    categoria:               p.categoria                       ?? "",
    clase_contrato:          p.clase_contrato                  ?? "",
    modalidad_seleccion:     p.modalidad_seleccion             ?? "",
    estado:                  p.estado,
    supervision:             p.supervision                     ?? "",
    fecha_suscripcion:       p.fecha_suscripcion               ?? "",
    fecha_inicio_ejecucion:  p.fecha_inicio_ejecucion          ?? "",
    fecha_terminacion:       p.fecha_terminacion               ?? "",
    plazo_ejecucion_inicial: p.plazo_ejecucion_inicial         ?? "",
    pct_cuota_gerencia:      p.pct_cuota_gerencia  != null ? String(p.pct_cuota_gerencia) : "",
    valor_inicial:           p.valor_inicial        != null ? String(p.valor_inicial)       : "",
    cuota_admin_inicial:     p.cuota_admin_inicial  != null ? String(p.cuota_admin_inicial) : "",
    total_contrato:          p.total_contrato       != null ? String(p.total_contrato)      : "",
    link_secop:              p.link_secop                      ?? "",
    link_documentacion:      p.link_documentacion             ?? "",
    avance_fisico_pct:       p.avance_fisico_pct   != null ? String(p.avance_fisico_pct)   : "0",
    observaciones:           p.observaciones                   ?? "",
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="col-span-2 pt-2 border-t border-[#EAEAEA] mt-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3D91]">{title}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  project: Interadministrativo
  onClose: () => void
}

export function EditBasicModal({ project: p, onClose }: Props) {
  const router = useRouter()
  const [step, setStep]       = useState<Step>("editing")
  const [form, setForm]       = useState<FormState>(() => toForm(p))
  const [error, setError]     = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  useEffect(() => {
    setForm(toForm(p))
  }, [p])

  function setField<K extends keyof FormState>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // ── Diff computation ───────────────────────────────────────────────────────

  const diff = useMemo(() => {
    const original = toForm(p)
    return (Object.keys(form) as (keyof FormState)[]).filter(k => {
      const oldV = original[k]?.trim() ?? ""
      const newV = form[k]?.trim()     ?? ""
      return oldV !== newV
    })
  }, [form, p])

  // ── Financial validation ───────────────────────────────────────────────────

  const finError = useMemo(() => {
    const cuota = parseFloat(form.cuota_admin_inicial)
    const total = parseFloat(form.total_contrato)
    if (!isNaN(cuota) && !isNaN(total) && cuota > total)
      return "La Cuota de Gerencia no puede superar el Valor Total."
    const pct = parseFloat(form.pct_cuota_gerencia)
    if (!isNaN(pct) && (pct < 0 || pct > 100))
      return "El porcentaje de cuota debe estar entre 0 y 100."
    const av = parseFloat(form.avance_fisico_pct)
    if (!isNaN(av) && (av < 0 || av > 100))
      return "El avance físico debe estar entre 0 y 100."
    return null
  }, [form])

  // ── Proceed to confirm ─────────────────────────────────────────────────────

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (finError) { setError(finError); return }
    if (diff.length === 0) { setError("No se detectaron cambios."); return }
    setStep("confirming")
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    setError(null)
    const parseNum = (s: string): number | null => {
      const t = s.trim()
      if (!t) return null
      const v = parseFloat(t.replace(",", "."))
      return Number.isFinite(v) ? v : null
    }
    const nullOrStr = (s: string): string | null => s.trim() || null

    const input: UpdateInteradminInput = {
      id:                      p.id,
      id_contrato:             form.id_contrato.trim()                   || p.id_contrato,
      objeto_contrato:         nullOrStr(form.objeto_contrato),
      secretaria:              nullOrStr(form.secretaria),
      area_responsable:        nullOrStr(form.area_responsable),
      categoria:               nullOrStr(form.categoria),
      clase_contrato:          nullOrStr(form.clase_contrato),
      modalidad_seleccion:     nullOrStr(form.modalidad_seleccion),
      estado:                  form.estado,
      supervision:             nullOrStr(form.supervision),
      fecha_suscripcion:       nullOrStr(form.fecha_suscripcion),
      fecha_inicio_ejecucion:  nullOrStr(form.fecha_inicio_ejecucion),
      fecha_terminacion:       nullOrStr(form.fecha_terminacion),
      plazo_ejecucion_inicial: nullOrStr(form.plazo_ejecucion_inicial),
      pct_cuota_gerencia:      parseNum(form.pct_cuota_gerencia),
      valor_inicial:           parseNum(form.valor_inicial),
      cuota_admin_inicial:     parseNum(form.cuota_admin_inicial),
      total_contrato:          parseNum(form.total_contrato),
      link_secop:              nullOrStr(form.link_secop),
      link_documentacion:      nullOrStr(form.link_documentacion),
      avance_fisico_pct:       parseNum(form.avance_fisico_pct),
      observaciones:           nullOrStr(form.observaciones),
    }

    start(async () => {
      try {
        const res = await updateInteradministrativo(input)
        if (res.error) {
          setError(res.error)
          setStep("editing")
          return
        }
        onClose()
        router.push(`/proyectos/${p.id}`)
        router.refresh()
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "No se pudo guardar. Verifique su sesión e intente de nuevo."
        setError(msg)
        setStep("editing")
      }
    })
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const avFis = Math.min(Math.max(parseFloat(form.avance_fisico_pct) || 0, 0), 100)

  // ── Step: Confirming ───────────────────────────────────────────────────────

  if (step === "confirming") {
    const original = toForm(p)
    const fmtVal = (field: keyof FormState, val: string) => {
      if (!val.trim()) return "—"
      if (["valor_inicial","cuota_admin_inicial","total_contrato"].includes(field)) {
        const n = parseFloat(val)
        if (isNaN(n)) return val
        const d = n % 1 !== 0 ? 2 : 0
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
      }
      return val
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
            <h2 className="text-base font-bold text-[#002869]">Confirmar Cambios</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-amber-800">
                Se modificarán <strong>{diff.length}</strong> campo{diff.length > 1 ? "s" : ""}. Esta acción quedará registrada en el historial de cambios.
              </p>
            </div>

            <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#747783]">Campo</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#747783]">Antes</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#747783]">Después</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {diff.map(field => (
                    <tr key={field} className="hover:bg-[#f9f9ff]">
                      <td className="px-4 py-2.5 font-semibold text-[#151c27] text-xs">{FIELD_LABELS[field] ?? field}</td>
                      <td className="px-4 py-2.5 text-[#747783] text-xs line-through">{fmtVal(field, original[field])}</td>
                      <td className="px-4 py-2.5 text-emerald-700 font-semibold text-xs">{fmtVal(field, form[field])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("editing")} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
                Volver a Editar
              </button>
              <button type="button" onClick={handleSubmit} disabled={isPending}
                className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} />
                {isPending ? "Guardando…" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Editing ──────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-[#002869]">Editar Contrato</h2>
            <p className="text-xs text-[#747783] mt-0.5">{p.id_contrato} — todos los cambios quedan auditados</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]"><X size={16} /></button>
        </div>

        <form onSubmit={handleReview} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

            {/* ── Identificación ── */}
            <SectionTitle title="Identificación" />

            <Field label="N° Contrato *">
              <input type="text" value={form.id_contrato} onChange={e => setField("id_contrato", e.target.value)}
                className={inputCls + " h-10"} required />
            </Field>

            <Field label="Clase de Contrato">
              <input type="text" value={form.clase_contrato} onChange={e => setField("clase_contrato", e.target.value)}
                className={inputCls + " h-10"} placeholder="Ej. INTERADMINISTRATIVO" />
            </Field>

            <div className="col-span-2">
              <Field label="Objeto del Contrato">
                <textarea rows={3} value={form.objeto_contrato} onChange={e => setField("objeto_contrato", e.target.value)}
                  className={inputCls + " py-2 resize-none"} placeholder="Descripción del objeto contractual" />
              </Field>
            </div>

            {/* ── Clasificación ── */}
            <SectionTitle title="Clasificación y Actores" />

            <Field label="Categoría">
              <input type="text" value={form.categoria} onChange={e => setField("categoria", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Secretaría">
              <input type="text" value={form.secretaria} onChange={e => setField("secretaria", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Área Responsable">
              <input type="text" value={form.area_responsable} onChange={e => setField("area_responsable", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Supervisor">
              <input type="text" value={form.supervision} onChange={e => setField("supervision", e.target.value)}
                className={inputCls + " h-10"} placeholder="Nombre del supervisor" />
            </Field>

            <Field label="Modalidad de Selección">
              <input type="text" value={form.modalidad_seleccion} onChange={e => setField("modalidad_seleccion", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            {/* ── Estado ── */}
            <SectionTitle title="Estado del Contrato" />

            <Field label="Estado *">
              <select value={form.estado} onChange={e => setField("estado", e.target.value as EstadoInteradministrativo)}
                className={inputCls + " h-10 appearance-none"}>
                {ESTADO_ORDER.map(s => (
                  <option key={s} value={s}>{ESTADO_CONFIG[s].label}</option>
                ))}
              </select>
            </Field>

            <Field label="Avance Físico (%)">
              <div className="space-y-1.5">
                <div className="relative">
                  <input type="number" min={0} max={100} step={0.1} value={form.avance_fisico_pct}
                    onChange={e => setField("avance_fisico_pct", e.target.value)}
                    className={inputCls + " h-10 pr-8"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#747783]">%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                  <div className="h-full bg-[#0B3D91] rounded-full transition-all" style={{ width: `${avFis}%` }} />
                </div>
              </div>
            </Field>

            {/* ── Fechas ── */}
            <SectionTitle title="Fechas y Plazos" />

            <Field label="Fecha de Suscripción">
              <input type="date" value={form.fecha_suscripcion} onChange={e => setField("fecha_suscripcion", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Fecha de Inicio">
              <input type="date" value={form.fecha_inicio_ejecucion} onChange={e => setField("fecha_inicio_ejecucion", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Fecha de Terminación Inicial">
              <input type="date" value={form.fecha_terminacion} onChange={e => setField("fecha_terminacion", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Plazo de Ejecución">
              <input type="text" value={form.plazo_ejecucion_inicial} onChange={e => setField("plazo_ejecucion_inicial", e.target.value)}
                className={inputCls + " h-10"} placeholder="Ej. 12 meses" />
            </Field>

            {/* ── Financiero ── */}
            <SectionTitle title="Información Financiera" />

            <Field label="Valor Inicial (Bienes y Servicios)">
              <input type="number" min={0} step="any" value={form.valor_inicial} onChange={e => setField("valor_inicial", e.target.value)}
                className={inputCls + " h-10"} placeholder="0" />
            </Field>

            <Field label="Valor Cuota de Gerencia">
              <input type="number" min={0} step="any" value={form.cuota_admin_inicial} onChange={e => setField("cuota_admin_inicial", e.target.value)}
                className={inputCls + " h-10"} placeholder="0" />
            </Field>

            <Field label="Valor Total del Contrato">
              <input type="number" min={0} step="any" value={form.total_contrato} onChange={e => setField("total_contrato", e.target.value)}
                className={inputCls + " h-10"} placeholder="0" />
            </Field>

            <Field label="% Cuota de Gerencia">
              <div className="relative">
                <input type="number" min={0} max={100} step={0.01} value={form.pct_cuota_gerencia}
                  onChange={e => setField("pct_cuota_gerencia", e.target.value)}
                  className={inputCls + " h-10 pr-8"} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#747783]">%</span>
              </div>
            </Field>

            {finError && (
              <div className="col-span-2 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-semibold">{finError}</p>
              </div>
            )}

            {/* ── Links ── */}
            <SectionTitle title="Documentación y Referencias" />

            <Field label="Enlace SECOP II">
              <input type="url" value={form.link_secop} onChange={e => setField("link_secop", e.target.value)}
                className={inputCls + " h-10"} placeholder="https://www.secop.gov.co/…" />
            </Field>

            <Field label="Enlace Documentación">
              <input type="url" value={form.link_documentacion} onChange={e => setField("link_documentacion", e.target.value)}
                className={inputCls + " h-10"} placeholder="https://drive.google.com/…" />
            </Field>

            {/* ── Observaciones ── */}
            <SectionTitle title="Observaciones" />

            <div className="col-span-2">
              <Field label="Observaciones Generales">
                <textarea rows={3} value={form.observaciones} onChange={e => setField("observaciones", e.target.value)}
                  className={inputCls + " py-2 resize-none"} placeholder="Notas, alertas o comentarios del contrato…" />
              </Field>
            </div>

          </div>

          {/* Diff badge */}
          {diff.length > 0 && (
            <div className="mt-5 flex items-center gap-2 px-3 py-2 bg-[#f0f3ff] border border-[#0B3D91]/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#0B3D91]" />
              <p className="text-xs font-semibold text-[#0B3D91]">
                {diff.length} cambio{diff.length > 1 ? "s" : ""} detectado{diff.length > 1 ? "s" : ""}:&nbsp;
                {diff.map(f => FIELD_LABELS[f] ?? f).join(", ")}
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 mt-5">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
              Cancelar
            </button>
            <button type="submit" disabled={diff.length === 0 || !!finError}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-50">
              Revisar Cambios →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
