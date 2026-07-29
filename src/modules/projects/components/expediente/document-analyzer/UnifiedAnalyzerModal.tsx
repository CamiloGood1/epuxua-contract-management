"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Upload, AlertCircle } from "lucide-react"
import { ConfidenceBadge } from "./ConfidenceBadge"
import {
  createAdicion,
  createProrroga,
  createSuspension,
  createReinicio,
  createAclaratorio,
} from "@/services/modificaciones.actions"
import type {
  UnifiedModificationResult,
  ModificationDocType,
  AdicionFields,
  ProrrogaFields,
  SuspensionFields,
  ReinicioFields,
  AclaratorioFields,
} from "@/lib/document-analyzer/types"

// ── Edit state shapes ─────────────────────────────────────────────────────────

interface EditAdicion   { fecha: string; valorTotal: string; valorCuota: string; valorBienes: string; numeroRp: string; motivo: string }
interface EditProrroga  { fechaSusc: string; nuevaFecha: string; plazo: string; justificacion: string }
interface EditSuspension{ fechaSusc: string; inicio: string; fin: string; plazo: string; motivo: string }
interface EditReinicio  { fechaReinicio: string; fechaSusc: string; motivo: string; obs: string }
interface EditAclaratorio{ fecha: string; motivo: string; descripcion: string }

interface EditState {
  adicion?:     EditAdicion
  prorroga?:    EditProrroga
  suspension?:  EditSuspension
  reinicio?:    EditReinicio
  aclaratorio?: EditAclaratorio
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface NextNums { adicion: number; prorroga: number; suspension: number; reinicio: number; aclaratorio: number }

interface Props {
  open: boolean
  onClose: () => void
  interadministrativoId: number
  nextNums: NextNums
}

type Status = "idle" | "analyzing" | "reviewing" | "applying" | "error"

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(s: string): number | null {
  if (!s.trim()) return null
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."))
  return isNaN(n) ? null : n
}

function strVal(f?: { value: unknown; confidence: number } | null): string {
  if (!f || f.value === null) return ""
  return String(f.value)
}

function initEdits(r: UnifiedModificationResult): EditState {
  const e: EditState = {}
  if (r.adicion) {
    const a = r.adicion as AdicionFields
    e.adicion = {
      fecha:       strVal(a.fecha_adicion),
      valorTotal:  strVal(a.valor_total),
      valorCuota:  strVal(a.valor_cuota_gerencia),
      valorBienes: strVal(a.valor_bienes_servicios),
      numeroRp:    strVal(a.numero_rp),
      motivo:      strVal(a.motivo),
    }
  }
  if (r.prorroga) {
    const p = r.prorroga as ProrrogaFields
    e.prorroga = {
      fechaSusc:     strVal(p.fecha_suscripcion),
      nuevaFecha:    strVal(p.nueva_fecha_terminacion),
      plazo:         strVal(p.plazo_prorroga),
      justificacion: strVal(p.justificacion),
    }
  }
  if (r.suspension) {
    const s = r.suspension as SuspensionFields
    e.suspension = {
      fechaSusc: strVal(s.fecha_suscripcion),
      inicio:    strVal(s.inicio_suspension),
      fin:       strVal(s.fin_suspension),
      plazo:     strVal(s.plazo_suspension),
      motivo:    strVal(s.motivo),
    }
  }
  if (r.reinicio) {
    const ri = r.reinicio as ReinicioFields
    e.reinicio = {
      fechaReinicio: strVal(ri.fecha_reinicio),
      fechaSusc:     strVal(ri.fecha_suscripcion),
      motivo:        strVal(ri.motivo),
      obs:           strVal(ri.observaciones),
    }
  }
  if (r.aclaratorio) {
    const ac = r.aclaratorio as AclaratorioFields
    e.aclaratorio = {
      fecha:       strVal(ac.fecha_suscripcion),
      motivo:      strVal(ac.motivo),
      descripcion: strVal(ac.descripcion),
    }
  }
  return e
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputCls = "w-full h-9 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
const textareaCls = "w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 resize-none"

function FieldRow({
  label,
  badge,
  children,
}: {
  label: string
  badge?: { confidence: number } | null
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#747783]">{label}</span>
        {badge != null && <ConfidenceBadge confidence={badge.confidence} />}
      </div>
      {children}
    </div>
  )
}

const TYPE_COLORS: Record<ModificationDocType, { bg: string; border: string; text: string; label: string }> = {
  ADICION:     { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700", label: "Adición" },
  PRORROGA:    { bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700",   label: "Prórroga" },
  SUSPENSION:  { bg: "bg-yellow-50",   border: "border-yellow-200",  text: "text-yellow-700",  label: "Suspensión" },
  REINICIO:    { bg: "bg-blue-50",     border: "border-blue-200",    text: "text-blue-700",    label: "Reinicio" },
  ACLARATORIO: { bg: "bg-violet-50",   border: "border-violet-200",  text: "text-violet-700",  label: "Aclaratorio" },
}

function TypeBadge({ tipo }: { tipo: ModificationDocType }) {
  const c = TYPE_COLORS[tipo]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${c.bg} ${c.border} ${c.text}`}>
      {c.label}
    </span>
  )
}

// ── Card de revisión por tipo ─────────────────────────────────────────────────

function AdicionCard({
  num, fields, edit, onChange,
}: {
  num: number
  fields: AdicionFields
  edit: EditAdicion
  onChange: (e: EditAdicion) => void
}) {
  const set = (k: keyof EditAdicion) => (v: string) => onChange({ ...edit, [k]: v })
  return (
    <div className="space-y-3">
      <FieldRow label={`Fecha de la Adición N°${num}`} badge={fields.fecha_adicion}>
        <input type="date" className={inputCls} value={edit.fecha} onChange={(e) => set("fecha")(e.target.value)} />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Valor Total (COP)" badge={fields.valor_total}>
          <input type="text" className={inputCls} placeholder="0" value={edit.valorTotal} onChange={(e) => set("valorTotal")(e.target.value)} />
        </FieldRow>
        <FieldRow label="Cuota de Gerencia (COP)" badge={fields.valor_cuota_gerencia}>
          <input type="text" className={inputCls} placeholder="0" value={edit.valorCuota} onChange={(e) => set("valorCuota")(e.target.value)} />
        </FieldRow>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Bolsa de Inversión (COP)" badge={fields.valor_bienes_servicios}>
          <input type="text" className={inputCls} placeholder="0" value={edit.valorBienes} onChange={(e) => set("valorBienes")(e.target.value)} />
        </FieldRow>
        <FieldRow label="Número RP" badge={fields.numero_rp}>
          <input type="text" className={inputCls} value={edit.numeroRp} onChange={(e) => set("numeroRp")(e.target.value)} />
        </FieldRow>
      </div>
      <FieldRow label="Motivo" badge={fields.motivo}>
        <textarea rows={2} className={textareaCls} value={edit.motivo} onChange={(e) => set("motivo")(e.target.value)} />
      </FieldRow>
    </div>
  )
}

function ProrrogaCard({
  num, fields, edit, onChange,
}: {
  num: number
  fields: ProrrogaFields
  edit: EditProrroga
  onChange: (e: EditProrroga) => void
}) {
  const set = (k: keyof EditProrroga) => (v: string) => onChange({ ...edit, [k]: v })
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label={`Fecha Suscripción N°${num}`} badge={fields.fecha_suscripcion}>
          <input type="date" className={inputCls} value={edit.fechaSusc} onChange={(e) => set("fechaSusc")(e.target.value)} />
        </FieldRow>
        <FieldRow label="Nueva Fecha Terminación" badge={fields.nueva_fecha_terminacion}>
          <input type="date" className={inputCls} value={edit.nuevaFecha} onChange={(e) => set("nuevaFecha")(e.target.value)} />
        </FieldRow>
      </div>
      <FieldRow label="Plazo de la Prórroga" badge={fields.plazo_prorroga}>
        <input type="text" className={inputCls} placeholder="Ej: 3 meses" value={edit.plazo} onChange={(e) => set("plazo")(e.target.value)} />
      </FieldRow>
      <FieldRow label="Justificación" badge={fields.justificacion}>
        <textarea rows={2} className={textareaCls} value={edit.justificacion} onChange={(e) => set("justificacion")(e.target.value)} />
      </FieldRow>
    </div>
  )
}

function SuspensionCard({
  num, fields, edit, onChange,
}: {
  num: number
  fields: SuspensionFields
  edit: EditSuspension
  onChange: (e: EditSuspension) => void
}) {
  const set = (k: keyof EditSuspension) => (v: string) => onChange({ ...edit, [k]: v })
  return (
    <div className="space-y-3">
      <FieldRow label={`Fecha Suscripción N°${num}`} badge={fields.fecha_suscripcion}>
        <input type="date" className={inputCls} value={edit.fechaSusc} onChange={(e) => set("fechaSusc")(e.target.value)} />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Inicio Suspensión" badge={fields.inicio_suspension}>
          <input type="date" className={inputCls} value={edit.inicio} onChange={(e) => set("inicio")(e.target.value)} />
        </FieldRow>
        <FieldRow label="Fin Suspensión" badge={fields.fin_suspension}>
          <input type="date" className={inputCls} value={edit.fin} onChange={(e) => set("fin")(e.target.value)} />
        </FieldRow>
      </div>
      <FieldRow label="Plazo" badge={fields.plazo_suspension}>
        <input type="text" className={inputCls} placeholder="Ej: 30 días" value={edit.plazo} onChange={(e) => set("plazo")(e.target.value)} />
      </FieldRow>
      <FieldRow label="Motivo" badge={fields.motivo}>
        <textarea rows={2} className={textareaCls} value={edit.motivo} onChange={(e) => set("motivo")(e.target.value)} />
      </FieldRow>
    </div>
  )
}

function ReinicioCard({
  num, fields, edit, onChange,
}: {
  num: number
  fields: ReinicioFields
  edit: EditReinicio
  onChange: (e: EditReinicio) => void
}) {
  const set = (k: keyof EditReinicio) => (v: string) => onChange({ ...edit, [k]: v })
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label={`Fecha Reinicio N°${num}`} badge={fields.fecha_reinicio}>
          <input type="date" className={inputCls} value={edit.fechaReinicio} onChange={(e) => set("fechaReinicio")(e.target.value)} />
        </FieldRow>
        <FieldRow label="Fecha Suscripción" badge={fields.fecha_suscripcion}>
          <input type="date" className={inputCls} value={edit.fechaSusc} onChange={(e) => set("fechaSusc")(e.target.value)} />
        </FieldRow>
      </div>
      <FieldRow label="Motivo" badge={fields.motivo}>
        <textarea rows={2} className={textareaCls} value={edit.motivo} onChange={(e) => set("motivo")(e.target.value)} />
      </FieldRow>
      <FieldRow label="Observaciones" badge={fields.observaciones}>
        <textarea rows={2} className={textareaCls} value={edit.obs} onChange={(e) => set("obs")(e.target.value)} />
      </FieldRow>
    </div>
  )
}

function AclaratorioCard({
  num, fields, edit, onChange,
}: {
  num: number
  fields: AclaratorioFields
  edit: EditAclaratorio
  onChange: (e: EditAclaratorio) => void
}) {
  const set = (k: keyof EditAclaratorio) => (v: string) => onChange({ ...edit, [k]: v })
  return (
    <div className="space-y-3">
      <FieldRow label={`Fecha Suscripción N°${num}`} badge={fields.fecha_suscripcion}>
        <input type="date" className={inputCls} value={edit.fecha} onChange={(e) => set("fecha")(e.target.value)} />
      </FieldRow>
      <FieldRow label="Motivo" badge={fields.motivo}>
        <input type="text" className={inputCls} value={edit.motivo} onChange={(e) => set("motivo")(e.target.value)} />
      </FieldRow>
      <FieldRow label="Descripción" badge={fields.descripcion}>
        <textarea rows={3} className={textareaCls} value={edit.descripcion} onChange={(e) => set("descripcion")(e.target.value)} />
      </FieldRow>
    </div>
  )
}

// ── Pasos de progreso ─────────────────────────────────────────────────────────

const STEPS = [
  "📖 Leyendo el documento...",
  "✂️ Procesando el contenido...",
  "🔍 Identificando modificaciones...",
  "📊 Extrayendo información...",
  "✅ Validando resultados...",
]

// ── Componente principal ──────────────────────────────────────────────────────

export function UnifiedAnalyzerModal({ open, onClose, interadministrativoId, nextNums }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<UnifiedModificationResult | null>(null)
  const [edits, setEdits] = useState<EditState>({})
  const [error, setError] = useState<string | null>(null)
  const [, startApplying] = useTransition()

  if (!open) return null

  async function handleFile(file: File) {
    setStatus("analyzing")
    setStep(0)

    // Cycle through steps while waiting
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2500)

    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/document-analysis/unified", { method: "POST", body: form })
      const data = await res.json() as { result?: UnifiedModificationResult; error?: string }

      clearInterval(interval)

      if (!res.ok || !data.result) {
        setError(data.error ?? "Error al analizar el documento. Intenta de nuevo.")
        setStatus("error")
        return
      }

      if (data.result.detected_types.length === 0) {
        setError("No se detectaron modificaciones contractuales en el documento. Verifica que sea un Otrosí o acta de modificación.")
        setStatus("error")
        return
      }

      setEdits(initEdits(data.result))
      setResult(data.result)
      setStatus("reviewing")
    } catch {
      clearInterval(interval)
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.")
      setStatus("error")
    }
  }

  function handleApply() {
    if (!result) return
    startApplying(async () => {
      setStatus("applying")
      const errors: string[] = []

      if (result.adicion && edits.adicion) {
        const r = await createAdicion({
          interadministrativo_id: interadministrativoId,
          numero_adicion: nextNums.adicion,
          fecha_adicion:          edits.adicion.fecha || new Date().toISOString().slice(0, 10),
          valor_total:            parseNum(edits.adicion.valorTotal),
          valor_cuota_gerencia:   parseNum(edits.adicion.valorCuota),
          valor_bienes_servicios: parseNum(edits.adicion.valorBienes),
          numero_rp:              edits.adicion.numeroRp || null,
          motivo:                 edits.adicion.motivo   || null,
        })
        if (r.error) errors.push(`Adición: ${r.error}`)
      }

      if (result.prorroga && edits.prorroga && !errors.length) {
        const r = await createProrroga({
          interadministrativo_id:  interadministrativoId,
          numero_prorroga:         nextNums.prorroga,
          fecha_suscripcion:       edits.prorroga.fechaSusc  || new Date().toISOString().slice(0, 10),
          nueva_fecha_terminacion: edits.prorroga.nuevaFecha || new Date().toISOString().slice(0, 10),
          plazo_prorroga:          edits.prorroga.plazo         || null,
          justificacion:           edits.prorroga.justificacion || null,
        })
        if (r.error) errors.push(`Prórroga: ${r.error}`)
      }

      if (result.suspension && edits.suspension && !errors.length) {
        const r = await createSuspension({
          interadministrativo_id: interadministrativoId,
          numero_suspension:      nextNums.suspension,
          fecha_suscripcion:      edits.suspension.fechaSusc || null,
          inicio_suspension:      edits.suspension.inicio    || new Date().toISOString().slice(0, 10),
          fin_suspension:         edits.suspension.fin       || null,
          plazo_suspension:       edits.suspension.plazo     || null,
          motivo:                 edits.suspension.motivo    || null,
        })
        if (r.error) errors.push(`Suspensión: ${r.error}`)
      }

      if (result.reinicio && edits.reinicio && !errors.length) {
        const r = await createReinicio({
          interadministrativo_id: interadministrativoId,
          numero_reinicio:        nextNums.reinicio,
          fecha_reinicio:         edits.reinicio.fechaReinicio || new Date().toISOString().slice(0, 10),
          fecha_suscripcion:      edits.reinicio.fechaSusc || null,
          motivo:                 edits.reinicio.motivo    || null,
          observaciones:          edits.reinicio.obs       || null,
        })
        if (r.error) errors.push(`Reinicio: ${r.error}`)
      }

      if (result.aclaratorio && edits.aclaratorio && !errors.length) {
        const r = await createAclaratorio({
          interadministrativo_id: interadministrativoId,
          numero_aclaratorio:     nextNums.aclaratorio,
          fecha_suscripcion:      edits.aclaratorio.fecha       || new Date().toISOString().slice(0, 10),
          motivo:                 edits.aclaratorio.motivo      || null,
          descripcion:            edits.aclaratorio.descripcion || null,
        })
        if (r.error) errors.push(`Aclaratorio: ${r.error}`)
      }

      if (errors.length > 0) {
        setError(errors.join("\n"))
        setStatus("reviewing")
        return
      }

      router.refresh()
      onClose()
    })
  }

  function reset() { setStatus("idle"); setError(null); setResult(null); setEdits({}) }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#002869]">Asistente Inteligente de Modificaciones</h2>
            <p className="text-[11px] text-[#747783] mt-0.5">
              {status === "idle"      && "Sube el documento PDF para comenzar el análisis"}
              {status === "analyzing" && "Analizando el documento con IA..."}
              {status === "reviewing" && result && `Se ${result.detected_types.length === 1 ? "detectó 1 modificación" : `detectaron ${result.detected_types.length} modificaciones`} — revisa y corrige si es necesario`}
              {status === "applying"  && "Registrando modificaciones..."}
              {status === "error"     && "Ocurrió un error"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Idle: file picker ── */}
          {status === "idle" && (
            <div
              className="border-2 border-dashed border-[#0B3D91]/30 rounded-xl p-10 text-center cursor-pointer hover:border-[#0B3D91]/60 hover:bg-[#f7f8ff] transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
            >
              <Upload size={28} className="mx-auto text-[#0B3D91]/40 mb-3" />
              <p className="text-sm font-semibold text-[#0B3D91]">Arrastra el PDF aquí o haz clic para seleccionar</p>
              <p className="text-xs text-[#747783] mt-1">Otrosí, acta de modificación o documento contractual — máximo 10 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* ── Analyzing: progress ── */}
          {status === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="w-12 h-12 rounded-full border-4 border-[#0B3D91]/20 border-t-[#0B3D91] animate-spin" />
              <div className="space-y-2 w-full max-w-xs">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`flex items-center gap-2 text-sm transition-opacity ${i <= step ? "opacity-100" : "opacity-30"}`}
                  >
                    <span className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold
                      ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#0B3D91] text-white animate-pulse" : "bg-[#EAEAEA] text-[#747783]"}`}>
                      {i < step ? "✓" : i + 1}
                    </span>
                    <span className={i === step ? "text-[#0B3D91] font-medium" : "text-[#747783]"}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reviewing: cards ── */}
          {(status === "reviewing" || status === "applying") && result && (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                </div>
              )}

              {result.detected_types.map((tipo) => {
                const c = TYPE_COLORS[tipo]
                return (
                  <div key={tipo} className={`rounded-xl border-2 ${c.border} overflow-hidden`}>
                    <div className={`px-5 py-3 ${c.bg} flex items-center gap-2`}>
                      <TypeBadge tipo={tipo} />
                      <span className={`text-xs font-medium ${c.text}`}>
                        {tipo === "ADICION"     && `Adición N°${nextNums.adicion}`}
                        {tipo === "PRORROGA"    && `Prórroga N°${nextNums.prorroga}`}
                        {tipo === "SUSPENSION"  && `Suspensión N°${nextNums.suspension}`}
                        {tipo === "REINICIO"    && `Reinicio N°${nextNums.reinicio}`}
                        {tipo === "ACLARATORIO" && `Aclaratorio N°${nextNums.aclaratorio}`}
                      </span>
                    </div>
                    <div className="px-5 py-4">
                      {tipo === "ADICION"     && result.adicion     && edits.adicion     && (
                        <AdicionCard num={nextNums.adicion} fields={result.adicion} edit={edits.adicion}
                          onChange={(e) => setEdits({ ...edits, adicion: e })} />
                      )}
                      {tipo === "PRORROGA"    && result.prorroga    && edits.prorroga    && (
                        <ProrrogaCard num={nextNums.prorroga} fields={result.prorroga} edit={edits.prorroga}
                          onChange={(e) => setEdits({ ...edits, prorroga: e })} />
                      )}
                      {tipo === "SUSPENSION"  && result.suspension  && edits.suspension  && (
                        <SuspensionCard num={nextNums.suspension} fields={result.suspension} edit={edits.suspension}
                          onChange={(e) => setEdits({ ...edits, suspension: e })} />
                      )}
                      {tipo === "REINICIO"    && result.reinicio    && edits.reinicio    && (
                        <ReinicioCard num={nextNums.reinicio} fields={result.reinicio} edit={edits.reinicio}
                          onChange={(e) => setEdits({ ...edits, reinicio: e })} />
                      )}
                      {tipo === "ACLARATORIO" && result.aclaratorio && edits.aclaratorio && (
                        <AclaratorioCard num={nextNums.aclaratorio} fields={result.aclaratorio} edit={edits.aclaratorio}
                          onChange={(e) => setEdits({ ...edits, aclaratorio: e })} />
                      )}
                    </div>
                  </div>
                )
              })}

              <p className="text-[11px] text-[#747783] text-center">
                Las insignias de confianza son orientativas. Revisa y corrige cualquier campo antes de aplicar.
              </p>
            </div>
          )}

          {/* ── Error: retry / close ── */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#151c27]">No se pudo completar el análisis</p>
                <p className="text-xs text-red-600 mt-1 max-w-sm whitespace-pre-line">{error}</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869]"
              >
                Intentar con otro documento
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        {(status === "reviewing" || status === "applying") && (
          <div className="px-6 py-4 border-t border-[#EAEAEA] flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={status === "applying"}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={status === "applying"}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60"
            >
              {status === "applying"
                ? "Registrando..."
                : `Aplicar ${result?.detected_types.length ?? 0} modificación${(result?.detected_types.length ?? 0) !== 1 ? "es" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
