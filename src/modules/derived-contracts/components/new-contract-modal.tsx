"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createDerivedContract, createFuncionamientoContract } from "@/services/projects.actions"

// ── Shared atoms ──────────────────────────────────────────────────────────────

const inputCls = "w-full h-9 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white"
const selectCls = "w-full h-9 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white appearance-none"

const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className={labelCls}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Section({ label }: { label: string }) {
  return (
    <div className="pt-4 pb-1 border-b border-[#EAEAEA]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#747783]">{label}</span>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

const ESTADOS = [
  "EN EJECUCIÓN", "CIERRE CONTRACTUAL", "TERMINADO", "LIQUIDADO",
  "TERMINADO ANTICIPADAMENTE", "SUSPENDIDO", "DECLARADO FALLIDO", "NO SUSCRITO", "TERMINADO ANORMALMENTE",
]

// ── Types ─────────────────────────────────────────────────────────────────────

type Tipo = "DERIVADO" | "FUNCIONAMIENTO"

export interface SimpleInteradmin {
  id: number
  id_contrato: string
  objeto_contrato: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  interadmins: SimpleInteradmin[]
  canCreateFuncionamiento?: boolean
}

// ── Derivado form ─────────────────────────────────────────────────────────────

interface DeriForm {
  id_interadministrativo: string
  numero_contrato: string
  objeto_contrato: string
  contratista: string
  persona_natural_juridica: string
  nit_identificacion: string
  numero_proceso_seleccion: string
  estado: string
  fecha_suscripcion: string
  fecha_inicio: string
  fecha_terminacion: string
  plazo_ejecucion: string
  supervisor: string
  link_ficha: string
  link_documentacion: string
  valor_inicial: string
  crp: string
  fecha_crp: string
  enlace_carpeta: string
}

const EMPTY_DERI: DeriForm = {
  id_interadministrativo: "", numero_contrato: "", objeto_contrato: "",
  contratista: "", persona_natural_juridica: "", nit_identificacion: "",
  numero_proceso_seleccion: "", estado: "EN EJECUCIÓN", fecha_suscripcion: "",
  fecha_inicio: "", fecha_terminacion: "", plazo_ejecucion: "", supervisor: "",
  link_ficha: "", link_documentacion: "", valor_inicial: "", crp: "", fecha_crp: "",
  enlace_carpeta: "",
}

// ── Funcionamiento form ───────────────────────────────────────────────────────

interface FuncForm {
  numero_contrato: string
  contratista: string
  nit_identificacion: string
  numero_proceso_seleccion: string
  modalidad_seleccion: string
  area_responsable: string
  estado: string
  fecha_suscripcion: string
  fecha_inicio: string
  fecha_terminacion: string
  plazo_ejecucion: string
  supervisor: string
  objeto_contrato: string
  valor_inicial: string
  cdp: string
  fecha_cdp: string
  crp: string
  fecha_crp: string
  enlace_carpeta: string
  link_ficha: string
  observaciones: string
}

const EMPTY_FUNC: FuncForm = {
  numero_contrato: "", contratista: "", nit_identificacion: "",
  numero_proceso_seleccion: "", modalidad_seleccion: "",
  area_responsable: "", estado: "EN EJECUCIÓN", fecha_suscripcion: "",
  fecha_inicio: "", fecha_terminacion: "", plazo_ejecucion: "", supervisor: "",
  objeto_contrato: "", valor_inicial: "", cdp: "", fecha_cdp: "", crp: "",
  fecha_crp: "", enlace_carpeta: "", link_ficha: "", observaciones: "",
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewContractModal({ open, onClose, interadmins, canCreateFuncionamiento = false }: Props) {
  const router = useRouter()
  const [tipo, setTipo]           = useState<Tipo>("DERIVADO")
  const [deri, setDeri]           = useState<DeriForm>({ ...EMPTY_DERI })
  const [func_, setFunc]          = useState<FuncForm>({ ...EMPTY_FUNC })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [interSearch, setSearch]  = useState("")

  useEffect(() => {
    if (open) {
      setTipo("DERIVADO")
      setDeri({ ...EMPTY_DERI })
      setFunc({ ...EMPTY_FUNC })
      setError(null)
      setSuccess(false)
      setSearch("")
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  function setD<K extends keyof DeriForm>(k: K, v: string) {
    setDeri((p) => ({ ...p, [k]: v })); setError(null)
  }
  function setF<K extends keyof FuncForm>(k: K, v: string) {
    setFunc((p) => ({ ...p, [k]: v })); setError(null)
  }

  // Filtered interadmins for dropdown
  const filteredIA = interadmins.filter((ia) => {
    const q = interSearch.toLowerCase()
    return !q || ia.id_contrato.toLowerCase().includes(q) || (ia.objeto_contrato ?? "").toLowerCase().includes(q)
  })

  function validateDeri(): string | null {
    if (!deri.id_interadministrativo) return "Debe seleccionar un Contrato Interadministrativo"
    if (!deri.numero_contrato.trim()) return "El Número de Contrato Derivado es obligatorio"
    if (!deri.objeto_contrato.trim()) return "El Objeto es obligatorio"
    if (!deri.contratista.trim())     return "El Contratista es obligatorio"
    if (!deri.estado)                 return "El Estado es obligatorio"
    if (!deri.fecha_suscripcion)      return "La Fecha de Suscripción es obligatoria"
    if (!deri.fecha_inicio)           return "La Fecha de Inicio es obligatoria"
    if (!deri.fecha_terminacion)      return "La Fecha de Terminación es obligatoria"
    if (!deri.valor_inicial.trim())   return "El Valor Inicial es obligatorio"
    return null
  }

  function validateFunc(): string | null {
    if (!func_.numero_contrato.trim())    return "El Número de Contrato es obligatorio"
    if (!func_.contratista.trim())        return "El Nombre del Contratista es obligatorio"
    if (!func_.numero_proceso_seleccion.trim()) return "El Número de Proceso de Selección es obligatorio"
    if (!func_.modalidad_seleccion.trim()) return "El Tipo de Contratación es obligatorio"
    if (!func_.area_responsable.trim())   return "El Área es obligatoria"
    if (!func_.estado)                    return "El Estado es obligatorio"
    if (!func_.fecha_suscripcion)         return "La Fecha de Suscripción es obligatoria"
    if (!func_.fecha_inicio)              return "La Fecha de Inicio es obligatoria"
    if (!func_.fecha_terminacion)         return "La Fecha de Terminación es obligatoria"
    if (!func_.supervisor.trim())         return "El Supervisor es obligatorio"
    if (!func_.objeto_contrato.trim())    return "El Objeto es obligatorio"
    if (!func_.valor_inicial.trim())      return "El Valor del Contrato es obligatorio"
    return null
  }

  function parseNum(s: string): number | undefined {
    const n = parseFloat(s.replace(/[^0-9.]/g, ""))
    return isNaN(n) ? undefined : n
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validErr = tipo === "DERIVADO" ? validateDeri() : validateFunc()
    if (validErr) { setError(validErr); return }
    setLoading(true); setError(null)

    let result: { error: string | null }

    if (tipo === "DERIVADO") {
      result = await createDerivedContract({
        id_interadministrativo:   deri.id_interadministrativo,
        numero_contrato:          deri.numero_contrato.trim(),
        objeto_contrato:          deri.objeto_contrato.trim() || undefined,
        contratista:              deri.contratista.trim() || undefined,
        persona_natural_juridica: deri.persona_natural_juridica.trim() || undefined,
        nit_identificacion:       deri.nit_identificacion.trim() || undefined,
        numero_proceso_seleccion: deri.numero_proceso_seleccion.trim() || undefined,
        estado:                   deri.estado || undefined,
        fecha_suscripcion:        deri.fecha_suscripcion || undefined,
        fecha_inicio:             deri.fecha_inicio || undefined,
        fecha_terminacion:        deri.fecha_terminacion || undefined,
        plazo_ejecucion:          deri.plazo_ejecucion.trim() || undefined,
        supervisor:               deri.supervisor.trim() || undefined,
        link_ficha:               deri.link_ficha.trim() || undefined,
        valor_inicial:            parseNum(deri.valor_inicial),
        crp:                      deri.crp.trim() || undefined,
        fecha_crp:                deri.fecha_crp || undefined,
        enlace_carpeta:           deri.enlace_carpeta.trim() || undefined,
      })
    } else {
      result = await createFuncionamientoContract({
        numero_contrato:    func_.numero_contrato.trim(),
        contratista:        func_.contratista.trim() || undefined,
        nit_identificacion: func_.nit_identificacion.trim() || undefined,
        numero_proceso_seleccion: func_.numero_proceso_seleccion.trim() || undefined,
        modalidad_seleccion: func_.modalidad_seleccion.trim() || undefined,
        area_responsable:   func_.area_responsable.trim() || undefined,
        estado:             func_.estado || undefined,
        fecha_suscripcion:  func_.fecha_suscripcion || undefined,
        fecha_inicio:       func_.fecha_inicio || undefined,
        fecha_terminacion:  func_.fecha_terminacion || undefined,
        plazo_ejecucion:    func_.plazo_ejecucion.trim() || undefined,
        supervisor:         func_.supervisor.trim() || undefined,
        objeto_contrato:    func_.objeto_contrato.trim() || undefined,
        valor_inicial:      parseNum(func_.valor_inicial),
        cdp:                func_.cdp.trim() || undefined,
        fecha_cdp:          func_.fecha_cdp || undefined,
        crp:                func_.crp.trim() || undefined,
        fecha_crp:          func_.fecha_crp || undefined,
        enlace_carpeta:     func_.enlace_carpeta.trim() || undefined,
        link_ficha:         func_.link_ficha.trim() || undefined,
        observaciones:      func_.observaciones.trim() || undefined,
      })
    }

    if (result.error) { setError(result.error); setLoading(false); return }
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
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white border-l border-[#EAEAEA] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] shrink-0">
              <div>
                <h2 className="text-base font-bold text-[#002869]">Nuevo Contrato</h2>
                <p className="text-xs text-[#747783] mt-0.5">Registra un contrato derivado o de funcionamiento</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#f0f3ff] text-[#747783]">
                <X size={18} />
              </button>
            </div>

            {/* Tipo selector */}
            <div className="shrink-0 px-6 py-3 border-b border-[#EAEAEA] bg-[#f9fafb]">
              <p className={labelCls}>Tipo de Contrato <span className="text-red-500">*</span></p>
              <div className="flex gap-2">
                {(["DERIVADO", ...(canCreateFuncionamiento ? ["FUNCIONAMIENTO"] : [])] as Tipo[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipo(t); setError(null) }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                      tipo === t
                        ? "bg-[#0B3D91] text-white border-[#0B3D91]"
                        : "border-[#EAEAEA] text-[#434652] hover:bg-[#f0f3ff]"
                    )}
                  >
                    {t === "DERIVADO" ? "Derivado" : "Funcionamiento"}
                  </button>
                ))}
              </div>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {tipo === "DERIVADO" ? (
                <>
                  <Section label="Información General" />

                  {/* Interadministrativo */}
                  <div>
                    <Label required>Contrato Interadministrativo Asociado</Label>
                    <input
                      className={inputCls}
                      placeholder="Buscar por N° o por objeto…"
                      value={interSearch}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {interSearch && (
                      <div className="border border-[#EAEAEA] rounded-lg mt-1 max-h-40 overflow-y-auto bg-white shadow-lg">
                        {filteredIA.length === 0 ? (
                          <p className="text-xs text-[#747783] px-3 py-2">Sin resultados</p>
                        ) : filteredIA.slice(0, 10).map((ia) => (
                          <button
                            key={ia.id}
                            type="button"
                            onClick={() => { setD("id_interadministrativo", ia.id_contrato); setSearch("") }}
                            className="w-full text-left px-3 py-2 hover:bg-[#f0f3ff] text-sm border-b border-[#EAEAEA]/60 last:border-0"
                          >
                            <span className="font-semibold text-[#0B3D91]">{ia.id_contrato}</span>
                            {ia.objeto_contrato && (
                              <span className="text-[#747783] text-xs block truncate">{ia.objeto_contrato}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {deri.id_interadministrativo && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#0B3D91] bg-[#0B3D91]/10 px-2 py-0.5 rounded-full">
                          {deri.id_interadministrativo}
                        </span>
                        <button type="button" onClick={() => setD("id_interadministrativo", "")} className="text-[10px] text-[#747783] hover:text-red-500">✕ cambiar</button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label required>Número Contrato Derivado</Label>
                    <input className={inputCls} placeholder="Ej: OPS-001-2024" value={deri.numero_contrato} onChange={(e) => setD("numero_contrato", e.target.value)} />
                  </div>

                  <div>
                    <Label required>Objeto</Label>
                    <textarea className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white" rows={2} placeholder="Descripción del objeto contractual" value={deri.objeto_contrato} onChange={(e) => setD("objeto_contrato", e.target.value)} />
                  </div>

                  <Row>
                    <div>
                      <Label required>Contratista</Label>
                      <input className={inputCls} placeholder="Nombre o razón social" value={deri.contratista} onChange={(e) => setD("contratista", e.target.value)} />
                    </div>
                    <div>
                      <Label>Tipo Contratista</Label>
                      <select className={selectCls} value={deri.persona_natural_juridica} onChange={(e) => setD("persona_natural_juridica", e.target.value)}>
                        <option value="">— Sin especificar —</option>
                        <option>Persona Natural</option>
                        <option>Persona Jurídica</option>
                        <option>Consorcio</option>
                        <option>Unión Temporal</option>
                      </select>
                    </div>
                  </Row>

                  <Row>
                    <div>
                      <Label>N° Proceso de Selección</Label>
                      <input className={inputCls} placeholder="Ej: SA-BUI-07-2024" value={deri.numero_proceso_seleccion} onChange={(e) => setD("numero_proceso_seleccion", e.target.value)} />
                    </div>
                    <div>
                      <Label>NIT / Identificación</Label>
                      <input className={inputCls} placeholder="Ej: 900123456-7" value={deri.nit_identificacion} onChange={(e) => setD("nit_identificacion", e.target.value)} />
                    </div>
                  </Row>

                  <div>
                    <Label required>Estado</Label>
                    <select className={selectCls} value={deri.estado} onChange={(e) => setD("estado", e.target.value)}>
                      {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <Row>
                    <div>
                      <Label required>Fecha Suscripción</Label>
                      <input type="date" className={inputCls} value={deri.fecha_suscripcion} onChange={(e) => setD("fecha_suscripcion", e.target.value)} />
                    </div>
                    <div>
                      <Label required>Fecha Inicio</Label>
                      <input type="date" className={inputCls} value={deri.fecha_inicio} onChange={(e) => setD("fecha_inicio", e.target.value)} />
                    </div>
                  </Row>

                  <Row>
                    <div>
                      <Label required>Fecha Terminación</Label>
                      <input type="date" className={inputCls} value={deri.fecha_terminacion} onChange={(e) => setD("fecha_terminacion", e.target.value)} />
                    </div>
                    <div>
                      <Label>Plazo</Label>
                      <input className={inputCls} placeholder="Ej: 12 meses, 365 días" value={deri.plazo_ejecucion} onChange={(e) => setD("plazo_ejecucion", e.target.value)} />
                    </div>
                  </Row>

                  <div>
                    <Label>Supervisor</Label>
                    <input className={inputCls} placeholder="Nombre del supervisor" value={deri.supervisor} onChange={(e) => setD("supervisor", e.target.value)} />
                  </div>

                  <Section label="Información Financiera" />

                  <div>
                    <Label required>Valor Inicial</Label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={deri.valor_inicial} onChange={(e) => setD("valor_inicial", e.target.value)} />
                  </div>

                  <Row>
                    <div>
                      <Label>RP</Label>
                      <input className={inputCls} placeholder="N° Registro Presupuestal" value={deri.crp} onChange={(e) => setD("crp", e.target.value)} />
                    </div>
                    <div>
                      <Label>Fecha RP</Label>
                      <input type="date" className={inputCls} value={deri.fecha_crp} onChange={(e) => setD("fecha_crp", e.target.value)} />
                    </div>
                  </Row>

                  <Section label="Documentación" />

                  <Row>
                    <div>
                      <Label>Enlace Secop</Label>
                      <input type="url" className={inputCls} placeholder="https://…" value={deri.link_ficha} onChange={(e) => setD("link_ficha", e.target.value)} />
                    </div>
                    <div>
                      <Label>Enlace Carpeta Documental</Label>
                      <input type="url" className={inputCls} placeholder="https://drive.google.com/…" value={deri.enlace_carpeta} onChange={(e) => setD("enlace_carpeta", e.target.value)} />
                    </div>
                  </Row>
                </>
              ) : (
                <>
                  <Section label="Información General" />

                  <div>
                    <Label required>Número Contrato</Label>
                    <input className={inputCls} placeholder="Ej: CPS-001-2024" value={func_.numero_contrato} onChange={(e) => setF("numero_contrato", e.target.value)} />
                  </div>

                  <Row>
                    <div>
                      <Label required>Nombre Contratista</Label>
                      <input className={inputCls} placeholder="Nombre o razón social" value={func_.contratista} onChange={(e) => setF("contratista", e.target.value)} />
                    </div>
                    <div>
                      <Label>NIT / Identificación</Label>
                      <input className={inputCls} placeholder="Ej: 900123456-7" value={func_.nit_identificacion} onChange={(e) => setF("nit_identificacion", e.target.value)} />
                    </div>
                  </Row>

                  <div>
                    <Label required>N° Proceso de Selección</Label>
                    <input className={inputCls} placeholder="Ej: SA-BUI-07-2024" value={func_.numero_proceso_seleccion} onChange={(e) => setF("numero_proceso_seleccion", e.target.value)} />
                  </div>

                  <Row>
                    <div>
                      <Label required>Tipo Contratación</Label>
                      <input className={inputCls} placeholder="Ej: OPS, CPS, Prestación de servicios" value={func_.modalidad_seleccion} onChange={(e) => setF("modalidad_seleccion", e.target.value)} />
                    </div>
                    <div>
                      <Label required>Área</Label>
                      <input className={inputCls} placeholder="Área responsable" value={func_.area_responsable} onChange={(e) => setF("area_responsable", e.target.value)} />
                    </div>
                  </Row>

                  <Row>
                    <div>
                      <Label required>Estado</Label>
                      <select className={selectCls} value={func_.estado} onChange={(e) => setF("estado", e.target.value)}>
                        {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label required>Supervisor</Label>
                      <input className={inputCls} placeholder="Nombre del supervisor" value={func_.supervisor} onChange={(e) => setF("supervisor", e.target.value)} />
                    </div>
                  </Row>

                  <Row>
                    <div>
                      <Label required>Fecha Suscripción</Label>
                      <input type="date" className={inputCls} value={func_.fecha_suscripcion} onChange={(e) => setF("fecha_suscripcion", e.target.value)} />
                    </div>
                    <div>
                      <Label required>Fecha Inicio</Label>
                      <input type="date" className={inputCls} value={func_.fecha_inicio} onChange={(e) => setF("fecha_inicio", e.target.value)} />
                    </div>
                  </Row>

                  <Row>
                    <div>
                      <Label required>Fecha Terminación</Label>
                      <input type="date" className={inputCls} value={func_.fecha_terminacion} onChange={(e) => setF("fecha_terminacion", e.target.value)} />
                    </div>
                    <div>
                      <Label>Plazo</Label>
                      <input className={inputCls} placeholder="Ej: 12 meses" value={func_.plazo_ejecucion} onChange={(e) => setF("plazo_ejecucion", e.target.value)} />
                    </div>
                  </Row>

                  <div>
                    <Label required>Objeto</Label>
                    <textarea className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white" rows={2} placeholder="Descripción del objeto contractual" value={func_.objeto_contrato} onChange={(e) => setF("objeto_contrato", e.target.value)} />
                  </div>

                  <Section label="Información Financiera" />

                  <div>
                    <Label required>Valor Contrato</Label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={func_.valor_inicial} onChange={(e) => setF("valor_inicial", e.target.value)} />
                  </div>

                  <Row>
                    <div>
                      <Label>RP</Label>
                      <input className={inputCls} placeholder="N° Registro Presupuestal" value={func_.cdp} onChange={(e) => setF("cdp", e.target.value)} />
                    </div>
                    <div>
                      <Label>Fecha RP</Label>
                      <input type="date" className={inputCls} value={func_.fecha_cdp} onChange={(e) => setF("fecha_cdp", e.target.value)} />
                    </div>
                  </Row>

                  <Row>
                    <div>
                      <Label>CRP</Label>
                      <input className={inputCls} placeholder="N° Contrato Reg. Presupuestal" value={func_.crp} onChange={(e) => setF("crp", e.target.value)} />
                    </div>
                    <div>
                      <Label>Fecha CRP</Label>
                      <input type="date" className={inputCls} value={func_.fecha_crp} onChange={(e) => setF("fecha_crp", e.target.value)} />
                    </div>
                  </Row>

                  <Section label="Documentación" />

                  <div>
                    <Label>Enlace Carpeta Documental</Label>
                    <input type="url" className={inputCls} placeholder="https://drive.google.com/…" value={func_.enlace_carpeta} onChange={(e) => setF("enlace_carpeta", e.target.value)} />
                  </div>

                  <div>
                    <Label>Observaciones</Label>
                    <textarea className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 bg-white" rows={3} placeholder="Notas adicionales" value={func_.observaciones} onChange={(e) => setF("observaciones", e.target.value)} />
                  </div>
                </>
              )}
              <div className="h-2" />
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-[#EAEAEA] space-y-3 bg-white">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm font-medium text-[#747783] hover:bg-[#f0f3ff]">
                  Cancelar
                </button>
                <button type="submit" onClick={handleSubmit} disabled={loading || success}
                  className={cn(
                    "flex-1 h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                    success
                      ? "bg-emerald-500 text-white"
                      : "bg-[#0B3D91] text-white hover:bg-[#002869] disabled:opacity-60"
                  )}>
                  {loading  ? <><Loader2 size={15} className="animate-spin" />Guardando…</>
                  : success ? <><Check size={15} />Creado</>
                  : <><Save size={15} />Crear Contrato</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
