import type { Contract } from "@/types/contract"
import type {
  ProjectDetail,
  ProjectContractTreeNode,
  ProjectFollowup,
  ProjectAssignment,
  ProjectDocument,
  ProjectIndicator,
  ProjectAlert,
  ProjectFinancialSummary,
  ProjectPayment,
} from "@/types/project"

export interface ExpedienteContractNode extends ProjectContractTreeNode {
  supervisor_name: string | null
  start_date: string | null
  end_date: string | null
  subscription_date: string | null
  days_remaining: number | null
  documents: ProjectDocument[]
}

export interface ProjectBudgetMovement {
  id: string
  contract_id: string
  contract_number: string | null
  commitment_type: string
  number: string
  value: number
  budget_code: string | null
  date: string | null
  is_addition: boolean
}

export interface ProjectExpedienteComputed {
  contracted_value: number
  derived_count: number
  active_contracts: number
  expiring_contracts: number
  expired_contracts: number
  open_alerts: number
  closed_alerts: number
}

export interface ProjectExpedienteData {
  project: ProjectDetail
  primary_contract: Contract | null
  contract_tree: ExpedienteContractNode[]
  followups: ProjectFollowup[]
  assignments: ProjectAssignment[]
  documents: ProjectDocument[]
  indicators: ProjectIndicator[]
  alerts: ProjectAlert[]
  financial: ProjectFinancialSummary | null
  payments: ProjectPayment[]
  movements: ProjectBudgetMovement[]
  computed: ProjectExpedienteComputed
}

export type ExpedienteTabId =
  | "resumen"
  | "estructura"
  | "financiero"
  | "seguimiento"
  | "documentos"
  | "indicadores"
  | "alertas"
