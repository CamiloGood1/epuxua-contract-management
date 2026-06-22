// Tipos para el módulo de expediente de Contratos Derivados (V2)
// FK: contrato_id → contratos.id (BIGINT)
// No modifica ningún tipo existente.

export interface ContractAdicion {
  id: number
  contrato_id: number
  numero_adicion: number
  fecha_adicion: string
  valor_adicion: number
  valor_bienes_servicios: number | null
  valor_cuota_gerencia: number | null
  motivo: string | null
  numero_cdp: string | null
  fecha_cdp: string | null
  numero_rp: string | null
  fecha_rp: string | null
  link_documental: string | null
  observaciones: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractProrroga {
  id: number
  contrato_id: number
  numero_prorroga: number
  fecha_suscripcion: string
  nueva_fecha_terminacion: string
  plazo_prorroga: string | null
  justificacion: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractSuspension {
  id: number
  contrato_id: number
  numero_suspension: number
  fecha_suscripcion: string | null
  inicio_suspension: string
  fin_suspension: string | null
  plazo_suspension: string | null
  motivo: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractReinicio {
  id: number
  contrato_id: number
  numero_reinicio: number
  fecha_reinicio: string
  fecha_suscripcion: string | null
  motivo: string | null
  observaciones: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractAclaratorio {
  id: number
  contrato_id: number
  numero_aclaratorio: number
  fecha_suscripcion: string
  motivo: string | null
  descripcion: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractPago {
  id: number
  contrato_id: number
  numero_pago: number
  fecha_pago: string
  valor_pagado: number
  numero_orden_pago: string | null
  numero_factura_contratista: string | null
  descuentos: number
  valor_neto_girado: number | null
  observaciones: string | null
  enlace_soporte: string | null
  factura_interadmin_id: number | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractTask {
  id: number
  contrato_id: number
  nombre: string
  descripcion: string
  fecha_compromiso: string
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA"
  responsable: string
  status: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA"
  fecha_completada: string | null
  enlace_evidencia_cierre: string | null
  comentario_cierre: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ContractChangeLogEntry {
  id: number
  contrato_id: number
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_by_id: string | null
  changed_at: string
}

export interface ContractModificacionesData {
  adiciones: ContractAdicion[]
  prorrogas: ContractProrroga[]
  suspensiones: ContractSuspension[]
  reinicios: ContractReinicio[]
  aclaratorios: ContractAclaratorio[]
}

export const EMPTY_CONTRACT_MODIFICACIONES: ContractModificacionesData = {
  adiciones: [],
  prorrogas: [],
  suspensiones: [],
  reinicios: [],
  aclaratorios: [],
}

export const CONTRACT_DERIVADO_FIELD_LABELS: Record<string, string> = {
  numero_contrato:      "N° Contrato",
  objeto_contrato:      "Objeto del Contrato",
  contratista:          "Contratista",
  supervisor:           "Supervisor",
  estado:               "Estado",
  fecha_suscripcion:    "Fecha de Suscripción",
  fecha_inicio:         "Fecha de Inicio",
  fecha_terminacion:    "Fecha de Terminación",
  plazo_ejecucion:      "Plazo de Ejecución",
  valor_inicial:        "Valor Inicial",
  adicion:              "Valor Adiciones",
  valor_final:          "Valor Final",
  valor_pagado:         "Valor Pagado",
  valor_pendiente:      "Valor Pendiente",
  modalidad_seleccion:  "Modalidad de Selección",
  clase_contrato:       "Clase de Contrato",
  area_responsable:     "Área Responsable",
  numero_poliza:        "N° Póliza",
  link_ficha:           "Enlace SECOP",
  enlace_carpeta:       "Enlace Carpeta Documental",
  observaciones:        "Observaciones",
}
