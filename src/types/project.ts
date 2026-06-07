// Tipos que mapean vistas y tablas V3 de proyectos en Supabase

export type ProjectType =
  | "INTERADMINISTRATIVO"
  | "FUNCIONAMIENTO"
  | "OPERACION_COMERCIAL"
  | "TIENDA_VIRTUAL"
  | "PAGO_FACTURA"

export type ProjectLifecycle =
  | "PLANEACION"
  | "CONTRATACION"
  | "EJECUCION"
  | "SEGUIMIENTO"
  | "LIQUIDACION"
  | "CERRADO"

export type ManagementFeeType = "PORCENTAJE" | "VALOR_FIJO"

export type ProjectAssignmentRole = "GERENTE_PROYECTO" | "CONSULTOR_PROYECTO"

export type UserRole =
  | "ADMIN"
  | "GERENTE"
  | "GERENTE_PROYECTO"
  | "DIRECTIVO"
  | "CONSULTOR_PROYECTO"
  | "ESPECTADOR"

// ── v_project_detail ──────────────────────────────────────────────────────────

export interface ProjectDetail {
  id: string
  project_code: string
  name: string
  project_type: ProjectType
  year: number
  lifecycle_status: ProjectLifecycle
  responsible_area_id: string | null
  area_name: string | null
  secretaria: string | null
  primary_contract_id: string | null
  total_value: number
  goods_services_value: number
  management_fee_type: ManagementFeeType | null
  management_fee_value: number | null
  management_fee_amount: number
  executed_value: number
  paid_value: number
  available_balance: number
  execution_pct: number
  active_alerts_count: number
  observations: string | null
  created_at: string
  updated_at: string
  // Campos enriquecidos por v_project_detail
  primary_contract_number: string | null
  derived_count: number | null
  assigned_users_count: number | null
  // Enriquecido en app (project_assignments), no viene de la vista
  manager_name?: string | null
}

// ── v_project_kanban ──────────────────────────────────────────────────────────

export interface ProjectKanbanCard {
  id: string
  project_code: string
  name: string
  project_type: ProjectType
  year: number
  lifecycle_status: ProjectLifecycle
  total_value: number
  goods_services_value: number
  management_fee_amount: number
  execution_pct: number
  active_alerts_count: number
  area_name: string | null
  secretaria: string | null
  manager_name: string | null
}

// ── v_project_dashboard ───────────────────────────────────────────────────────

export interface ProjectDashboardMetrics {
  total_projects: number
  active_projects: number
  closed_projects: number
  total_value: number
  total_executed: number
  total_available: number
  avg_execution_pct: number
  projects_with_alerts: number
  by_lifecycle: Record<ProjectLifecycle, number>
  by_type: Record<ProjectType, number>
}

// ── v_project_contract_tree ───────────────────────────────────────────────────

export type ContractRole = "PRINCIPAL" | "DERIVADO" | "OPERATIVO"

export interface ProjectContractTreeNode {
  project_id: string
  contract_id: string
  contract_number: string
  contract_role: ContractRole
  parent_contract_id: string | null
  depth: number
  contractor_name: string | null
  status: string | null
  final_value: number | null
  paid_value: number | null
  object: string | null
  secop_url: string | null
}

// ── v_project_financial ───────────────────────────────────────────────────────

export interface ProjectFinancialSummary {
  project_id: string
  total_value: number
  goods_services_value: number
  management_fee_amount: number
  executed_value: number
  paid_value: number
  available_balance: number
  execution_pct: number
  budget_committed: number | null
  budget_available: number | null
}

export interface ProjectPayment {
  id: string
  project_id: string
  contract_id: string | null
  payment_date: string
  gross_value: number
  deductions: number
  net_value: number
  description: string | null
  contract_number: string | null
}

// ── Tablas auxiliares ─────────────────────────────────────────────────────────

export interface ProjectFollowup {
  id: string
  project_id: string
  followup_date: string
  period_label: string | null
  physical_progress: number | null
  financial_progress: number | null
  alert_level: "VERDE" | "AMARILLO" | "ROJO" | null
  observations: string | null
  risks: string | null
  corrective_actions: string | null
  next_actions: string | null
  recorded_by: string | null
  created_at: string
}

export interface ProjectDocument {
  id: string
  project_id: string
  contract_id?: string | null
  document_type: string | null
  name: string
  sharepoint_url: string | null
  secop_document_url: string | null
  created_at: string
}

export interface ProjectIndicator {
  id: string
  project_id: string
  indicator_name: string
  indicator_value: number | null
  target_value: number | null
  unit: string | null
  period_label: string | null
  recorded_at: string | null
}

export interface ProjectAlert {
  id: string
  project_id: string
  project_code: string | null
  project_name: string | null
  alert_type: string
  severity: "critica" | "alta" | "media" | "baja" | "info"
  title: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface ProjectAssignment {
  id: string
  project_id: string
  user_id: string
  assignment_role: ProjectAssignmentRole
  start_date: string
  end_date: string | null
  active: boolean
  user_name: string | null
  user_email: string | null
}
