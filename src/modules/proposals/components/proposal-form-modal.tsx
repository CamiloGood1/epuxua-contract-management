"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, AlertTriangle } from "lucide-react"
import { createProposal, updateProposal } from "@/services/proposals.actions"
import type { CreateProposalInput } from "@/services/proposals.actions"
import {
  PROPOSAL_STATUS_ORDER, PROPOSAL_STATUS_CONFIG,
  PROPOSAL_TYPE_ORDER, PROPOSAL_TYPE_LABELS,
} from "@/types/proposals"
import type { ProposalRequest, ProposalStatus, ProposalType } from "@/types/proposals"

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  reception_date:             string
  client_name:                string
  proposal_object:            string
  proposal_delivery_deadline: string
  proposal_type:              ProposalType
  status:                     ProposalStatus
  submission_date:            string
  request_link:               string
  proposal_link:              string
  observations:               string
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

function toForm(p?: ProposalRequest): FormState {
  return {
    reception_date:             p?.reception_date             ?? todayISO(),
    client_name:                p?.client_name                ?? "",
    proposal_object:            p?.proposal_object            ?? "",
    proposal_delivery_deadline: p?.proposal_delivery_deadline ?? "",
    proposal_type:              (p?.proposal_type             ?? "INTERADMINISTRATIVO") as ProposalType,
    status:                     (p?.status                    ?? "RECIBIDA") as ProposalStatus,
    submission_date:            p?.submission_date            ?? "",
    request_link:               p?.request_link               ?? "",
    proposal_link:              p?.proposal_link              ?? "",
    observations:               p?.observations               ?? "",
  }
}

function validateRequired(f: FormState): string | null {
  if (!f.reception_date.trim())             return "Indique la fecha de recepción."
  if (!f.client_name.trim())                return "Indique el cliente."
  if (!f.proposal_object.trim())            return "Indique el objeto."
  if (!f.proposal_delivery_deadline.trim()) return "Indique el plazo de entrega."
  if (!f.proposal_type)                     return "Seleccione la tipología."
  if (!f.status)                            return "Seleccione el estado."
  return null
}

function readFormFromDom(formEl: HTMLFormElement, fallback: FormState): FormState {
  const fd = new FormData(formEl)
  const str = (key: string) => String(fd.get(key) ?? "").trim()
  return {
    reception_date:             str("reception_date")             || fallback.reception_date,
    client_name:                str("client_name")                || fallback.client_name,
    proposal_object:            str("proposal_object")            || fallback.proposal_object,
    proposal_delivery_deadline: str("proposal_delivery_deadline") || fallback.proposal_delivery_deadline,
    proposal_type:              (str("proposal_type") || fallback.proposal_type) as ProposalType,
    status:                     (str("status") || fallback.status) as ProposalStatus,
    submission_date:            str("submission_date"),
    request_link:               str("request_link"),
    proposal_link:              str("proposal_link"),
    observations:               str("observations"),
  }
}

function toInput(f: FormState): CreateProposalInput {
  return {
    reception_date:             f.reception_date.trim(),
    client_name:                f.client_name.trim(),
    proposal_object:            f.proposal_object.trim(),
    proposal_delivery_deadline: f.proposal_delivery_deadline.trim(),
    proposal_type:              f.proposal_type,
    status:                     f.status,
    submission_date:            f.submission_date.trim()  || null,
    request_link:               f.request_link.trim()     || null,
    proposal_link:              f.proposal_link.trim()    || null,
    observations:               f.observations.trim()     || null,
  }
}

const inputCls = "w-full rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  proposal?: ProposalRequest
  onClose: () => void
  onSaved?: () => void
}

export function ProposalFormModal({ proposal, onClose, onSaved }: Props) {
  const router = useRouter()
  const isEdit = !!proposal
  const [form, setForm] = useState<FormState>(() => toForm(proposal))
  const formRef = useRef<FormState>(form)
  const [error, setError]   = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function setField<K extends keyof FormState>(k: K, v: string) {
    const next = { ...formRef.current, [k]: v }
    formRef.current = next
    setForm(next)
    if (error) setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const current = readFormFromDom(e.currentTarget, formRef.current)
    formRef.current = current
    setForm(current)

    const validationError = validateRequired(current)
    if (validationError) { setError(validationError); return }

    const input = toInput(current)

    setIsSaving(true)
    try {
      const res = isEdit
        ? await updateProposal({ id: proposal!.id, ...input })
        : await createProposal(input)
      if (res.error) { setError(res.error); return }
      onSaved?.()
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la propuesta.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-[#002869]">
              {isEdit ? "Editar Propuesta" : "Nueva Propuesta"}
            </h2>
            <p className="text-xs text-[#747783] mt-0.5">
              {isEdit ? `Propuesta #${proposal!.id} · los cambios quedan auditados` : "Ingrese los datos de la solicitud"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

          {/* Obligatorios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

            <Field label="Fecha de Recepción de la Solicitud" required>
              <input name="reception_date" type="date" value={form.reception_date} onChange={e => setField("reception_date", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Cliente" required>
              <input name="client_name" type="text" value={form.client_name} onChange={e => setField("client_name", e.target.value)}
                className={inputCls + " h-10"} placeholder="Nombre de la entidad o cliente" />
            </Field>

            <div className="col-span-2">
              <Field label="Objeto" required>
                <textarea name="proposal_object" rows={3} value={form.proposal_object} onChange={e => setField("proposal_object", e.target.value)}
                  className={inputCls + " py-2 resize-none"} placeholder="Descripción del objeto de la propuesta" />
              </Field>
            </div>

            <Field label="Plazo de Entrega de la Propuesta" required>
              <input name="proposal_delivery_deadline" type="date" value={form.proposal_delivery_deadline} onChange={e => setField("proposal_delivery_deadline", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <Field label="Tipología" required>
              <select name="proposal_type" value={form.proposal_type} onChange={e => setField("proposal_type", e.target.value as ProposalType)}
                className={inputCls + " h-10 appearance-none"}>
                {PROPOSAL_TYPE_ORDER.map(t => (
                  <option key={t} value={t}>{PROPOSAL_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>

            <Field label="Estado" required>
              <select name="status" value={form.status} onChange={e => setField("status", e.target.value as ProposalStatus)}
                className={inputCls + " h-10 appearance-none"}>
                {PROPOSAL_STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{PROPOSAL_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </Field>

            {/* Opcionales */}
            <div className="col-span-2 pt-2 border-t border-[#EAEAEA] mt-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3D91]">Información Opcional</p>
            </div>

            <Field label="Fecha de Remisión">
              <input name="submission_date" type="date" value={form.submission_date} onChange={e => setField("submission_date", e.target.value)}
                className={inputCls + " h-10"} />
            </Field>

            <div className="col-span-1" /> {/* spacer */}

            <Field label="Enlace Solicitud de Propuesta">
              <input name="request_link" type="text" value={form.request_link} onChange={e => setField("request_link", e.target.value)}
                className={inputCls + " h-10"} placeholder="https://…" inputMode="url" />
            </Field>

            <Field label="Enlace de la Propuesta">
              <input name="proposal_link" type="text" value={form.proposal_link} onChange={e => setField("proposal_link", e.target.value)}
                className={inputCls + " h-10"} placeholder="https://…" inputMode="url" />
            </Field>

            <div className="col-span-2">
              <Field label="Observaciones">
                <textarea name="observations" rows={3} value={form.observations} onChange={e => setField("observations", e.target.value)}
                  className={inputCls + " py-2 resize-none"} placeholder="Notas adicionales…" />
              </Field>
            </div>

          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-50 flex items-center justify-center gap-1.5">
              {isSaving ? "Guardando…" : isEdit ? "Guardar Cambios" : "Crear Propuesta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
