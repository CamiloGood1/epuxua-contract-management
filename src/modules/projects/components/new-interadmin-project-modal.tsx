"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Save, Loader2, Check, AlertCircle,
  Hash, FileText, Building2, CalendarRange,
  DollarSign, Link as LinkIcon, ChevronDown,
} from "lucide-react"
import { createInteradminProject, type NewInteradminProjectInput } from "@/services/projects.actions"
import type { EstadoInteradministrativo } from "@/types/database"

// ── Catálogos ──────────────────────────────────────────────────────────────────

const SECRETARIAS = [
  "Secretaría General",
  "Secretaría de Salud",
  "Secretaría de Educación",
  "Secretaría de Infraestructura",
  "Secretaría de Planeación",
  "Secretaría de Gobierno",
  "Secretaría de Hacienda",
  "Jurídica",
  "Administrativa",
  "Otra",
]

const CATEGORIAS = [
  "Salud", "Educación", "Infraestructura", "Agua Potable",
  "Saneamiento Básico", "Desarrollo Social", "Tecnología",
  "Fortalecimiento Institucional", "Cultura", "Deporte", "Otra",
]

const ESTADOS: { value: EstadoInteradministrativo; label: string }[] = [
  { value: "PLANEACIÓN",                label: "Planeación" },
  { value: "CONTRATACIÓN",              label: "Contratación" },
  { value: "EN EJECUCIÓN",              label: "En Ejecución" },
  { value: "SUSPENDIDO",                label: "Suspendido" },
  { value: "TERMINADO",                 label: "Terminado" },
  { value: "LIQUIDADO",                 label: "Liquidado" },
  { value: "TERMINADO ANTICIPADAMENTE", label: "Terminado Anticipadamente" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcPlazo(inicio: string, fin: string): string {
  if (!inicio || !fin) return ""
  const ms = new Date(fin).getTime() - new Date(inicio).getTime()
  if (ms <= 0) return ""
  const days = Math.floor(ms / 86_400_000)
  const months = Math.round(days / 30.44)
  return months >= 1
    ? `${months} ${months === 1 ? "mes" : "meses"} (${days} días)`
    : `${days} días`
}

function fmtCOP(n: number | undefined): string {
  if (n == null || n === 0) return ""
  return new Intl.NumberFormat("es-CO").format(n)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const BASE_INPUT =
  "w-full h-9 rounded-lg border border-[#EAEAEA] bg-white px-3 text-sm text-[#151c27] " +
  "placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 " +
  "focus:border-[#0B3D91] transition-all"

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-[#434652] mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-[10px] text-red-500">{msg}</p>
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Hash; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-5 pb-2 border-b border-[#EAEAEA]">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#f0f3ff]">
        <Icon size={12} className="text-[#0B3D91]" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#747783]">{label}</span>
    </div>
  )
}

function SelectField({
  value, onChange, options, placeholder, required,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[] | string[]
  placeholder?: string
  required?: boolean
}) {
  const opts = (options as (string | { value: string; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  )
  return (
    <div className="relative">
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${BASE_INPUT} pr-8 appearance-none cursor-pointer`}
      >
        <option value="">{placeholder ?? "Seleccionar…"}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747783] pointer-events-none" />
    </div>
  )
}

function CopInput({
  value, onChange, placeholder,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw]         = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = e.target.value.replace(/[^0-9]/g, "")
    setRaw(clean)
    onChange(clean ? parseInt(clean, 10) : undefined)
  }

  const display = focused ? raw : fmtCOP(value)

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#747783]">$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder ?? "0"}
        className={`${BASE_INPUT} pl-6`}
        value={display}
        onChange={handleChange}
        onFocus={() => { setFocused(true); setRaw(value != null ? String(value) : "") }}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

type FormData = NewInteradminProjectInput & { _plazoCalc: string }
type FormErrors = Partial<Record<keyof FormData, string>>

const EMPTY: FormData = {
  id_contrato:             "",
  estado:                  "EN EJECUCIÓN",
  objeto_contrato:         "",
  categoria:               "",
  secretaria:              "",
  area_responsable:        "",
  supervision:             "",
  fecha_suscripcion:       new Date().toISOString().split("T")[0],
  fecha_inicio_ejecucion:  "",
  fecha_terminacion:       "",
  plazo_ejecucion_inicial: "",
  _plazoCalc:              "",
  pct_cuota_gerencia:      undefined,
  valor_inicial:           undefined,
  cuota_admin_inicial:     undefined,
  total_contrato:          undefined,
  link_secop:              "",
  link_documentacion:      "",
  clase_contrato:          "",
  modalidad_seleccion:     "",
  observaciones:           "",
}

interface Props {
  open: boolean
  onClose: () => void
  isAdmin?: boolean
}

// ── Componente principal ───────────────────────────────────────────────────────

export function NewInteradminProjectModal({ open, onClose, isAdmin = false }: Props) {
  const router = useRouter()
  const [form, setForm]           = useState<FormData>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [loading, setLoading]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  useEffect(() => {
    if (open) { setForm(EMPTY); setFieldErrors({}); setServerError(null); setSuccess(false) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const set = useCallback(<K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v }

      // Auto-calcular plazo desde fechas
      if (k === "fecha_inicio_ejecucion" || k === "fecha_terminacion") {
        const ini = k === "fecha_inicio_ejecucion" ? String(v) : prev.fecha_inicio_ejecucion
        const fin = k === "fecha_terminacion"       ? String(v) : prev.fecha_terminacion
        const plazo = calcPlazo(ini, fin)
        next._plazoCalc = plazo
        if (!isAdmin) next.plazo_ejecucion_inicial = plazo
      }

      // Auto-calcular cuota desde % + bienes
      if (k === "pct_cuota_gerencia" || k === "valor_inicial") {
        const pct    = Number(k === "pct_cuota_gerencia" ? v : prev.pct_cuota_gerencia ?? 0)
        const bienes = Number(k === "valor_inicial"      ? v : prev.valor_inicial      ?? 0)
        if (pct > 0 && bienes > 0) next.cuota_admin_inicial = Math.round(bienes * pct / 100)
      }

      // Auto-calcular total = bienes + cuota
      if (["valor_inicial","cuota_admin_inicial","pct_cuota_gerencia"].includes(k as string)) {
        const b = Number(next.valor_inicial ?? 0)
        const c = Number(next.cuota_admin_inicial ?? 0)
        if (b > 0 || c > 0) next.total_contrato = b + c
      }

      setFieldErrors((e) => ({ ...e, [k]: undefined }))
      setServerError(null)
      return next
    })
  }, [isAdmin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: FormErrors = {}
    if (!form.id_contrato.trim())       errs.id_contrato = "Obligatorio"
    if (!form.objeto_contrato.trim())   errs.objeto_contrato = "Obligatorio"
    else if (form.objeto_contrato.trim().length < 20) errs.objeto_contrato = "Mínimo 20 caracteres"
    if (!form.secretaria)               errs.secretaria = "Obligatorio"
    if (!form.estado)                   errs.estado = "Obligatorio"
    if (!form.fecha_suscripcion)        errs.fecha_suscripcion = "Obligatorio"
    if (!form.fecha_inicio_ejecucion)   errs.fecha_inicio_ejecucion = "Obligatorio"
    if (!form.fecha_terminacion)        errs.fecha_terminacion = "Obligatorio"
    else if (form.fecha_terminacion < form.fecha_inicio_ejecucion)
      errs.fecha_terminacion = "No puede ser anterior al inicio"
    if (form.pct_cuota_gerencia != null &&
      (form.pct_cuota_gerencia < 0 || form.pct_cuota_gerencia > 100))
      errs.pct_cuota_gerencia = "Entre 0 y 100"
    if (form.total_contrato != null && form.total_contrato <= 0)
      errs.total_contrato = "Debe ser mayor que 0"
    if (form.link_secop) {
      try { new URL(form.link_secop) } catch { errs.link_secop = "URL inválida" }
    }
    if (form.link_documentacion) {
      try { new URL(form.link_documentacion) } catch { errs.link_documentacion = "URL inválida" }
    }
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }

    setLoading(true)
    setServerError(null)

    const { error, projectId } = await createInteradminProject({
      id_contrato:            form.id_contrato,
      estado:                 form.estado,
      objeto_contrato:        form.objeto_contrato,
      categoria:              form.categoria    || undefined,
      secretaria:             form.secretaria,
      area_responsable:       form.area_responsable  || undefined,
      supervision:            form.supervision        || undefined,
      fecha_suscripcion:      form.fecha_suscripcion,
      fecha_inicio_ejecucion: form.fecha_inicio_ejecucion,
      fecha_terminacion:      form.fecha_terminacion,
      plazo_ejecucion_inicial:form.plazo_ejecucion_inicial || undefined,
      pct_cuota_gerencia:     form.pct_cuota_gerencia,
      valor_inicial:          form.valor_inicial,
      cuota_admin_inicial:    form.cuota_admin_inicial,
      total_contrato:         form.total_contrato,
      link_secop:             form.link_secop         || undefined,
      link_documentacion:     form.link_documentacion || undefined,
      clase_contrato:         form.clase_contrato     || undefined,
      modalidad_seleccion:    form.modalidad_seleccion || undefined,
      observaciones:          form.observaciones      || undefined,
    })

    if (error) { setServerError(error); setLoading(false); return }
    setSuccess(true); setLoading(false)
    setTimeout(() => {
      onClose()
      if (projectId) router.push(`/proyectos/${projectId}`)
      else router.refresh()
    }, 900)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl"
            style={{ width: "min(620px,100vw)", borderLeft: "1px solid #EAEAEA" }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]"
              style={{ background: "linear-gradient(135deg,#002869 0%,#0B3D91 100%)" }}>
              <div>
                <h2 className="text-sm font-bold text-white">Nuevo Contrato Interadministrativo</h2>
                <p className="text-[11px] text-white/60 mt-0.5">Todos los campos marcados con * son obligatorios</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form id="iadmin-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2">

              {/* 1 · Identificación */}
              <SectionHeader icon={Hash} label="Identificación" />
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label required>N° Contrato</Label>
                  <input className={BASE_INPUT} placeholder="0499-2024"
                    value={form.id_contrato}
                    onChange={(e) => set("id_contrato", e.target.value)} />
                  <p className="text-[10px] text-[#9ca3af] mt-1">Ej: 1297-2025. Debe ser único.</p>
                  <FieldError msg={fieldErrors.id_contrato} />
                </div>
                <div>
                  <Label required>Estado</Label>
                  <SelectField value={form.estado}
                    onChange={(v) => set("estado", v as EstadoInteradministrativo)}
                    options={ESTADOS} required />
                  <FieldError msg={fieldErrors.estado} />
                </div>
              </div>

              {/* 2 · Objeto & Categoría */}
              <SectionHeader icon={FileText} label="Objeto y Categoría" />
              <div className="pt-4 space-y-3">
                <div>
                  <Label required>Objeto del Contrato</Label>
                  <textarea rows={4}
                    className={`${BASE_INPUT} h-auto py-2 resize-none`}
                    placeholder="Descripción del objeto y alcance (mínimo 20 caracteres)"
                    value={form.objeto_contrato}
                    onChange={(e) => set("objeto_contrato", e.target.value)} />
                  <div className="flex justify-between mt-1">
                    <FieldError msg={fieldErrors.objeto_contrato} />
                    <span className={`text-[10px] ml-auto tabular-nums ${form.objeto_contrato.length < 20 ? "text-amber-500" : "text-emerald-600"}`}>
                      {form.objeto_contrato.length}/20 mín.
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <SelectField value={form.categoria ?? ""}
                    onChange={(v) => set("categoria", v)}
                    options={CATEGORIAS} placeholder="Seleccionar categoría…" />
                </div>
              </div>

              {/* 3 · Responsables */}
              <SectionHeader icon={Building2} label="Secretaría y Responsables" />
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label required>Secretaría / Área</Label>
                  <SelectField value={form.secretaria}
                    onChange={(v) => set("secretaria", v)}
                    options={SECRETARIAS} placeholder="Seleccionar secretaría…" required />
                  <FieldError msg={fieldErrors.secretaria} />
                </div>
                <div>
                  <Label>Área Responsable</Label>
                  <input className={BASE_INPUT} placeholder="Dirección / Subgerencia"
                    value={form.area_responsable ?? ""}
                    onChange={(e) => set("area_responsable", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Supervisión</Label>
                  <input className={BASE_INPUT} placeholder="Nombre(s) del supervisor — separados por /"
                    value={form.supervision ?? ""}
                    onChange={(e) => set("supervision", e.target.value)} />
                </div>
              </div>

              {/* 4 · Fechas & Plazo */}
              <SectionHeader icon={CalendarRange} label="Fechas y Plazo" />
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label required>Fecha de Suscripción</Label>
                  <input type="date" className={BASE_INPUT}
                    value={form.fecha_suscripcion}
                    onChange={(e) => set("fecha_suscripcion", e.target.value)} />
                  <FieldError msg={fieldErrors.fecha_suscripcion} />
                </div>
                <div>
                  <Label required>Fecha de Inicio</Label>
                  <input type="date" className={BASE_INPUT}
                    value={form.fecha_inicio_ejecucion}
                    onChange={(e) => set("fecha_inicio_ejecucion", e.target.value)} />
                  <FieldError msg={fieldErrors.fecha_inicio_ejecucion} />
                </div>
                <div>
                  <Label required>Fecha de Terminación Inicial</Label>
                  <input type="date" className={BASE_INPUT}
                    min={form.fecha_inicio_ejecucion || undefined}
                    value={form.fecha_terminacion}
                    onChange={(e) => set("fecha_terminacion", e.target.value)} />
                  <FieldError msg={fieldErrors.fecha_terminacion} />
                </div>
                <div>
                  <Label>
                    Plazo
                    {form._plazoCalc && (
                      <span className="text-[10px] text-emerald-600 font-normal ml-1">calculado</span>
                    )}
                  </Label>
                  <input
                    className={`${BASE_INPUT} ${!isAdmin ? "bg-[#f8f9fb] text-[#747783] cursor-default" : ""}`}
                    readOnly={!isAdmin}
                    placeholder="Se calcula automáticamente"
                    value={form.plazo_ejecucion_inicial ?? ""}
                    onChange={(e) => isAdmin && set("plazo_ejecucion_inicial", e.target.value)}
                  />
                  {form._plazoCalc && (
                    <p className="text-[10px] text-emerald-600 mt-1">{form._plazoCalc}</p>
                  )}
                </div>
              </div>

              {/* 5 · Valores */}
              <SectionHeader icon={DollarSign} label="Valores del Contrato" />
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>% Cuota de Gerencia</Label>
                  <div className="relative">
                    <input type="number" min={0} max={100} step={0.01}
                      className={`${BASE_INPUT} pr-7`} placeholder="0"
                      value={form.pct_cuota_gerencia ?? ""}
                      onChange={(e) => set("pct_cuota_gerencia", e.target.value ? Number(e.target.value) : undefined)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#747783]">%</span>
                  </div>
                  <FieldError msg={fieldErrors.pct_cuota_gerencia} />
                </div>
                <div />
                <div>
                  <Label required>Valor Bienes y Servicios</Label>
                  <CopInput value={form.valor_inicial}
                    onChange={(v) => set("valor_inicial", v)} />
                  <FieldError msg={fieldErrors.valor_inicial} />
                </div>
                <div>
                  <Label required>
                    Valor Cuota de Gerencia
                    {form.pct_cuota_gerencia != null && form.valor_inicial != null && (
                      <span className="text-[10px] text-emerald-600 font-normal ml-1">auto</span>
                    )}
                  </Label>
                  <CopInput value={form.cuota_admin_inicial}
                    onChange={(v) => set("cuota_admin_inicial", v)} />
                  <FieldError msg={fieldErrors.cuota_admin_inicial} />
                </div>
                <div className="col-span-2">
                  <Label required>
                    Valor Total
                    {form.valor_inicial != null && form.cuota_admin_inicial != null && (
                      <span className="text-[10px] text-emerald-600 font-normal ml-1">bienes + cuota</span>
                    )}
                  </Label>
                  <CopInput value={form.total_contrato}
                    onChange={(v) => set("total_contrato", v)} />
                  <FieldError msg={fieldErrors.total_contrato} />
                </div>
              </div>

              {/* 6 · Documentos */}
              <SectionHeader icon={LinkIcon} label="Documentos y Enlaces" />
              <div className="pt-4 space-y-3">
                <div>
                  <Label>Enlace SECOP II</Label>
                  <div className="flex gap-2">
                    <input type="url" className={`${BASE_INPUT} flex-1`}
                      placeholder="https://www.secop.gov.co/…"
                      value={form.link_secop ?? ""}
                      onChange={(e) => set("link_secop", e.target.value)} />
                    {form.link_secop && (
                      <a href={form.link_secop} target="_blank" rel="noopener noreferrer"
                        className="h-9 px-3 rounded-lg border border-[#EAEAEA] text-xs font-medium text-[#0B3D91] hover:bg-[#f0f3ff] flex items-center gap-1.5 shrink-0">
                        <LinkIcon size={12} />Abrir
                      </a>
                    )}
                  </div>
                  <FieldError msg={fieldErrors.link_secop} />
                </div>
                <div>
                  <Label>Enlace Documentación</Label>
                  <div className="flex gap-2">
                    <input type="url" className={`${BASE_INPUT} flex-1`}
                      placeholder="https://sharepoint.com/…"
                      value={form.link_documentacion ?? ""}
                      onChange={(e) => set("link_documentacion", e.target.value)} />
                    {form.link_documentacion && (
                      <a href={form.link_documentacion} target="_blank" rel="noopener noreferrer"
                        className="h-9 px-3 rounded-lg border border-[#EAEAEA] text-xs font-medium text-[#0B3D91] hover:bg-[#f0f3ff] flex items-center gap-1.5 shrink-0">
                        <LinkIcon size={12} />Abrir
                      </a>
                    )}
                  </div>
                  <FieldError msg={fieldErrors.link_documentacion} />
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <textarea rows={2} className={`${BASE_INPUT} h-auto py-2 resize-none`}
                    placeholder="Observaciones generales"
                    value={form.observaciones ?? ""}
                    onChange={(e) => set("observaciones", e.target.value)} />
                </div>
              </div>
              <div className="h-6" />
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-[#EAEAEA] bg-white space-y-3">
              {serverError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm font-medium text-[#434652] hover:bg-[#f8f9fb] transition-colors">
                  Cancelar
                </button>
                <button form="iadmin-form" type="submit" disabled={loading || success}
                  className="flex-1 h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: success ? "#10B981" : "#0B3D91" }}>
                  {loading  ? <><Loader2 size={15} className="animate-spin" />Guardando…</>
                  : success ? <><Check size={15} />Contrato creado</>
                  : <><Save size={15} />Crear contrato</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
