import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Contrato } from "@/types/database"

export type FuncionamientoContrato = Contrato & { tipo_contrato: "FUNCIONAMIENTO" }
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
