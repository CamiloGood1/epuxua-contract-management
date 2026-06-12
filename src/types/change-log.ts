export interface ChangeLogEntry {
  id: number
  interadministrativo_id: number
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_by_id: string | null
  changed_at: string
}

export const FIELD_LABELS: Record<string, string> = {
  id_contrato:            "N° Contrato",
  objeto_contrato:        "Objeto del Contrato",
  secretaria:             "Secretaría",
  area_responsable:       "Área Responsable",
  categoria:              "Categoría",
  clase_contrato:         "Clase de Contrato",
  modalidad_seleccion:    "Modalidad de Selección",
  estado:                 "Estado",
  supervision:            "Supervisor",
  fecha_suscripcion:      "Fecha de Suscripción",
  fecha_inicio_ejecucion: "Fecha de Inicio",
  fecha_terminacion:      "Fecha de Terminación Inicial",
  plazo_ejecucion_inicial:"Plazo de Ejecución",
  pct_cuota_gerencia:     "% Cuota de Gerencia",
  valor_inicial:          "Valor Inicial",
  cuota_admin_inicial:    "Valor Cuota de Gerencia",
  total_contrato:         "Valor Total",
  link_secop:             "Enlace SECOP II",
  link_documentacion:     "Enlace Documentación",
  avance_fisico_pct:      "Avance Físico (%)",
  observaciones:          "Observaciones",
}
