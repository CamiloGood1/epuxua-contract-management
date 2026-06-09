"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Loader2, Check, AlertCircle, Hash, FileText, User, DollarSign, CalendarRange, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createFuncionamientoContract,
  createFuncionamientoProject,
  type NewFuncionamientoContractInput,
} from "@/services/projects.actions"
import type { ProjectDetail } from "@/types/project"

const inputCls = "w-full h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all"

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
    <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={12} className="text-primary" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

const currentYear = new Date().getFullYear()

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

  const [form, setForm] = useState<Omit<NewFuncionamientoContractInput, "project_id">>({
    contract_number: "",
    object: "",
    contractor_name: "",
    supervisor_name: "",
    subscription_date: new Date().toISOString().split("T")[0],
    start_date: "",
    end_date: "",
    initial_value: 0,
    year: project?.year ?? currentYear,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedProjectId(project?.id ?? "")
      setResolvedProjectId(project?.id ?? "")
      setSelectedYear(project?.year ?? currentYear)
      setForm({
        contract_number: "",
        object: "",
        contractor_name: "",
        supervisor_name: "",
        subscription_date: new Date().toISOString().split("T")[0],
        start_date: "",
        end_date: "",
        initial_value: 0,
        year: project?.year ?? currentYear,
      })
      setError(null)
      setSuccess(false)
    }
  }, [open, project])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  async function handleEnsureProject() {
    setCreatingProject(true)
    setError(null)
    const { error: err, projectId } = await createFuncionamientoProject(selectedYear)
    if (err && !projectId) {
      setError(err)
      setCreatingProject(false)
      return
    }
    if (projectId) setResolvedProjectId(projectId)
    setCreatingProject(false)
  }

  function validate(): string | null {
    if (!resolvedProjectId) return "Selecciona o crea un proyecto contenedor"
    if (!form.contract_number.trim()) return "El número de contrato es obligatorio"
    if (!form.object.trim()) return "El objeto es obligatorio"
    if (!form.contractor_name.trim()) return "El contratista es obligatorio"
    if (Number(form.initial_value) <= 0) return "El valor debe ser mayor a 0"
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
    setTimeout(() => {
      onClose()
      router.refresh()
    }, 1000)
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

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
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Nuevo Contrato de Funcionamiento</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Apoyo contratado con recursos propios EPUXUA</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* Proyecto contenedor */}
              <Section icon={Hash} label="Proyecto contenedor" />
              {project ? (
                <div className="pt-3 px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-200">
                  <p className="text-xs font-bold text-teal-700">{project.project_code}</p>
                  <p className="text-[10px] text-teal-600">{project.name}</p>
                </div>
              ) : (
                <div className="pt-3 space-y-2">
                  {availableProjects && availableProjects.length > 0 ? (
                    <div>
                      <Label required>Proyecto FUNCIONAMIENTO</Label>
                      <select
                        className={inputCls}
                        value={selectedProjectId}
                        onChange={(e) => {
                          setSelectedProjectId(e.target.value)
                          setResolvedProjectId(e.target.value)
                        }}
                      >
                        <option value="">Seleccionar…</option>
                        {availableProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.project_code} — {p.year}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>O crear FUNCIONAMIENTO-</Label>
                      <select
                        className={inputCls}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleEnsureProject}
                      disabled={creatingProject || !!resolvedProjectId}
                      className="h-9 px-3 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {creatingProject ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                      {creatingProject ? "Creando…" : "Crear"}
                    </button>
                  </div>
                  {resolvedProjectId && (
                    <div className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-700">
                      Proyecto contenedor listo ✓
                    </div>
                  )}
                </div>
              )}

              <Section icon={Hash} label="Identificación" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>N° contrato</Label>
                  <input className={inputCls} placeholder="FUNC-001-2026"
                    value={form.contract_number} onChange={(e) => setField("contract_number", e.target.value)} />
                </div>
                <div>
                  <Label required>Año</Label>
                  <input type="number" className={inputCls} min={2020} max={2099}
                    value={form.year} onChange={(e) => setField("year", Number(e.target.value))} />
                </div>
              </div>

              <Section icon={FileText} label="Objeto" />
              <div className="pt-3">
                <Label required>Objeto del contrato</Label>
                <textarea rows={3} className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Ej: Apoyo administrativo, Apoyo contable..."
                  value={form.object} onChange={(e) => setField("object", e.target.value)} />
              </div>

              <Section icon={User} label="Partes" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Contratista</Label>
                  <input className={inputCls} placeholder="Nombre de la persona"
                    value={form.contractor_name} onChange={(e) => setField("contractor_name", e.target.value)} />
                </div>
                <div>
                  <Label>Supervisor</Label>
                  <input className={inputCls} placeholder="Nombre del supervisor"
                    value={form.supervisor_name} onChange={(e) => setField("supervisor_name", e.target.value)} />
                </div>
              </div>

              <Section icon={DollarSign} label="Valor" />
              <div className="pt-3">
                <Label required>Valor inicial (COP)</Label>
                <input type="number" min={0} className={inputCls} placeholder="0"
                  value={form.initial_value || ""} onChange={(e) => setField("initial_value", Number(e.target.value))} />
              </div>

              <Section icon={CalendarRange} label="Fechas" />
              <div className="pt-3 grid grid-cols-3 gap-3">
                <div>
                  <Label required>Suscripción</Label>
                  <input type="date" className={inputCls}
                    value={form.subscription_date} onChange={(e) => setField("subscription_date", e.target.value)} />
                </div>
                <div>
                  <Label>Inicio</Label>
                  <input type="date" className={inputCls}
                    value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>Terminación</Label>
                  <input type="date" className={inputCls}
                    value={form.end_date} onChange={(e) => setField("end_date", e.target.value)} />
                </div>
              </div>
              <div className="h-4" />
            </form>

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
