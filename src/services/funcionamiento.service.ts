import { createSupabaseServerClient } from "@/lib/supabase/server"

// Tipo enriquecido — usa v_funcionamiento_contracts si está disponible,
// si no cae a la tabla contratos mínima.
export interface FuncionamientoContrato {
  id: string | number
  // Campos base (siempre presentes desde contratos)
  origen_hoja: string
  proyecto_ref: string
  tipo_contrato: 'FUNCIONAMIENTO'
  created_at: string
  updated_at: string
  // Campos ricos (disponibles desde v_funcionamiento_contracts)
  contract_number?: string | null
  year?: number | null
  object?: string | null
  contractor_name?: string | null
  status?: string | null
  initial_value?: number | null
  total_additions_value?: number | null
  final_value?: number | null
  paid_value?: number | null
  subscription_date?: string | null
  start_date?: string | null
  end_date?: string | null
  supervisor_name?: string | null
  contract_class?: string | null
  days_remaining?: number | null
  financial_progress_pct?: number | null
  // Enriquecido: modo de datos
  _source?: 'view' | 'table'
}

export type FuncionamientoContract = FuncionamientoContrato

export async function getFuncionamientoContracts(): Promise<FuncionamientoContrato[]> {
  const supabase = await createSupabaseServerClient()

  // Intento 1: vista v_funcionamiento_contracts (datos ricos del esquema V1)
  const { data: viewData, error: viewError } = await supabase
    .from("v_funcionamiento_contracts")
    .select(
      "id, contract_number, year, object, contractor_name, status, " +
      "initial_value, total_additions_value, final_value, paid_value, " +
      "subscription_date, start_date, end_date, supervisor_name, " +
      "contract_class, days_remaining, financial_progress_pct"
    )
    .order("subscription_date", { ascending: false })
    .limit(5000)

  if (!viewError && viewData && viewData.length > 0) {
    const today = new Date().getFullYear()
    return (viewData as unknown as Record<string, unknown>[]).map((row) => {
      const year = (row.year as number | null) ?? today
      return {
        id:                    String(row.id ?? ""),
        origen_hoja:           `Contratación_${year}`,
        proyecto_ref:          String(row.contract_number ?? ""),
        tipo_contrato:         "FUNCIONAMIENTO" as const,
        created_at:            String(row.subscription_date ?? ""),
        updated_at:            String(row.subscription_date ?? ""),
        contract_number:       String(row.contract_number ?? ""),
        year:                  year,
        object:                (row.object as string | null) ?? null,
        contractor_name:       (row.contractor_name as string | null) ?? null,
        status:                (row.status as string | null) ?? null,
        initial_value:         (row.initial_value as number | null) ?? null,
        total_additions_value: (row.total_additions_value as number | null) ?? 0,
        final_value:           (row.final_value as number | null) ?? null,
        paid_value:            (row.paid_value as number | null) ?? null,
        subscription_date:     (row.subscription_date as string | null) ?? null,
        start_date:            (row.start_date as string | null) ?? null,
        end_date:              (row.end_date as string | null) ?? null,
        supervisor_name:       (row.supervisor_name as string | null) ?? null,
        contract_class:        (row.contract_class as string | null) ?? null,
        days_remaining:        (row.days_remaining as number | null) ?? null,
        financial_progress_pct:(row.financial_progress_pct as number | null) ?? null,
        _source:               "view" as const,
      }
    })
  }

  // Fallback: tabla contratos mínima (nuevo esquema V2)
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
    created_at:            String(row.created_at    ?? ""),
    updated_at:            String(row.updated_at    ?? ""),
    _source:               "table" as const,
  }))
}
