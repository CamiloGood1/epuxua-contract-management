"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Loader2, Check, AlertCircle, Hash, FileText, Building2, User, DollarSign, CalendarRange } from "lucide-react"
import { cn } from "@/lib/utils"
import { createInteradminProject, type NewInteradminProjectInput } from "@/services/projects.actions"

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

const EMPTY: NewInteradminProjectInput = {
  project_code: "",
  name: "",
  year: currentYear,
  secretaria: "",
  total_value: 0,
  contract_number: "",
  object: "",
  contractor_name: "",
  supervisor_name: "",
  subscription_date: new Date().toISOString().split("T")[0],
  start_date: "",
  end_date: "",
  initial_value: 0,
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NewInteradminProjectModal({ open, onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<NewInteradminProjectInput>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) { setForm(EMPTY); setError(null); setSuccess(false) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function set<K extends keyof NewInteradminProjectInput>(k: K, v: NewInteradminProjectInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  function validate(): string | null {
    if (!form.project_code.trim()) return "El código del proyecto es obligatorio"
    if (!form.name.trim()) return "El nombre del proyecto es obligatorio"
    if (!form.secretaria.trim()) return "La secretaría es obligatoria"
    if (Number(form.total_value) <= 0) return "El valor total debe ser mayor a 0"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError(null)

    const { error: serverError, projectId } = await createInteradminProject(form)
    if (serverError) { setError(serverError); setLoading(false); return }

    setSuccess(true); setLoading(false)
    setTimeout(() => {
      onClose()
      if (projectId) router.push(`/proyectos/${projectId}`)
      else router.refresh()
    }, 1000)
  }

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
                <h2 className="text-base font-bold text-foreground">Nuevo Proyecto Interadministrativo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Crea el proyecto y su contrato principal</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
              <Section icon={Hash} label="Identificación del proyecto" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Código proyecto</Label>
                  <input className={inputCls} placeholder="3407-2026"
                    value={form.project_code} onChange={(e) => set("project_code", e.target.value)} />
                </div>
                <div>
                  <Label required>Año</Label>
                  <input type="number" className={inputCls} min={2020} max={2099}
                    value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
                </div>
              </div>
              <div className="pt-1">
                <Label required>Nombre del proyecto</Label>
                <input className={inputCls} placeholder="Convenio interadministrativo con..."
                  value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Secretaría / Entidad</Label>
                  <input className={inputCls} placeholder="Secretaría de..."
                    value={form.secretaria} onChange={(e) => set("secretaria", e.target.value)} />
                </div>
                <div>
                  <Label required>Valor total proyecto (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.total_value || ""} onChange={(e) => set("total_value", Number(e.target.value))} />
                </div>
              </div>

              <Section icon={FileText} label="Contrato principal (opcional)" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>N° contrato</Label>
                  <input className={inputCls} placeholder="001-2026"
                    value={form.contract_number} onChange={(e) => set("contract_number", e.target.value)} />
                </div>
                <div>
                  <Label>Valor contrato (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.initial_value || ""} onChange={(e) => set("initial_value", Number(e.target.value))} />
                </div>
              </div>
              <div className="pt-1">
                <Label>Objeto</Label>
                <textarea rows={2} className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Objeto del contrato..."
                  value={form.object} onChange={(e) => set("object", e.target.value)} />
              </div>

              <Section icon={User} label="Partes del contrato" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Entidad contratante</Label>
                  <input className={inputCls} placeholder="Nombre de la entidad"
                    value={form.contractor_name} onChange={(e) => set("contractor_name", e.target.value)} />
                </div>
                <div>
                  <Label>Supervisor</Label>
                  <input className={inputCls} placeholder="Nombre del supervisor"
                    value={form.supervisor_name} onChange={(e) => set("supervisor_name", e.target.value)} />
                </div>
              </div>

              <Section icon={CalendarRange} label="Fechas" />
              <div className="pt-3 grid grid-cols-3 gap-3">
                <div>
                  <Label>Suscripción</Label>
                  <input type="date" className={inputCls}
                    value={form.subscription_date} onChange={(e) => set("subscription_date", e.target.value)} />
                </div>
                <div>
                  <Label>Inicio</Label>
                  <input type="date" className={inputCls}
                    value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>Terminación</Label>
                  <input type="date" className={inputCls}
                    value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
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
                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm disabled:opacity-60"
                  )}>
                  {loading ? <><Loader2 size={15} className="animate-spin" />Guardando…</>
                  : success ? <><Check size={15} />Creado</>
                  : <><Save size={15} />Crear proyecto</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
