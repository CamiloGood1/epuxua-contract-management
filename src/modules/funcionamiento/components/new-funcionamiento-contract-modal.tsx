"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Save, Loader2, Check, AlertCircle,
  Hash, FileText, User, DollarSign, CalendarRange, Building2, PlusCircle, Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createFuncionamientoContract,
  createFuncionamientoProject,
  type NewFuncionamientoContractInput,
} from "@/services/projects.actions"
import type { ProjectDetail } from "@/types/project"

const inputCls = "w-full h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all"
const selectCls = `${inputCls} appearance-none cursor-pointer`
const textareaCls = `${inputCls} h-auto py-2 resize-none`

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

function Section({ icon: Icon, label }: { icon: typeof Hash; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-5 pb-2 border-b border-border">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={12} className="text-primary" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

const currentYear = new Date().getFullYear()
const CONTRACT_CLASSES = [
  "Prestación de servicios profesionales",
  "Prestación de servicios de apoyo a la gestión",
  "Apoyo administrativo",
  "Apoyo jurídico",
  "Apoyo contable y financiero",
  "Apoyo técnico",
  "Supervisión",
  "Interventoría",
  "Consultoría",
  "Otro",
]

const MODALITIES = [
  { value: "CONTRATACION_DIRECTA", label: "Contratación directa" },
  { value: "INVITACION_ABIERTA", label: "Invitación abierta" },
  { value: "INVITACION_PRESELECCIONADOS", label: "Invitación preseleccionados" },
  { value: "CONCURSO_MERITOS", label: "Concurso de méritos" },
  { value: "ORDEN_COMPRA", label: "Orden de compra" },
  { value: "ACUERDO_MARCO", label: "Acuerdo marco" },
]

const STATUSES = [
  { value: "EN_EJECUCION", label: "En ejecución" },
  { value: "SUSPENDIDO", label: "Suspendido" },
  { value: "TERMINADO", label: "Terminado" },
  { value: "LIQUIDADO", label: "Liquidado" },
]

type FormState = Omit<NewFuncionamientoContractInput, "project_id">

const EMPTY: FormState = {
  contract_number: "",
  year: currentYear,
  contract_type: "DIRECTO",
  contract_class: "Prestación de servicios profesionales",
  selection_modality: "CONTRATACION_DIRECTA",
  resource_type: "",
  object: "",
  contractor_name: "",
  contractor_document: "",
  contractor_person_type: "NATURAL",
  supervisor_name: "",
  area_name: "",
  interventor: "",
  status: "EN_EJECUCION",
  subscription_date: new Date().toISOString().split("T")[0],
  publication_date: "",
  start_date: "",
  end_date: "",
  initial_term_text: "",
  initial_term_days: undefined,
  initial_value: 0,
  monthly_value: undefined,
  paa_code: "",
  paa_description: "",
  paa_estimated_value: undefined,
  secop_url: "",
  observations: "",
}

interface Props {
  open: boolean
  onClose: () => void
  project?: ProjectDetail
  availableProjects?: ProjectDetail[]
}

export function NewFuncionamientoContractModal({ open, onClose, project, availableProjects }: Props) {
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = useState(project?.id ?? "")
  const [selectedYear, setSelectedYear] = useState(project?.year ?? currentYear)
  const [creatingProject, setCreatingProject] = useState(false)
  const [resolvedProjectId, setResolvedProjectId] = useState(project?.id ?? "")

  const [form, setForm] = useState<FormState>({ ...EMPTY, year: project?.year ?? currentYear })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedProjectId(project?.id ?? "")
      setResolvedProjectId(project?.id ?? "")
      setSelectedYear(project?.year ?? currentYear)
      setForm({ ...EMPTY, year: project?.year ?? currentYear })
      setError(null)
      setSuccess(false)
    }
  }, [open, project])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  async function handleEnsureProject() {
    setCreatingProject(true)
    setError(null)
    const { error: err, projectId } = await createFuncionamientoProject(selectedYear)
    if (err && !projectId) { setError(err); setCreatingProject(false); return }
    if (projectId) setResolvedProjectId(projectId)
    setCreatingProject(false)
  }

  function validate(): string | null {
    if (!resolvedProjectId) return "Selecciona o crea un año de funcionamiento"
    if (!form.contract_number.trim()) return "El número de contrato es obligatorio"
    if (!form.object.trim()) return "El objeto del contrato es obligatorio"
    if (!form.contractor_name.trim()) return "El nombre del contratista es obligatorio"
    if (Number(form.initial_value) <= 0) return "El valor inicial debe ser mayor a 0"
    if (!form.subscription_date) return "La fecha de suscripción es obligatoria"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError(null)

    const { error: serverError } = await createFuncionamientoContract({
      ...form,
      project_id: resolvedProjectId,
    })
    if (serverError) { setError(serverError); setLoading(false); return }

    setSuccess(true); setLoading(false)
    setTimeout(() => { onClose(); router.refresh() }, 1000)
  }

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Nuevo contrato de funcionamiento</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Campos con <span className="text-destructive">*</span> son obligatorios
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* Año / Proyecto contenedor */}
              <Section icon={Hash} label="Año de funcionamiento" />
              {project ? (
                <div className="pt-3 px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-200">
                  <p className="text-xs font-bold text-teal-700">{project.project_code}</p>
                  <p className="text-[10px] text-teal-600">{project.name}</p>
                </div>
              ) : (
                <div className="pt-3 space-y-2">
                  {availableProjects && availableProjects.length > 0 && (
                    <div>
                      <Label>Año existente</Label>
                      <select
                        className={selectCls}
                        value={selectedProjectId}
                        onChange={(e) => { setSelectedProjectId(e.target.value); setResolvedProjectId(e.target.value) }}
                      >
                        <option value="">Seleccionar año…</option>
                        {availableProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.project_code} — {p.year}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Crear para año</Label>
                      <select
                        className={selectCls}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                      >
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleEnsureProject}
                      disabled={creatingProject || !!resolvedProjectId}
                      className="h-9 px-3 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {creatingProject ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                      {creatingProject ? "Creando…" : "Crear año"}
                    </button>
                  </div>
                  {resolvedProjectId && (
                    <div className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-700">
                      Año de funcionamiento listo ✓
                    </div>
                  )}
                </div>
              )}

              {/* Identificación */}
              <Section icon={Hash} label="Identificación" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>N° de contrato</Label>
                  <input className={inputCls} placeholder="FUNC-001-2026"
                    value={form.contract_number}
                    onChange={(e) => set("contract_number", e.target.value)} />
                </div>
                <div>
                  <Label required>Año</Label>
                  <input type="number" className={inputCls} min={2020} max={2099}
                    value={form.year}
                    onChange={(e) => set("year", Number(e.target.value))} />
                </div>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <div>
                  <Label>Modalidad de selección</Label>
                  <select className={selectCls} value={form.selection_modality}
                    onChange={(e) => set("selection_modality", e.target.value)}>
                    {MODALITIES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <select className={selectCls} value={form.status}
                    onChange={(e) => set("status", e.target.value)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Objeto */}
              <Section icon={FileText} label="Objeto del contrato" />
              <div className="pt-3">
                <Label>Clase de contrato</Label>
                <select className={selectCls} value={form.contract_class}
                  onChange={(e) => set("contract_class", e.target.value)}>
                  {CONTRACT_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pt-1">
                <Label required>Objeto</Label>
                <textarea rows={3} className={textareaCls}
                  placeholder="Describe el objeto y alcance del contrato"
                  value={form.object}
                  onChange={(e) => set("object", e.target.value)} />
              </div>

              {/* Contratista */}
              <Section icon={User} label="Contratista" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Nombre completo / Razón social</Label>
                  <input className={inputCls} placeholder="Nombre del contratista"
                    value={form.contractor_name}
                    onChange={(e) => set("contractor_name", e.target.value)} />
                </div>
                <div>
                  <Label>Documento (CC / NIT)</Label>
                  <input className={inputCls} placeholder="1234567890"
                    value={form.contractor_document}
                    onChange={(e) => set("contractor_document", e.target.value)} />
                </div>
              </div>
              <div className="pt-1">
                <Label>Tipo de persona</Label>
                <select className={selectCls} value={form.contractor_person_type}
                  onChange={(e) => set("contractor_person_type", e.target.value as "NATURAL" | "JURIDICA")}>
                  <option value="NATURAL">Natural</option>
                  <option value="JURIDICA">Jurídica</option>
                </select>
              </div>

              {/* Responsables */}
              <Section icon={Building2} label="Responsables" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Supervisor</Label>
                  <input className={inputCls} placeholder="Nombre del supervisor"
                    value={form.supervisor_name}
                    onChange={(e) => set("supervisor_name", e.target.value)} />
                </div>
                <div>
                  <Label>Área responsable</Label>
                  <input className={inputCls} placeholder="Dirección / Subgerencia"
                    value={form.area_name}
                    onChange={(e) => set("area_name", e.target.value)} />
                </div>
              </div>
              <div className="pt-1">
                <Label>Interventor</Label>
                <input className={inputCls} placeholder="Nombre del interventor (si aplica)"
                  value={form.interventor}
                  onChange={(e) => set("interventor", e.target.value)} />
              </div>

              {/* Valores */}
              <Section icon={DollarSign} label="Información financiera" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Valor inicial (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.initial_value || ""}
                    onChange={(e) => set("initial_value", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Valor mensual (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.monthly_value ?? ""}
                    onChange={(e) => set("monthly_value", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>

              {/* PAA */}
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Código PAA</Label>
                  <input className={inputCls} placeholder="PAA-001"
                    value={form.paa_code}
                    onChange={(e) => set("paa_code", e.target.value)} />
                </div>
                <div>
                  <Label>Valor estimado PAA (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.paa_estimated_value ?? ""}
                    onChange={(e) => set("paa_estimated_value", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
              <div className="pt-1">
                <Label>Descripción PAA</Label>
                <input className={inputCls} placeholder="Descripción en el plan de adquisiciones"
                  value={form.paa_description}
                  onChange={(e) => set("paa_description", e.target.value)} />
              </div>

              {/* Fechas */}
              <Section icon={CalendarRange} label="Fechas" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Fecha de suscripción</Label>
                  <input type="date" className={inputCls}
                    value={form.subscription_date}
                    onChange={(e) => set("subscription_date", e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de publicación</Label>
                  <input type="date" className={inputCls}
                    value={form.publication_date}
                    onChange={(e) => set("publication_date", e.target.value)} />
                </div>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha de inicio</Label>
                  <input type="date" className={inputCls}
                    value={form.start_date}
                    onChange={(e) => set("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de terminación</Label>
                  <input type="date" className={inputCls}
                    value={form.end_date}
                    onChange={(e) => set("end_date", e.target.value)} />
                </div>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <div>
                  <Label>Plazo (texto)</Label>
                  <input className={inputCls} placeholder="Ej: 6 meses"
                    value={form.initial_term_text}
                    onChange={(e) => set("initial_term_text", e.target.value)} />
                </div>
                <div>
                  <Label>Duración (días)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="180"
                    value={form.initial_term_days ?? ""}
                    onChange={(e) => set("initial_term_days", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>

              {/* Externos */}
              <Section icon={Link2} label="Información adicional" />
              <div className="pt-3">
                <Label>URL SECOP II</Label>
                <input type="url" className={inputCls} placeholder="https://www.secop.gov.co/..."
                  value={form.secop_url}
                  onChange={(e) => set("secop_url", e.target.value)} />
              </div>
              <div className="pt-1">
                <Label>Observaciones</Label>
                <textarea rows={3} className={textareaCls}
                  placeholder="Observaciones generales del contrato"
                  value={form.observations}
                  onChange={(e) => set("observations", e.target.value)} />
              </div>

              <div className="h-4" />
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border space-y-3">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                  <AlertCircle size={15} /><span>{error}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" onClick={handleSubmit} disabled={loading || success}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                    success ? "bg-emerald-500 text-white"
                    : "bg-teal-600 text-white hover:opacity-90 shadow-sm disabled:opacity-60"
                  )}>
                  {loading ? <><Loader2 size={15} className="animate-spin" />Guardando…</>
                  : success ? <><Check size={15} />Creado</>
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
