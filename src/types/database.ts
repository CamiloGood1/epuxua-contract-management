// Tipos para el esquema V2 normalizado (01_DDL_schema.sql)

export type EstadoContrato = 'EN EJECUCIÓN' | 'TERMINADO' | 'LIQUIDADO'
export type TipoContrato   = 'DERIVADO' | 'FUNCIONAMIENTO'

export interface Interadministrativo {
  id: number
  id_contrato: string                    // ej: '3407-2021'
  modalidad_seleccion: string | null
  secretaria: string | null
  objeto_contrato: string | null
  clase_contrato: string | null
  area_responsable: string | null
  supervision: string | null             // puede tener varios separados por ' / '
  plazo_ejecucion_inicial: string | null
  fecha_suscripcion: string | null       // ISO date string
  fecha_inicio_ejecucion: string | null
  prorroga: string | null                // texto libre histórico
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
  suspension: string | null              // duración texto libre
  reinicio: string | null                // ISO date string
  fecha_terminacion: string | null
  estado: EstadoContrato
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface Contrato {
  id: number
  origen_hoja: string                    // ej: 'Contratación_2024'
  proyecto_ref: string                   // ID contrato o referencia
  tipo_contrato: TipoContrato
  id_interadministrativo: string | null  // NULL para FUNCIONAMIENTO
  created_at: string
  updated_at: string
  // Relación join (opcional)
  interadministrativo?: Pick<Interadministrativo, 'id_contrato' | 'objeto_contrato' | 'estado'>
}

export interface OtroContrato {
  id: number
  origen_hoja: string
  proyecto_ref: string
  tipo_contrato: string
  created_at: string
}

export interface CatItem {
  id: number
  valor: string
}
