import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface DerivedContractRow {
  id: number
  proyecto_ref: string
  origen_hoja: string
  id_interadministrativo: string | null
  created_at: string
  // Desde JOIN con interadministrativos
  parent_objeto: string | null
  parent_secretaria: string | null
  parent_area: string | null
  parent_estado: 'EN EJECUCIÓN' | 'TERMINADO' | 'LIQUIDADO' | null
  parent_total: number | null
  parent_pendiente: number | null
}

export interface DerivedContractsKPIs {
  totalContracts: number
  activeParents: number
  uniqueParents: number
  totalCommitted: number
  // legado — mantenidos para compatibilidad con el cliente
  totalCommitted_legacy: number
  activeContracts: number
  expiringContracts: number
  inLiquidation: number
  parentContractsCount: number
}

export async function getAllDerivedContracts(): Promise<DerivedContractRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select(`
      id,
      proyecto_ref,
      origen_hoja,
      id_interadministrativo,
      created_at,
      interadministrativos:id_interadministrativo (
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
    .order("proyecto_ref", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const parent = (row.interadministrativos ?? null) as Record<string, unknown> | null
    return {
      id:                     Number(row.id),
      proyecto_ref:           String(row.proyecto_ref  ?? ""),
      origen_hoja:            String(row.origen_hoja   ?? ""),
      id_interadministrativo: (row.id_interadministrativo as string | null) ?? null,
      created_at:             String(row.created_at    ?? ""),
      parent_objeto:          (parent?.objeto_contrato  as string | null) ?? null,
      parent_secretaria:      (parent?.secretaria       as string | null) ?? null,
      parent_area:            (parent?.area_responsable as string | null) ?? null,
      parent_estado:          (parent?.estado           as DerivedContractRow["parent_estado"]) ?? null,
      parent_total:           (parent?.total_contrato   as number | null) ?? null,
      parent_pendiente:       (parent?.valor_pendiente_cobrar as number | null) ?? null,
    }
  })
}

export async function getDerivedContractsKPIs(
  contracts: DerivedContractRow[]
): Promise<DerivedContractsKPIs> {
  const activeParents = contracts.filter((c) => c.parent_estado === "EN EJECUCIÓN").length
  const uniqueParents = new Set(contracts.map((c) => c.id_interadministrativo).filter(Boolean)).size
  const liquidated    = contracts.filter((c) => c.parent_estado === "LIQUIDADO").length

  return {
    totalContracts:       contracts.length,
    activeParents,
    uniqueParents,
    totalCommitted:       0, // no hay valor individual en nuevo esquema
    // campos legado
    totalCommitted_legacy:0,
    activeContracts:      activeParents,
    expiringContracts:    0,
    inLiquidation:        liquidated,
    parentContractsCount: uniqueParents,
  }
}
