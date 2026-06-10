import { createSupabaseServerClient } from "@/lib/supabase/server"

// Contrato de funcionamiento — de la tabla `contratos` con tipo_contrato = 'FUNCIONAMIENTO'
export interface FuncionamientoContrato {
  id: number
  origen_hoja: string       // ej: 'Contratación_2024' — identifica la hoja/año de origen
  proyecto_ref: string      // identificador del contrato (referencia en la hoja)
  tipo_contrato: 'FUNCIONAMIENTO'
  id_interadministrativo: null
  created_at: string
  updated_at: string
}

// Alias mantenido para compatibilidad con imports existentes
export type FuncionamientoContract = FuncionamientoContrato

export async function getFuncionamientoContracts(): Promise<FuncionamientoContrato[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contratos")
    .select("*")
    .eq("tipo_contrato", "FUNCIONAMIENTO")
    .order("origen_hoja", { ascending: false })
    .order("proyecto_ref", { ascending: true })
    .limit(5000)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id:                    Number(row.id),
    origen_hoja:           String(row.origen_hoja   ?? ""),
    proyecto_ref:          String(row.proyecto_ref  ?? ""),
    tipo_contrato:         "FUNCIONAMIENTO" as const,
    id_interadministrativo: null,
    created_at:            String(row.created_at    ?? ""),
    updated_at:            String(row.updated_at    ?? ""),
  }))
}
