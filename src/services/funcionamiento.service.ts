import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { EstadoContrato } from "@/types/database"

export interface FuncionamientoContrato {
  id: number
  origen_hoja:              string | null
  numero_contrato:          string | null
  numero_proceso:           string | null
  numero_proceso_seleccion: string | null
  nit_identificacion:       string | null
  tipo_contrato:            "FUNCIONAMIENTO"
  id_interadministrativo:   null
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
  estado:                   EstadoContrato | null
  link_ficha:               string | null
  numero_poliza:            string | null
  fecha_aprobacion_poliza:  string | null
  created_at:               string
  updated_at:               string
}

export type FuncionamientoContract = FuncionamientoContrato

export async function getFuncionamientoContracts(): Promise<FuncionamientoContrato[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select("*")
    .eq("tipo_contrato", "FUNCIONAMIENTO")
    .order("origen_hoja", { ascending: false })
    .order("numero_contrato", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)

  return (data ?? []) as FuncionamientoContrato[]
}

export async function getFuncionamientoKPIs(): Promise<{
  total: number
  enEjecucion: number
  terminados: number
  valorTotal: number
  valorPagado: number
  valorPendiente: number
}> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select("estado, valor_final, valor_pagado, valor_pendiente")
    .eq("tipo_contrato", "FUNCIONAMIENTO")
    .limit(5000)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    total:          rows.length,
    enEjecucion:    rows.filter((r) => r.estado === "EN EJECUCIÓN").length,
    terminados:     rows.filter((r) => r.estado === "TERMINADO" || r.estado === "LIQUIDADO").length,
    valorTotal:     rows.reduce((s, r) => s + (r.valor_final ?? 0), 0),
    valorPagado:    rows.reduce((s, r) => s + (r.valor_pagado ?? 0), 0),
    valorPendiente: rows.reduce((s, r) => s + (r.valor_pendiente ?? 0), 0),
  }
}
