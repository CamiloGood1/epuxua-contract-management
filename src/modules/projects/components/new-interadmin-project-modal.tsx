"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Loader2, Check, AlertCircle, Hash, FileText, Building2, CalendarRange, DollarSign } from "lucide-react"
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

const EMPTY: NewInteradminProjectInput = {
  id_contrato:             "",
  secretaria:              "",
  objeto_contrato:         "",
  clase_contrato:          "",
  area_responsable:        "",
  supervision:             "",
  modalidad_seleccion:     "",
  plazo_ejecucion_inicial: "",
  fecha_suscripcion:       new Date().toISOString().split("T")[0],
  fecha_inicio_ejecucion:  "",
  fecha_terminacion:       "",
  valor_inicial:           0,
  total_contrato:          0,
  cuota_admin_inicial:     undefined,
  bolsa_gerencia_inicial:  undefined,
  observaciones:           "",
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NewInteradminProjectModal({ open, onClose }: Props) {
  const router = useRouter()
  const [form, setForm]       = useState<NewInteradminProjectInput>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
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
    if (!form.id_contrato.trim()) return "El número de contrato (id_contrato) es obligatorio"
    if (!form.secretaria?.trim()) return "La secretaría es obligatoria"
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
                <h2 className="text-base font-bold text-foreground">Nuevo Contrato Interadministrativo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Se registra en la tabla <code className="font-mono">interadministrativos</code></p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              <Section icon={Hash} label="Identificación" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label required>N° contrato (id_contrato)</Label>
                  <input className={inputCls} placeholder="3407-2026"
                    value={form.id_contrato}
                    onChange={(e) => set("id_contrato", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Identificador único, ej: 3407-2021</p>
                </div>
              </div>
              <div className="pt-1">
                <Label>Modalidad de selección</Label>
                <input className={inputCls} placeholder="Contratación directa, Invitación abierta…"
                  value={form.modalidad_seleccion}
                  onChange={(e) => set("modalidad_seleccion", e.target.value)} />
              </div>
              <div className="pt-1">
                <Label>Clase de contrato</Label>
                <input className={inputCls} placeholder="Contrato interadministrativo, Convenio…"
                  value={form.clase_contrato}
                  onChange={(e) => set("clase_contrato", e.target.value)} />
              </div>

              <Section icon={FileText} label="Objeto" />
              <div className="pt-3">
                <Label>Objeto del contrato</Label>
                <textarea rows={3} className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Objeto y alcance del contrato interadministrativo"
                  value={form.objeto_contrato}
                  onChange={(e) => set("objeto_contrato", e.target.value)} />
              </div>

              <Section icon={Building2} label="Partes y responsables" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Secretaría / Entidad</Label>
                  <input className={inputCls} placeholder="Secretaría de…"
                    value={form.secretaria}
                    onChange={(e) => set("secretaria", e.target.value)} />
                </div>
                <div>
                  <Label>Área responsable</Label>
                  <input className={inputCls} placeholder="Dirección / Subgerencia"
                    value={form.area_responsable}
                    onChange={(e) => set("area_responsable", e.target.value)} />
                </div>
              </div>
              <div className="pt-1">
                <Label>Supervisión</Label>
                <input className={inputCls} placeholder="Nombre(s) del supervisor — separados por /"
                  value={form.supervision}
                  onChange={(e) => set("supervision", e.target.value)} />
              </div>

              <Section icon={DollarSign} label="Valores" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor inicial (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.valor_inicial || ""}
                    onChange={(e) => set("valor_inicial", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Valor total contrato (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.total_contrato || ""}
                    onChange={(e) => set("total_contrato", Number(e.target.value))} />
                </div>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <div>
                  <Label>Cuota admin. inicial (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.cuota_admin_inicial ?? ""}
                    onChange={(e) => set("cuota_admin_inicial", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div>
                  <Label>Bolsa gerencia inicial (COP)</Label>
                  <input type="number" min={0} className={inputCls} placeholder="0"
                    value={form.bolsa_gerencia_inicial ?? ""}
                    onChange={(e) => set("bolsa_gerencia_inicial", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>

              <Section icon={CalendarRange} label="Fechas y plazo" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Suscripción</Label>
                  <input type="date" className={inputCls}
                    value={form.fecha_suscripcion}
                    onChange={(e) => set("fecha_suscripcion", e.target.value)} />
                </div>
                <div>
                  <Label>Inicio ejecución</Label>
                  <input type="date" className={inputCls}
                    value={form.fecha_inicio_ejecucion}
                    onChange={(e) => set("fecha_inicio_ejecucion", e.target.value)} />
                </div>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <div>
                  <Label>Terminación</Label>
                  <input type="date" className={inputCls}
                    value={form.fecha_terminacion}
                    onChange={(e) => set("fecha_terminacion", e.target.value)} />
                </div>
                <div>
                  <Label>Plazo inicial (texto)</Label>
                  <input className={inputCls} placeholder="Ej: 12 meses"
                    value={form.plazo_ejecucion_inicial}
                    onChange={(e) => set("plazo_ejecucion_inicial", e.target.value)} />
                </div>
              </div>

              <div className="pt-3">
                <Label>Observaciones</Label>
                <textarea rows={2} className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Observaciones generales"
                  value={form.observaciones}
                  onChange={(e) => set("observaciones", e.target.value)} />
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
                  {loading  ? <><Loader2 size={15} className="animate-spin" />Guardando…</>
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
