// Entidades de modificaciones contractuales
// Cada tipo es independiente y se relaciona con interadministrativos vía interadministrativo_id

export interface Adicion {
  id: number
  interadministrativo_id: number
  numero_adicion: number
  fecha_adicion: string
  valor_total: number | null
  valor_cuota_gerencia: number | null
  valor_bienes_servicios: number | null
  numero_rp: string | null
  motivo: string | null
  link_documental: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface Prorroga {
  id: number
  interadministrativo_id: number
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

export interface Suspension {
  id: number
  interadministrativo_id: number
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

export interface Reinicio {
  id: number
  interadministrativo_id: number
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

export interface Aclaratorio {
  id: number
  interadministrativo_id: number
  numero_aclaratorio: number
  fecha_suscripcion: string
  motivo: string | null
  descripcion: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface ModificacionesData {
  adiciones: Adicion[]
  prorrogas: Prorroga[]
  suspensiones: Suspension[]
  reinicios: Reinicio[]
  aclaratorios: Aclaratorio[]
}

export const EMPTY_MODIFICACIONES: ModificacionesData = {
  adiciones:    [],
  prorrogas:    [],
  suspensiones: [],
  reinicios:    [],
  aclaratorios: [],
}
