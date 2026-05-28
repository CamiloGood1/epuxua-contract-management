"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Save, Loader2, AlertCircle, Check,
  Hash, FileSignature, Building2, User,
  DollarSign, Percent, CalendarRange, ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createContract, type NewContractInput } from "@/services/contracts.actions"
import { STATUS_OPTIONS } from "../lib/status"

// ── Field components ──────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col", className)}>{children}</div>
}

const inputCls = "w-full h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all"
const selectCls = `${inputCls} appearance-none cursor-pointer`

function SectionTitle({ icon: Icon, label }: { icon: typeof Hash; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={12} className="text-primary" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ── Initial form state ────────────────────────────────────────────────────────

const EMPTY: NewContractInput = {
  contract_number:          "",
  contract_name:            "",
  contract_object:          "",
  contracting_entity:       "",
  contractor_entity:        "",
  manager_name:             "",
  supervisor_name:          "",
  status:                   "pending_start",
  initial_value:            0,
  management_fee_percentage: 0,
  start_date:               "",
  end_date:                 "",
  risk_level:               "",
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface NewContractModalProps {
  open: boolean
  onClose: () => void
}

export function NewContractModal({ open, onClose }: NewContractModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<NewContractInput>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Computed previews
  const feeValue = Number(form.initial_value) * (Number(form.management_fee_percentage) / 100)
  const goodsValue = Number(form.initial_value) - feeValue

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setError(null)
      setSuccess(false)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function set(field: keyof NewContractInput, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function validate(): string | null {
    if (!form.contract_number.trim()) return "El número de contrato es obligatorio"
    if (!form.contract_name.trim())   return "El nombre del contrato es obligatorio"
    if (!form.contracting_entity?.trim()) return "La entidad contratante es obligatoria"
    if (Number(form.initial_value) <= 0)  return "El valor inicial debe ser mayor a 0"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    const { error: serverError } = await createContract(form)

    if (serverError) {
      setError(serverError)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      onClose()
      router.refresh()   // recarga datos del Server Component
    }, 1000)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Nuevo contrato</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Los campos con <span className="text-destructive">*</span> son obligatorios
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* ── Identificación ── */}
              <SectionTitle icon={Hash} label="Identificación" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label required>Número de contrato</Label>
                  <input
                    className={inputCls}
                    placeholder="Ej: CT-2025-001"
                    value={form.contract_number}
                    onChange={(e) => set("contract_number", e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Estado inicial</Label>
                  <select
                    className={selectCls}
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.slice(1).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field className="pt-1">
                <Label required>Nombre del contrato</Label>
                <input
                  className={inputCls}
                  placeholder="Describe brevemente el contrato"
                  value={form.contract_name}
                  onChange={(e) => set("contract_name", e.target.value)}
                />
              </Field>
              <Field className="pt-1">
                <Label>Objeto del contrato</Label>
                <textarea
                  rows={3}
                  className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Describe el objeto y alcance del contrato"
                  value={form.contract_object}
                  onChange={(e) => set("contract_object", e.target.value)}
                />
              </Field>

              {/* ── Entidades ── */}
              <SectionTitle icon={Building2} label="Entidades" />
              <div className="pt-3 grid grid-cols-1 gap-3">
                <Field>
                  <Label required>Entidad contratante</Label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Ministerio de Educación"
                    value={form.contracting_entity}
                    onChange={(e) => set("contracting_entity", e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Contratista / Ejecutor</Label>
                  <input
                    className={inputCls}
                    placeholder="Nombre del contratista o empresa"
                    value={form.contractor_entity}
                    onChange={(e) => set("contractor_entity", e.target.value)}
                  />
                </Field>
              </div>

              {/* ── Responsables ── */}
              <SectionTitle icon={User} label="Responsables" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label>Gerente</Label>
                  <input
                    className={inputCls}
                    placeholder="Nombre del gerente"
                    value={form.manager_name}
                    onChange={(e) => set("manager_name", e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Supervisor</Label>
                  <input
                    className={inputCls}
                    placeholder="Nombre del supervisor"
                    value={form.supervisor_name}
                    onChange={(e) => set("supervisor_name", e.target.value)}
                  />
                </Field>
              </div>

              {/* ── Valores ── */}
              <SectionTitle icon={DollarSign} label="Valores financieros" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label required>Valor inicial (COP)</Label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    placeholder="0"
                    value={form.initial_value || ""}
                    onChange={(e) => set("initial_value", Number(e.target.value))}
                  />
                </Field>
                <Field>
                  <Label>% Honorarios</Label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className={inputCls}
                    placeholder="0"
                    value={form.management_fee_percentage || ""}
                    onChange={(e) => set("management_fee_percentage", Number(e.target.value))}
                  />
                </Field>
              </div>

              {/* Preview computed */}
              {Number(form.initial_value) > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: "Honorarios", value: feeValue },
                    { label: "Bienes y servicios", value: goodsValue },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="text-sm font-bold text-foreground">
                        ${item.value.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Fechas y riesgo ── */}
              <SectionTitle icon={CalendarRange} label="Fechas y riesgo" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label>Fecha de inicio</Label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.start_date}
                    onChange={(e) => set("start_date", e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Fecha de vencimiento</Label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.end_date}
                    onChange={(e) => set("end_date", e.target.value)}
                  />
                </Field>
              </div>
              <Field className="pt-1">
                <Label>Nivel de riesgo</Label>
                <select
                  className={selectCls}
                  value={form.risk_level}
                  onChange={(e) => set("risk_level", e.target.value)}
                >
                  <option value="">Sin definir</option>
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                  <option value="critical">Crítico</option>
                </select>
              </Field>

              {/* Spacer */}
              <div className="h-4" />
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border space-y-3">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  form=""
                  onClick={handleSubmit}
                  disabled={loading || success}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                    success
                      ? "bg-emerald-500 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20 active:scale-95 disabled:opacity-60"
                  )}
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Guardando…</>
                  ) : success ? (
                    <><Check size={15} /> Guardado</>
                  ) : (
                    <><Save size={15} /> Guardar contrato</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
