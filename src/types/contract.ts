// Tipos que mapean exactamente la vista v_contract_detail de Supabase

export type ContractType =
  | 'DIRECTO'
  | 'DERIVADO'
  | 'INTERADMINISTRATIVO'
  | 'TIENDA_VIRTUAL'
  | 'PAGO_FACTURA'

export type ContractStatus =
  | 'EN_EJECUCION'
  | 'SUSPENDIDO'
  | 'TERMINADO'
  | 'TERMINADO_ANTICIPADAMENTE'
  | 'LIQUIDADO'
  | 'CIERRE_CONTRACTUAL'
  | 'DECLARADO_FALLIDO'
  | 'ACTA_NO_EJECUCION'
  | 'NO_SUSCRIPCION'

export type SelectionModality =
  | 'CONTRATACION_DIRECTA'
  | 'INVITACION_ABIERTA'
  | 'INVITACION_PRESELECCIONADOS'
  | 'CONCURSO_MERITOS'
  | 'ORDEN_COMPRA'
  | 'ACUERDO_MARCO'
  | 'TIENDA_VIRTUAL'
  | 'PAGO_FACTURA'

// ── Contrato principal (columnas de v_contract_detail) ────────────────────────

export interface Contract {
  // Identificación
  id: string
  contract_number: string
  year: number
  contract_type: ContractType
  selection_modality: SelectionModality
  contract_class: string
  resource_type: string | null

  // Descripción
  object: string

  // Partes
  contractor_id: string
  contractor_name: string
  contractor_document: string | null
  contractor_person_type: 'NATURAL' | 'JURIDICA'
  supervisor_id: string | null
  supervisor_name: string | null
  responsible_area_id: string | null
  area_name: string | null

  // PAA
  paa_code: string | null
  paa_description: string | null
  paa_estimated_value: number | null

  // Fechas
  subscription_date: string
  publication_date: string | null
  start_date: string | null
  initial_term_text: string | null
  initial_term_days: number | null
  end_date: string | null
  liquidation_date: string | null
  file_closure_date: string | null

  // Valores financieros
  monthly_value: number | null
  initial_value: number
  total_additions_value: number
  final_value: number          // calculado: initial + additions
  paid_value: number
  pending_value: number        // calculado: final - paid
  future_validity: number

  // Estado
  status: ContractStatus

  // Externos
  secop_url: string | null
  technical_file_url: string | null
  interventor: string | null
  observations: string | null

  // Campos calculados por la vista
  financial_progress_pct: number  // paid / final * 100
  days_remaining: number | null   // end_date - today

  // Interadmin (solo si contract_type = INTERADMINISTRATIVO)
  secretaria: string | null
  admin_fee_initial: number | null
  admin_fee_additions: number | null
  admin_fee_total: number | null
  mandate_pool_initial: number | null
  mandate_pool_additions: number | null
  mandate_pool_total: number | null
  pending_collection: number | null

  // Pago contra factura (solo si contract_type = PAGO_FACTURA)
  committee_number: string | null
  committee_act_info: string | null
  invoice_date: string | null
  requesting_officer: string | null

  // Póliza
  policy_number: string | null
  policy_issuer: string | null
  policy_start: string | null
  policy_end: string | null
  policy_approval: string | null

  // Jerarquía
  parent_contract_id: string | null
  parent_contract_number: string | null

  created_at: string
  updated_at: string
}

// ── Seguimiento periódico (contract_followups) ────────────────────────────────

export type FollowupAlertLevel = 'VERDE' | 'AMARILLO' | 'ROJO'

export interface ContractFollowup {
  id: string
  contract_id: string
  followup_date: string
  period_label: string | null
  physical_progress: number | null
  financial_progress: number | null
  alert_level: FollowupAlertLevel
  observations: string | null
  risks: string | null
  corrective_actions: string | null
  next_actions: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
}

// ── Vista de seguimiento (v_contract_tracking) ────────────────────────────────

export interface ContractTracking extends Pick<Contract,
  'id' | 'contract_number' | 'year' | 'contract_type' | 'object' | 'status' |
  'start_date' | 'end_date' | 'initial_value' | 'total_additions_value' |
  'final_value' | 'paid_value' | 'financial_progress_pct' | 'days_remaining' |
  'contractor_name' | 'supervisor_name' | 'area_name'
> {
  time_progress_pct: number | null
  last_followup_date: string | null
  last_physical_progress: number | null
  last_financial_progress: number | null
  last_alert_level: 'VERDE' | 'AMARILLO' | 'ROJO' | null
  last_payment_date: string | null
  payment_count: number
}

// ── Formulario de nuevo contrato ──────────────────────────────────────────────

export interface NewContractInput {
  contract_number: string
  year: number
  contract_type: ContractType
  contract_class: string
  selection_modality: SelectionModality
  object: string
  contractor_name: string
  contractor_person_type: 'NATURAL' | 'JURIDICA'
  supervisor_name?: string
  area_name?: string
  status: ContractStatus
  subscription_date: string
  start_date?: string
  end_date?: string
  initial_value: number
}
