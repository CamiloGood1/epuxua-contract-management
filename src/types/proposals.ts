// ── Enums ─────────────────────────────────────────────────────────────────────

export type ProposalStatus =
  | "RECIBIDA"
  | "EN_ESTRUCTURACION"
  | "EN_REVISION"
  | "PRESENTADA"
  | "GANADA"
  | "NO_ADJUDICADA"
  | "DESISTIDA"

export type ProposalType =
  | "INTERADMINISTRATIVO"
  | "CONVENIO"
  | "CONSULTORIA"
  | "INTERVENTORIA"
  | "ASISTENCIA_TECNICA"
  | "OTROS"

// ── Status metadata ───────────────────────────────────────────────────────────

export const PROPOSAL_STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  RECIBIDA:          { label: "Recibida",           bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200",  dot: "bg-blue-500"   },
  EN_ESTRUCTURACION: { label: "En Estructuración",  bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200", dot: "bg-amber-500"  },
  EN_REVISION:       { label: "En Revisión",        bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200",dot: "bg-purple-500" },
  PRESENTADA:        { label: "Presentada",         bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200",  dot: "bg-cyan-500"   },
  GANADA:            { label: "Ganada",             bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-500"},
  NO_ADJUDICADA:     { label: "No Adjudicada",      bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",   dot: "bg-red-500"    },
  DESISTIDA:         { label: "Desistida",          bg: "bg-gray-50",    text: "text-gray-600",   border: "border-gray-200",  dot: "bg-gray-400"   },
}

export const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
  INTERADMINISTRATIVO: "Interadministrativo",
  CONVENIO:            "Convenio",
  CONSULTORIA:         "Consultoría",
  INTERVENTORIA:       "Interventoría",
  ASISTENCIA_TECNICA:  "Asistencia Técnica",
  OTROS:               "Otros",
}

export const PROPOSAL_STATUS_ORDER: ProposalStatus[] = [
  "RECIBIDA",
  "EN_ESTRUCTURACION",
  "EN_REVISION",
  "PRESENTADA",
  "GANADA",
  "NO_ADJUDICADA",
  "DESISTIDA",
]

export const PROPOSAL_TYPE_ORDER: ProposalType[] = [
  "INTERADMINISTRATIVO",
  "CONVENIO",
  "CONSULTORIA",
  "INTERVENTORIA",
  "ASISTENCIA_TECNICA",
  "OTROS",
]

// ── Entity ────────────────────────────────────────────────────────────────────

export interface ProposalRequest {
  id: number
  reception_date: string
  client_name: string
  proposal_object: string
  proposal_delivery_deadline: string
  proposal_type: ProposalType
  status: ProposalStatus
  submission_date: string | null
  request_link: string | null
  proposal_link: string | null
  observations: string | null
  created_by: string | null
  created_by_id: string | null
  updated_by: string | null
  updated_by_id: string | null
  created_at: string
  updated_at: string
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface ProposalAuditEntry {
  id: number
  proposal_id: number
  action: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_by_id: string | null
  changed_at: string
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export interface ProposalKPIs {
  total: number
  recibidas: number
  enEstructuracion: number
  enRevision: number
  presentadas: number
  ganadas: number
  noAdjudicadas: number
  vencenProximas: number   // plazo ≤ 3 días y estado activo
  vencidas: number         // plazo pasado y estado activo
}

export function calcProposalKPIs(proposals: ProposalRequest[]): ProposalKPIs {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const plus3Ms  = todayMs + 3 * 86400000

  const ACTIVE_STATUSES: ProposalStatus[] = ["RECIBIDA", "EN_ESTRUCTURACION", "EN_REVISION", "PRESENTADA"]

  return {
    total:            proposals.length,
    recibidas:        proposals.filter(p => p.status === "RECIBIDA").length,
    enEstructuracion: proposals.filter(p => p.status === "EN_ESTRUCTURACION").length,
    enRevision:       proposals.filter(p => p.status === "EN_REVISION").length,
    presentadas:      proposals.filter(p => p.status === "PRESENTADA").length,
    ganadas:          proposals.filter(p => p.status === "GANADA").length,
    noAdjudicadas:    proposals.filter(p => p.status === "NO_ADJUDICADA").length,
    vencenProximas:   proposals.filter(p => {
      if (!ACTIVE_STATUSES.includes(p.status)) return false
      const dl = new Date(p.proposal_delivery_deadline + "T00:00:00").getTime()
      return dl >= todayMs && dl <= plus3Ms
    }).length,
    vencidas:         proposals.filter(p => {
      if (!ACTIVE_STATUSES.includes(p.status)) return false
      const dl = new Date(p.proposal_delivery_deadline + "T00:00:00").getTime()
      return dl < todayMs
    }).length,
  }
}

// ── Field labels (for audit log display) ────────────────────────────────────

export const PROPOSAL_FIELD_LABELS: Record<string, string> = {
  reception_date:              "Fecha de Recepción",
  client_name:                 "Cliente",
  proposal_object:             "Objeto",
  proposal_delivery_deadline:  "Plazo de Entrega",
  proposal_type:               "Tipología",
  status:                      "Estado",
  submission_date:             "Fecha de Remisión",
  request_link:                "Enlace Solicitud",
  proposal_link:               "Enlace Propuesta",
  observations:                "Observaciones",
}

// ── Days helpers ──────────────────────────────────────────────────────────────

export function daysUntilDeadline(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dl = new Date(deadline + "T00:00:00")
  return Math.round((dl.getTime() - today.getTime()) / 86400000)
}
