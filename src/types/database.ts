// ── Enums / tipos base ────────────────────────────────────────────────────────

/** Estado del interadministrativo (ENUM en DB — ejecutar MIGRATION_INTERADMIN_FORM.sql para los 4 nuevos valores) */
export type EstadoInteradministrativo =
  | 'PLANEACIÓN'
  | 'CONTRATACIÓN'
  | 'EN EJECUCIÓN'
  | 'SUSPENDIDO'
  | 'TERMINADO'
  | 'LIQUIDADO'
  | 'TERMINADO ANTICIPADAMENTE'

export type TipoContrato = 'DERIVADO' | 'FUNCIONAMIENTO'

/** Estado del contrato derivado / funcionamiento (TEXT en DB, 9 valores canónicos) */
export type EstadoContrato =
  | 'EN EJECUCIÓN'
  | 'CIERRE CONTRACTUAL'
  | 'TERMINADO'
  | 'LIQUIDADO'
  | 'TERMINADO ANTICIPADAMENTE'
  | 'SUSPENDIDO'
  | 'DECLARADO FALLIDO'
  | 'NO SUSCRITO'
  | 'TERMINADO ANORMALMENTE'

// ── interadministrativos — 60 registros ───────────────────────────────────────

export interface Interadministrativo {
  id: number
  id_contrato: string                    // ej: '3407-2021' — nunca convertir a número
  modalidad_seleccion: string | null
  secretaria: string | null
  objeto_contrato: string | null
  clase_contrato: string | null
  area_responsable: string | null
  supervision: string | null             // puede ser 'A / B' si hay dos supervisores
  plazo_ejecucion_inicial: string | null
  fecha_suscripcion: string | null
  fecha_inicio_ejecucion: string | null
  prorroga: string | null
  valor_inicial: number | null
  adicion: number | null
  total_contrato: number | null
  cuota_admin_inicial: number | null
  adicion_cuota_admin: number | null
  total_cuota_admin: number | null
  bolsa_gerencia_inicial: number | null
  adicion_bolsa_mandato: number | null
  total_bolsa_mandato: number | null
  valor_pendiente_cobrar: number | null
  vigencias_futuras: number | null
  suspension: string | null
  reinicio: string | null
  fecha_terminacion: string | null
  estado: EstadoInteradministrativo
  categoria: string | null
  pct_cuota_gerencia: number | null
  link_secop: string | null
  link_documentacion: string | null
  observaciones: string | null
  avance_fisico_pct: number | null
  created_at: string
  updated_at: string
  contratos?: Contrato[]
}

// ── contratos — 470 registros (DERIVADO + FUNCIONAMIENTO) ────────────────────

export interface Contrato {
  id: number
  origen_hoja: string | null
  numero_contrato: string | null         // ej: '001-2024' (era proyecto_ref)
  numero_proceso: string | null
  numero_proceso_seleccion: string | null
  tipo_contrato: TipoContrato
  id_interadministrativo: string | null  // null para FUNCIONAMIENTO
  modalidad_seleccion: string | null
  contratista: string | null
  objeto_contrato: string | null
  persona_natural_juridica: string | null
  clase_contrato: string | null
  area_responsable: string | null
  supervisor: string | null
  fecha_suscripcion: string | null
  plazo_ejecucion: string | null
  fecha_inicio: string | null
  valor_inicial: number | null
  adicion: number | null
  valor_final: number | null
  prorroga: string | null
  fecha_terminacion: string | null
  valor_pagado: number | null
  valor_pendiente: number | null
  vigencia_futura: number | null
  recurso: string | null
  rubro: string | null
  cdp: string | null
  fecha_cdp: string | null
  crp: string | null
  fecha_crp: string | null
  enlace_carpeta: string | null
  suspension: string | null
  reinicio: string | null
  observaciones: string | null
  estado: EstadoContrato | null
  link_ficha: string | null
  numero_poliza: string | null
  fecha_aprobacion_poliza: string | null
  created_at: string
  updated_at: string
  interadministrativo?: Pick<Interadministrativo,
    'id_contrato' | 'objeto_contrato' | 'secretaria' |
    'estado' | 'total_contrato' | 'valor_pendiente_cobrar'
  > | null
}

export interface OtroContrato {
  id: number
  origen_hoja: string | null
  numero_contrato: string | null
  tipo_contrato: string
  created_at: string
}

export interface CatItem {
  id: number
  valor: string
}
