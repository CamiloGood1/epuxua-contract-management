import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { EstadoInteradministrativo, EstadoContrato } from "@/types/database"

export interface DerivedContractRow {
  id: number
  origen_hoja:              string | null
  numero_contrato:          string | null
  numero_proceso:           string | null
  tipo_contrato:            "DERIVADO"
  id_interadministrativo:   string | null
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
  suspension:               string | null
  reinicio:                 string | null
  observaciones:            string | null
  estado:                   EstadoContrato | null
  link_ficha:               string | null
  numero_poliza:            string | null
  fecha_aprobacion_poliza:  string | null
  created_at:               string
  updated_at:               string
  // From JOIN with interadministrativos
  parent_id:                number | null
  parent_objeto:            string | null
  parent_secretaria:        string | null
  parent_area:              string | null
  parent_estado:            EstadoInteradministrativo | null
  parent_total:             number | null
  parent_pendiente:         number | null
}

export interface DerivedContractsKPIs {
  totalContracts:      number
  activeParents:       number
  uniqueParents:       number
  totalCommitted:      number
  totalCommitted_legacy: number
  activeContracts:     number
  expiringContracts:   number
  inLiquidation:       number
  parentContractsCount: number
}

export async function getAllDerivedContracts(): Promise<DerivedContractRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select(`
      *,
      interadministrativos:id_interadministrativo (
        id,
        objeto_contrato,
        secretaria,
        area_responsable,
        estado,
        total_contrato,
        valor_pendiente_cobrar
      )
    `)
    .eq("tipo_contrato", "DERIVADO")
    .order("id_interadministrativo", { ascending: true })
    .order("numero_contrato", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const parent = (row.interadministrativos ?? null) as Record<string, unknown> | null
    const { interadministrativos: _dropped, ...rest } = row
    return {
      ...rest,
      tipo_contrato:          "DERIVADO" as const,
      parent_id:              (parent?.id                   as number | null) ?? null,
      parent_objeto:          (parent?.objeto_contrato      as string | null) ?? null,
      parent_secretaria:      (parent?.secretaria           as string | null) ?? null,
      parent_area:            (parent?.area_responsable     as string | null) ?? null,
      parent_estado:          (parent?.estado               as EstadoInteradministrativo | null) ?? null,
      parent_total:           (parent?.total_contrato       as number | null) ?? null,
      parent_pendiente:       (parent?.valor_pendiente_cobrar as number | null) ?? null,
    } as DerivedContractRow
  })
}

export async function getDerivedContractsKPIs(
  contracts: DerivedContractRow[]
): Promise<DerivedContractsKPIs> {
  const activeParents = contracts.filter((c) => c.parent_estado === "EN EJECUCIÓN").length
  const uniqueParents = new Set(contracts.map((c) => c.id_interadministrativo).filter(Boolean)).size
  const liquidated    = contracts.filter((c) => c.parent_estado === "LIQUIDADO").length
  const totalValue    = contracts.reduce((s, c) => s + (c.valor_final ?? c.valor_inicial ?? 0), 0)

  return {
    totalContracts:        contracts.length,
    activeParents,
    uniqueParents,
    totalCommitted:        totalValue,
    totalCommitted_legacy: totalValue,
    activeContracts:       contracts.filter((c) => c.estado === "EN EJECUCIÓN").length,
    expiringContracts:     0,
    inLiquidation:         liquidated,
    parentContractsCount:  uniqueParents,
  }
}
