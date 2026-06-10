import { createSupabaseServerClient } from "@/lib/supabase/server"

// La tabla `contratos` en el esquema V2 es mínima:
// solo id, origen_hoja, proyecto_ref, tipo_contrato, created_at, updated_at.
// No hay datos financieros ni de contratista en el esquema actual.
export interface FuncionamientoContrato {
  id: number
  origen_hoja: string       // ej: 'Contratación_2024'
  proyecto_ref: string      // número del contrato: '001-2025', '025-2024'…
  tipo_contrato: 'FUNCIONAMIENTO'
  id_interadministrativo: null
  created_at: string
  updated_at: string
}

export type FuncionamientoContract = FuncionamientoContrato

export async function getFuncionamientoContracts(): Promise<FuncionamientoContrato[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select("id, origen_hoja, proyecto_ref, tipo_contrato, created_at, updated_at")
    .eq("tipo_contrato", "FUNCIONAMIENTO")
    .order("origen_hoja", { ascending: false })
    .order("proyecto_ref", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id:                    Number(row.id),
    origen_hoja:           String(row.origen_hoja  ?? ""),
    proyecto_ref:          String(row.proyecto_ref ?? ""),
    tipo_contrato:         "FUNCIONAMIENTO" as const,
    id_interadministrativo: null,
    created_at:            String(row.created_at   ?? ""),
    updated_at:            String(row.updated_at   ?? ""),
  }))
}
