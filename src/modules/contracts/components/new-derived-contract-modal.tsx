"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Loader2, Check, AlertCircle, Hash, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { createDerivedContract } from "@/services/projects.actions"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

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

interface InteradminOption {
  id: number
  id_contrato: string
  objeto_contrato: string | null
  secretaria: string | null
}

const currentYear = new Date().getFullYear()

interface FormState {
  proyecto_ref: string
  origen_hoja: string
}

const EMPTY: FormState = {
  proyecto_ref: "",
  origen_hoja: `Contratación_${currentYear}`,
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NewDerivedContractModal({ open, onClose }: Props) {
  const router = useRouter()
  const [form, setForm]                       = useState<FormState>(EMPTY)
  const [selectedInteradmin, setSelectedInteradmin] = useState<InteradminOption | null>(null)
  const [interadmins, setInteradmins]         = useState<InteradminOption[]>([])
  const [searchQ, setSearchQ]                 = useState("")
  const [loadingList, setLoadingList]         = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [success, setSuccess]                 = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setSelectedInteradmin(null)
      setSearchQ("")
      setError(null)
      setSuccess(false)
      loadInteradmins()
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  async function loadInteradmins() {
    setLoadingList(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from("interadministrativos")
        .select("id, id_contrato, objeto_contrato, secretaria")
        .eq("estado", "EN EJECUCIÓN")
        .order("id_contrato", { ascending: false })
        .limit(200)
      setInteradmins((data ?? []) as InteradminOption[])
    } catch {
      // silently fail
    } finally {
      setLoadingList(false)
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  function validate(): string | null {
    if (!selectedInteradmin) return "Selecciona un contrato interadministrativo padre"
    if (!form.proyecto_ref.trim()) return "La referencia del contrato derivado es obligatoria"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError(null)

    const { error: serverError } = await createDerivedContract({
      id_interadministrativo: selectedInteradmin!.id_contrato,
      proyecto_ref:           form.proyecto_ref,
      origen_hoja:            form.origen_hoja,
    })
    if (serverError) { setError(serverError); setLoading(false); return }

    setSuccess(true); setLoading(false)
    setTimeout(() => { onClose(); router.refresh() }, 1000)
  }

  const filtered = interadmins.filter(
    (p) =>
      p.id_contrato.toLowerCase().includes(searchQ.toLowerCase()) ||
      (p.objeto_contrato ?? "").toLowerCase().includes(searchQ.toLowerCase()) ||
      (p.secretaria ?? "").toLowerCase().includes(searchQ.toLowerCase())
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
                <p className="text-xs text-muted-foreground mt-0.5">Vinculado a un contrato interadministrativo</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* Selección de interadministrativo padre */}
              <Section icon={Search} label="Contrato interadministrativo padre" />
              <div className="pt-3">
                <Label required>Buscar interadministrativo (EN EJECUCIÓN)</Label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={`${inputCls} pl-8`}
                    placeholder="Buscar por N° contrato, objeto, secretaría…"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {loadingList ? (
                    <p className="text-xs text-center py-4 text-muted-foreground">Cargando…</p>
                  ) : filtered.length === 0 ? (
                    <p className="text-xs text-center py-4 text-muted-foreground">Sin resultados</p>
                  ) : (
                    filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedInteradmin(p); setSearchQ(p.id_contrato) }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors",
                          selectedInteradmin?.id === p.id && "bg-[var(--corporate-blue)]/10"
                        )}
                      >
                        <p className="text-xs font-semibold text-[var(--corporate-blue)]">{p.id_contrato}</p>
                        {p.objeto_contrato && (
                          <p className="text-[10px] text-muted-foreground truncate">{p.objeto_contrato}</p>
                        )}
                        {p.secretaria && (
                          <p className="text-[10px] text-muted-foreground/70">{p.secretaria}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
                {selectedInteradmin && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--corporate-blue)]/10 text-xs">
                    Padre seleccionado: <span className="font-semibold text-[var(--corporate-blue)]">{selectedInteradmin.id_contrato}</span>
                  </div>
                )}
              </div>

              {/* Identificación del derivado */}
              <Section icon={Hash} label="Identificación del derivado" />
              <div className="pt-3">
                <Label required>Referencia del contrato derivado (proyecto_ref)</Label>
                <input className={inputCls} placeholder="CPS-001-2026, OPS-123-2025…"
                  value={form.proyecto_ref}
                  onChange={(e) => set("proyecto_ref", e.target.value)} />
              </div>
              <div className="pt-1">
                <Label>Origen / Hoja (origen_hoja)</Label>
                <input className={inputCls} placeholder={`Contratación_${currentYear}`}
                  value={form.origen_hoja}
                  onChange={(e) => set("origen_hoja", e.target.value)} />
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
