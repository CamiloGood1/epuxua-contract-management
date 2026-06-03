"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Save, Loader2, AlertCircle, Check,
  Hash, FileText, Building2, User, DollarSign, CalendarRange,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createContract } from "@/services/contracts.actions"
import { STATUS_OPTIONS, MODALITY_OPTIONS, CONTRACT_TYPE_OPTIONS } from "../lib/status"
import type { NewContractInput, ContractStatus, ContractType, SelectionModality } from "@/types/contract"

const inputCls = "w-full h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all"
const selectCls = `${inputCls} appearance-none cursor-pointer`

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

const currentYear = new Date().getFullYear()

const EMPTY: NewContractInput = {
  contract_number:       "",
  year:                  currentYear,
  contract_type:         "DIRECTO",
  contract_class:        "Prestación de servicios profesionales",
  selection_modality:    "CONTRATACION_DIRECTA",
  object:                "",
  contractor_name:       "",
  contractor_person_type: "NATURAL",
  supervisor_name:       "",
  area_name:             "",
  status:                "EN_EJECUCION",
  subscription_date:     new Date().toISOString().split("T")[0],
  start_date:            "",
  end_date:              "",
  initial_value:         0,
}

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

  useEffect(() => {
    if (open) { setForm(EMPTY); setError(null); setSuccess(false) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function set<K extends keyof NewContractInput>(field: K, value: NewContractInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function validate(): string | null {
    if (!form.contract_number.trim()) return "El número de contrato es obligatorio"
    if (!form.object.trim())          return "El objeto del contrato es obligatorio"
    if (!form.contractor_name.trim()) return "El nombre del contratista es obligatorio"
    if (Number(form.initial_value) <= 0) return "El valor inicial debe ser mayor a 0"
    if (!form.subscription_date)      return "La fecha de suscripción es obligatoria"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError(null)

    const { error: serverError } = await createContract(form)
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Nuevo contrato</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Campos con <span className="text-destructive">*</span> son obligatorios
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* Identificación */}
              <SectionTitle icon={Hash} label="Identificación" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label required>N° de contrato</Label>
                  <input className={inputCls} placeholder="001-2026"
                    value={form.contract_number}
                    onChange={(e) => set("contract_number", e.target.value)} />
                </Field>
                <Field>
                  <Label required>Año</Label>
                  <input type="number" className={inputCls} min={2020} max={2099}
                    value={form.year}
                    onChange={(e) => set("year", Number(e.target.value))} />
                </Field>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-3">
                <Field>
                  <Label>Tipo de contrato</Label>
                  <select className={selectCls} value={form.contract_type}
                    onChange={(e) => set("contract_type", e.target.value as ContractType)}>
                    {CONTRACT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <Label>Estado</Label>
                  <select className={selectCls} value={form.status}
                    onChange={(e) => set("status", e.target.value as ContractStatus)}>
                    {STATUS_OPTIONS.slice(1).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field className="pt-1">
                <Label>Modalidad de selección</Label>
                <select className={selectCls} value={form.selection_modality}
                  onChange={(e) => set("selection_modality", e.target.value as SelectionModality)}>
                  {MODALITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>

              {/* Objeto */}
              <SectionTitle icon={FileText} label="Objeto del contrato" />
              <Field className="pt-3">
                <Label required>Clase de contrato</Label>
                <input className={inputCls} placeholder="Prestación de servicios profesionales"
                  value={form.contract_class}
                  onChange={(e) => set("contract_class", e.target.value)} />
              </Field>
              <Field className="pt-1">
                <Label required>Objeto</Label>
                <textarea rows={3} className={`${inputCls} h-auto py-2 resize-none`}
                  placeholder="Describe el objeto y alcance del contrato"
                  value={form.object}
                  onChange={(e) => set("object", e.target.value)} />
              </Field>

              {/* Partes */}
              <SectionTitle icon={Building2} label="Partes" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label required>Contratista / Proveedor</Label>
                  <input className={inputCls} placeholder="Nombre completo o razón social"
                    value={form.contractor_name}
                    onChange={(e) => set("contractor_name", e.target.value)} />
                </Field>
                <Field>
                  <Label>Tipo persona</Label>
                  <select className={selectCls} value={form.contractor_person_type}
                    onChange={(e) => set("contractor_person_type", e.target.value as "NATURAL" | "JURIDICA")}>
                    <option value="NATURAL">Natural</option>
                    <option value="JURIDICA">Jurídica</option>
                  </select>
                </Field>
              </div>

              {/* Responsables */}
              <SectionTitle icon={User} label="Responsables" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label>Supervisor</Label>
                  <input className={inputCls} placeholder="Nombre del supervisor"
                    value={form.supervisor_name}
                    onChange={(e) => set("supervisor_name", e.target.value)} />
                </Field>
                <Field>
                  <Label>Área responsable</Label>
                  <input className={inputCls} placeholder="Dirección o Subgerencia"
                    value={form.area_name}
                    onChange={(e) => set("area_name", e.target.value)} />
                </Field>
              </div>

              {/* Valores */}
              <SectionTitle icon={DollarSign} label="Valor" />
              <Field className="pt-3">
                <Label required>Valor inicial (COP)</Label>
                <input type="number" min={0} className={inputCls} placeholder="0"
                  value={form.initial_value || ""}
                  onChange={(e) => set("initial_value", Number(e.target.value))} />
              </Field>

              {/* Fechas */}
              <SectionTitle icon={CalendarRange} label="Fechas" />
              <div className="pt-3 grid grid-cols-2 gap-3">
                <Field>
                  <Label required>Fecha de suscripción</Label>
                  <input type="date" className={inputCls}
                    value={form.subscription_date}
                    onChange={(e) => set("subscription_date", e.target.value)} />
                </Field>
                <Field>
                  <Label>Fecha de inicio</Label>
                  <input type="date" className={inputCls}
                    value={form.start_date}
                    onChange={(e) => set("start_date", e.target.value)} />
                </Field>
              </div>
              <Field className="pt-1">
                <Label>Fecha de terminación</Label>
                <input type="date" className={inputCls}
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)} />
              </Field>

              <div className="h-4" />
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border space-y-3">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button type="submit" form="" onClick={handleSubmit}
                  disabled={loading || success}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                    success
                      ? "bg-emerald-500 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20 active:scale-95 disabled:opacity-60"
                  )}>
                  {loading  ? <><Loader2 size={15} className="animate-spin" /> Guardando…</>
                  : success ? <><Check size={15} /> Guardado</>
                  :           <><Save  size={15} /> Guardar contrato</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
