"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { formatPctEjecutado } from "@/modules/contracts/lib/derived-contract-financials"
// ── Tipos mínimos necesarios (compatibles con DerivedContractRow y FuncionamientoContrato) ─

export interface ContractDetailData {
  id: number
  numero_contrato:          string | null
  numero_proceso:           string | null
  numero_proceso_seleccion: string | null
  nit_identificacion:       string | null
  tipo_contrato:            string
  origen_hoja:              string | null
  id_interadministrativo:   string | null
  modalidad_seleccion:      string | null
  contratista:              string | null
  objeto_contrato:          string | null
  persona_natural_juridica: string | null
  clase_contrato:           string | null
  area_responsable:         string | null
  supervisor:               string | null
  fecha_suscripcion:        string | null
  plazo_ejecucion:          string | null
  fecha_inicio:             string | null
  valor_inicial:            number | null
  adicion:                  number | null
  valor_final:              number | null
  prorroga:                 string | null
  fecha_terminacion:        string | null
  valor_pagado:             number | null
  valor_pendiente:          number | null
  vigencia_futura:          number | null
  recurso:                  string | null
  rubro:                    string | null
  cdp:                      string | null
  fecha_cdp:                string | null
  crp:                      string | null
  fecha_crp:                string | null
  link_carpeta_documental:           string | null
  suspension:               string | null
  reinicio:                 string | null
  observaciones:            string | null
  estado:                   string | null
  link_ficha:               string | null
  numero_poliza:            string | null
  fecha_aprobacion_poliza:  string | null
  // Optional parent info (derivados)
  parent_objeto?:     string | null
  parent_secretaria?: string | null
  parent_estado?:     string | null
  parent_total?:      number | null
  /** Resumen financiero calculado (derivados) */
  financials?: import("@/modules/contracts/lib/derived-contract-financials").DerivedContractFinancials
}

// ── Colores de estado ─────────────────────────────────────────────────────────

const ESTADO_MAP: Record<string, { cls: string; dot: string }> = {
  "EN EJECUCIÓN":             { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "CIERRE CONTRACTUAL":       { cls: "bg-amber-50  text-amber-700  border-amber-200",    dot: "bg-amber-500"  },
  "TERMINADO":                { cls: "bg-slate-50  text-slate-600  border-slate-200",    dot: "bg-slate-400"  },
  "LIQUIDADO":                { cls: "bg-blue-50   text-blue-700   border-blue-200",     dot: "bg-blue-500"   },
  "TERMINADO ANTICIPADAMENTE":{ cls: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
  "SUSPENDIDO":               { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500" },
  "DECLARADO FALLIDO":        { cls: "bg-red-50    text-red-700    border-red-200",      dot: "bg-red-500"    },
  "NO SUSCRITO":              { cls: "bg-gray-50   text-gray-500   border-gray-200",     dot: "bg-gray-400"   },
  "TERMINADO ANORMALMENTE":   { cls: "bg-rose-50   text-rose-700   border-rose-200",     dot: "bg-rose-500"   },
}

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-muted-foreground text-sm">Sin estado</span>
  const cfg = ESTADO_MAP[estado] ?? { cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", cfg.cls)}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
      {estado}
    </span>
  )
}

// ── Componentes de layout ─────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
  return (
    <div className="pt-6 pb-2 border-b border-border">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  )
}

function Field({ label, value, mono, url }: {
  label: string
  value: string | number | null | undefined
  mono?: boolean
  url?: string | null
}) {
  const display = value != null && value !== "" ? String(value) : "—"
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("text-sm break-words text-[var(--corporate-blue)] hover:underline flex items-center gap-1", mono && "font-mono")}
        >
          {display} <ExternalLink size={11} />
        </a>
      ) : (
        <p className={cn("text-sm break-words", mono && "font-mono", display === "—" && "text-muted-foreground")}>{display}</p>
      )}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4">{children}</div>
}

// ── Drawer principal ──────────────────────────────────────────────────────────

interface Props {
  contract: ContractDetailData | null
  onClose: () => void
}

export function ContractDetailDrawer({ contract, onClose }: Props) {
  const open = contract !== null

  // Cerrar con Escape
  if (typeof window !== "undefined") {
    // handled via useEffect pattern below — but since we can't use hooks at top level,
    // the overlay click + button are sufficient
  }

  const fin = contract?.financials
  const valorContrato = fin?.valorActual ?? contract?.valor_final ?? contract?.valor_inicial ?? null
  const valorPagado   = fin?.valorPagado ?? contract?.valor_pagado ?? null
  const saldoPendiente = fin?.saldoPendiente ?? contract?.valor_pendiente ?? null
  const pctEjecutado  = fin?.pctEjecutado ?? (
    valorContrato && valorContrato > 0 && valorPagado != null
      ? Math.round((valorPagado / valorContrato) * 10000) / 100
      : null
  )

  return (
    <AnimatePresence>
      {open && contract && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                    {contract.tipo_contrato}
                  </span>
                  <EstadoBadge estado={contract.estado} />
                </div>
                <h2 className="text-lg font-bold text-foreground font-mono leading-tight">
                  {contract.numero_contrato ?? "Sin número"}
                </h2>
                {contract.objeto_contrato && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contract.objeto_contrato}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

              {/* Resumen financiero */}
              {(valorContrato != null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4">
                  <div className="epuxua-card p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      {fin ? "Valor actual" : "Valor final"}
                    </p>
                    <p className="text-base font-bold text-foreground tabular-nums">
                      {formatCOP(valorContrato)}
                    </p>
                  </div>
                  <div className="epuxua-card p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Pagado</p>
                    <p className="text-base font-bold text-emerald-600 tabular-nums">
                      {valorPagado != null ? formatCOP(valorPagado) : "—"}
                    </p>
                  </div>
                  <div className="epuxua-card p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Pendiente {fin ? `(${formatPctEjecutado(fin.pctEjecutado)} ejec.)` : pctEjecutado != null ? `(${pctEjecutado}%)` : ""}
                    </p>
                    <p className={cn("text-base font-bold tabular-nums", saldoPendiente && saldoPendiente > 0 ? "text-amber-600" : "text-foreground")}>
                      {saldoPendiente != null ? formatCOP(saldoPendiente) : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Contratista */}
              <Section title="Contratista" />
              <div className="pt-3 space-y-4">
                <Row>
                  <Field label="Nombre / Razón social" value={contract.contratista} />
                  <Field label="Tipo de persona" value={contract.persona_natural_juridica} />
                </Row>
              </div>

              {/* Identificación del contrato */}
              <Section title="Identificación" />
              <div className="pt-3 space-y-4">
                <Row>
                  <Field label="N° Contrato" value={contract.numero_contrato} mono />
                  <Field label="N° Proceso de Selección" value={contract.numero_proceso_seleccion ?? contract.numero_proceso} mono />
                </Row>
                {contract.nit_identificacion && (
                  <Row>
                    <Field label="NIT / Identificación" value={contract.nit_identificacion} mono />
                    <span />
                  </Row>
                )}
                <Row>
                  <Field label="Modalidad de selección" value={contract.modalidad_seleccion} />
                  <Field label="Clase de contrato" value={contract.clase_contrato} />
                </Row>
                <Row>
                  <Field label="Hoja de origen" value={contract.origen_hoja} />
                  <Field label="Área responsable" value={contract.area_responsable} />
                </Row>
                <Row>
                  <Field label="Supervisor" value={contract.supervisor} />
                  <Field label="Recurso" value={contract.recurso} />
                </Row>
                {contract.rubro && (
                  <Field label="Rubro" value={contract.rubro} />
                )}
              </div>

              {/* Fechas y plazos */}
              <Section title="Fechas y plazos" />
              <div className="pt-3 space-y-4">
                <Row>
                  <Field label="Fecha suscripción" value={contract.fecha_suscripcion} />
                  <Field label="Fecha inicio" value={contract.fecha_inicio} />
                </Row>
                <Row>
                  <Field label="Plazo de ejecución" value={contract.plazo_ejecucion} />
                  <Field label="Fecha terminación" value={contract.fecha_terminacion} />
                </Row>
                {(contract.prorroga || contract.suspension || contract.reinicio) && (
                  <Row>
                    <Field label="Prórroga" value={contract.prorroga} />
                    <Field label="Suspensión" value={contract.suspension} />
                  </Row>
                )}
                {contract.reinicio && (
                  <Field label="Reinicio" value={contract.reinicio} />
                )}
              </div>

              {/* Financiero */}
              <Section title="Información financiera" />
              <div className="pt-3 space-y-4">
                <Row>
                  <Field label="Valor inicial" value={contract.valor_inicial != null ? formatCOP(contract.valor_inicial) : null} />
                  <Field label="Adición" value={contract.adicion != null ? formatCOP(contract.adicion) : null} />
                </Row>
                <Row>
                  <Field label="Valor final" value={contract.valor_final != null ? formatCOP(contract.valor_final) : null} />
                  <Field label="Vigencia futura" value={contract.vigencia_futura != null ? formatCOP(contract.vigencia_futura) : null} />
                </Row>
                <Row>
                  <Field label="Valor pagado" value={valorPagado != null ? formatCOP(valorPagado) : null} />
                  <Field label="Valor pendiente" value={saldoPendiente != null ? formatCOP(saldoPendiente) : null} />
                </Row>
                {fin && (
                  <Field label="% Ejecutado" value={formatPctEjecutado(fin.pctEjecutado)} />
                )}
              </div>

              {/* CDP / CRP */}
              {(contract.cdp || contract.crp) && (
                <>
                  <Section title="CDP / CRP" />
                  <div className="pt-3 space-y-4">
                    <Row>
                      <Field label="CDP" value={contract.cdp} mono />
                      <Field label="Fecha CDP" value={contract.fecha_cdp} />
                    </Row>
                    <Row>
                      <Field label="CRP" value={contract.crp} mono />
                      <Field label="Fecha CRP" value={contract.fecha_crp} />
                    </Row>
                  </div>
                </>
              )}

              {/* Enlace Carpeta Documental */}
              {contract.link_carpeta_documental && (
                <>
                  <Section title="Carpeta Documental" />
                  <div className="pt-3">
                    <Field label="Enlace" value={contract.link_carpeta_documental} url={contract.link_carpeta_documental} />
                  </div>
                </>
              )}

              {/* Póliza */}
              {(contract.numero_poliza || contract.fecha_aprobacion_poliza) && (
                <>
                  <Section title="Póliza" />
                  <div className="pt-3 space-y-4">
                    <Row>
                      <Field label="N° Póliza" value={contract.numero_poliza} mono />
                      <Field label="Fecha aprobación" value={contract.fecha_aprobacion_poliza} />
                    </Row>
                  </div>
                </>
              )}

              {/* Ficha SECOP */}
              {contract.link_ficha && (
                <>
                  <Section title="Enlace" />
                  <div className="pt-3">
                    <Field label="Ficha SECOP" value={contract.link_ficha} url={contract.link_ficha} />
                  </div>
                </>
              )}

              {/* Contrato padre (solo derivados) */}
              {contract.id_interadministrativo && (
                <>
                  <Section title="Contrato interadministrativo padre" />
                  <div className="pt-3 space-y-4">
                    <Row>
                      <Field label="N° Contrato padre" value={contract.id_interadministrativo} mono />
                      <Field label="Estado padre" value={contract.parent_estado ?? null} />
                    </Row>
                    {contract.parent_objeto && (
                      <Field label="Objeto del convenio" value={contract.parent_objeto} />
                    )}
                    <Row>
                      <Field label="Secretaría" value={contract.parent_secretaria ?? null} />
                      <Field label="Total convenio" value={contract.parent_total != null ? formatCOP(contract.parent_total) : null} />
                    </Row>
                  </div>
                </>
              )}

              {/* Observaciones */}
              {contract.observaciones && (
                <>
                  <Section title="Observaciones" />
                  <div className="pt-3">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{contract.observaciones}</p>
                  </div>
                </>
              )}

              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
