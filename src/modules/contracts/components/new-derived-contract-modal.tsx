"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Loader2, Check, AlertCircle, Hash, FileText, User, DollarSign, CalendarRange, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { createDerivedContract, type NewDerivedContractInput } from "@/services/projects.actions"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatCOP } from "@/modules/contracts/lib/status"

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

interface ProjectOption {
  id: string
  project_code: string
  name: string
  primary_contract_id: string | null
  primary_contract_number: string | null
}

const currentYear = new Date().getFullYear()

const EMPTY: Omit<NewDerivedContractInput, "project_id" | "parent_contract_id"> = {
  contract_number: "",
  object: "",
  contractor_name: "",
  supervisor_name: "",
  subscription_date: new Date().toISOString().split("T")[0],
  start_date: "",
  end_date: "",
  initial_value: 0,
  year: currentYear,
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NewDerivedContractModal({ open, onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY)
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectSearch, setProjectSearch] = useState("")
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setSelectedProject(null)
      setProjectSearch("")
      setError(null)
      setSuccess(false)
      loadProjects()
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  async function loadProjects() {
    setLoadingProjects(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from("v_project_detail")
        .select("id, project_code, name, primary_contract_id, primary_contract_number")
        .eq("project_type", "INTERADMINISTRATIVO")
        .not("primary_contract_id", "is", null)
        .order("project_code", { ascending: false })
        .limit(100)
      setProjects((data ?? []) as ProjectOption[])
    } catch {
      // silently fail
    } finally {
      setLoadingProjects(false)
    }
  }

  function set<K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  function validate(): string | null {
    if (!selectedProject) return "Selecciona un proyecto interadministrativo"
    if (!selectedProject.primary_contract_id) return "El proyecto no tiene contrato principal"
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

    const { error: serverError } = await createDerivedContract({
      ...form,
      project_id: selectedProject!.id,
      parent_contract_id: selectedProject!.primary_contract_id!,
    })
    if (serverError) { setError(serverError); setLoading(false); return }

    setSuccess(true); setLoading(false)
    setTimeout(() => {
      onClose()
      router.refresh()
    }, 1000)
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.project_code.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
  )

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
                <h2 className="text-base font-bold text-foreground">Nuevo Contrato Derivado</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Vinculado a un proyecto interadministrativo</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* Selección de proyecto */}
              <Section icon={Search} label="Proyecto padre" />
              <div className="pt-3">
                <Label required>Proyecto interadministrativo</Label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={`${inputCls} pl-8`}
                    placeholder="Buscar por código o nombre..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {loadingProjects ? (
                    <p className="text-xs text-center py-4 text-muted-foreground">Cargando…</p>
                  ) : filteredProjects.length === 0 ? (
                    <p className="text-xs text-center py-4 text-muted-foreground">Sin proyectos</p>
                  ) : (
                    filteredProjects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedProject(p); setProjectSearch(p.project_code) }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors",
                          selectedProject?.id === p.id && "bg-[var(--corporate-blue)]/10"
                        )}
                      >
                        <p className="text-xs font-semibold text-[var(--corporate-blue)]">{p.project_code}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Contrato padre: {p.primary_contract_number ?? "—"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                {selectedProject && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--corporate-blue)]/10 text-xs">
                    <span className="font-semibold text-[var(--corporate-blue)]">{selectedProject.project_code}</span>
                    {" — "}Contrato padre: <strong>{selectedProject.primary_contract_number}</strong>
                  </div>
                )}
              </div>

              <Section icon={Hash} label="Identificación" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>N° contrato</Label>
                  <input className={inputCls} placeholder="CPS-001-2026"
                    value={form.contract_number} onChange={(e) => set("contract_number", e.target.value)} />
                </div>
                <div>
                  <Label required>Año</Label>
                  <input type="number" className={inputCls} min={2020} max={2099}
                    value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
                </div>
              </div>

              <Section icon={FileText} label="Objeto" />
              <div className="pt-3">
                <Label required>Objeto del contrato</Label>
                <textarea rows={3} className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Prestación de servicios para..."
                  value={form.object} onChange={(e) => set("object", e.target.value)} />
              </div>

              <Section icon={User} label="Partes" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label required>Contratista</Label>
                  <input className={inputCls} placeholder="Nombre del contratista"
                    value={form.contractor_name} onChange={(e) => set("contractor_name", e.target.value)} />
                </div>
                <div>
                  <Label>Supervisor</Label>
                  <input className={inputCls} placeholder="Nombre del supervisor"
                    value={form.supervisor_name} onChange={(e) => set("supervisor_name", e.target.value)} />
                </div>
              </div>

              <Section icon={DollarSign} label="Valor" />
              <div className="pt-3">
                <Label required>Valor inicial (COP)</Label>
                <input type="number" min={0} className={inputCls} placeholder="0"
                  value={form.initial_value || ""} onChange={(e) => set("initial_value", Number(e.target.value))} />
              </div>

              <Section icon={CalendarRange} label="Fechas" />
              <div className="pt-3 grid grid-cols-3 gap-3">
                <div>
                  <Label required>Suscripción</Label>
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
                  : <><Save size={15} />Crear derivado</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
