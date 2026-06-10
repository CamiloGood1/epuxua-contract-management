"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Save, Loader2, Check, AlertCircle, Hash, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createFuncionamientoContract } from "@/services/projects.actions"

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
    <div className="flex items-center gap-2 pt-5 pb-2 border-b border-border">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={12} className="text-primary" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
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

export function NewFuncionamientoContractModal({ open, onClose }: Props) {
  const router = useRouter()
  const [form, setForm]       = useState<FormState>({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY })
      setError(null)
      setSuccess(false)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError(null)
  }

  function validate(): string | null {
    if (!form.proyecto_ref.trim()) return "La referencia del contrato es obligatoria"
    if (!form.origen_hoja.trim()) return "El origen / hoja es obligatorio"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError(null)

    const { error: serverError } = await createFuncionamientoContract({
      proyecto_ref: form.proyecto_ref,
      origen_hoja:  form.origen_hoja,
    })
    if (serverError) { setError(serverError); setLoading(false); return }

    setSuccess(true); setLoading(false)
    setTimeout(() => { onClose(); router.refresh() }, 1000)
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
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Nuevo contrato de funcionamiento</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registra la referencia del contrato en la tabla <code className="font-mono">contratos</code>
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
              <Section icon={Hash} label="Identificación" />
              <div className="pt-3">
                <Label required>Referencia del contrato (proyecto_ref)</Label>
                <input
                  className={inputCls}
                  placeholder="Ej: OPS-001-2024, CPS-123-2025…"
                  value={form.proyecto_ref}
                  onChange={(e) => set("proyecto_ref", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  N° o ID único del contrato tal como aparece en la hoja de cálculo origen.
                </p>
              </div>

              <Section icon={FileText} label="Origen" />
              <div className="pt-3">
                <Label required>Hoja de origen (origen_hoja)</Label>
                <input
                  className={inputCls}
                  placeholder={`Contratación_${currentYear}`}
                  value={form.origen_hoja}
                  onChange={(e) => set("origen_hoja", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Nombre de la hoja o archivo fuente, ej: <code className="font-mono">Contratación_2024</code>
                </p>
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
