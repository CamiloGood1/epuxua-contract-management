"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { NewContractInput } from "@/types/contract"

// Busca o crea un contratista por nombre normalizado
async function findOrCreateContractor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  name: string,
  personType: "NATURAL" | "JURIDICA"
): Promise<string> {
  const normName = name.trim().toLowerCase().replace(/\s+/g, " ")

  // Buscar por norm_name (columna generada en BD)
  const { data: existing } = await supabase
    .from("contractors")
    .select("id")
    .ilike("full_name", name.trim())
    .eq("person_type", personType)
    .limit(1)
    .single()

  if (existing) return existing.id

  // Crear nuevo
  const { data, error } = await supabase
    .from("contractors")
    .insert({ full_name: name.trim(), person_type: personType })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

// Busca o crea un supervisor por nombre
async function findOrCreateSupervisor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  name: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("supervisors")
    .select("id")
    .ilike("full_name", name.trim())
    .limit(1)
    .single()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from("supervisors")
    .insert({ full_name: name.trim() })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function createContract(
  input: NewContractInput
): Promise<{ error: string | null; id?: string }> {
  const supabase = await createSupabaseServerClient()

  // Resolver FK de contratista
  const contractor_id = await findOrCreateContractor(
    supabase,
    input.contractor_name,
    input.contractor_person_type
  ).catch((e) => { throw new Error(`Contratista: ${e.message}`) })

  // Resolver FK de supervisor (opcional)
  let supervisor_id: string | null = null
  if (input.supervisor_name?.trim()) {
    supervisor_id = await findOrCreateSupervisor(supabase, input.supervisor_name)
      .catch(() => null)
  }

  // Resolver FK de área responsable (opcional)
  let responsible_area_id: string | null = null
  if (input.area_name?.trim()) {
    const { data: area } = await supabase
      .from("responsible_areas")
      .select("id")
      .ilike("name", input.area_name.trim())
      .limit(1)
      .single()
    responsible_area_id = area?.id ?? null
  }

  const payload = {
    contract_number:       input.contract_number.trim(),
    year:                  input.year,
    contract_type:         input.contract_type,
    selection_modality:    input.selection_modality,
    contract_class:        input.contract_class.trim(),
    object:                input.object.trim(),
    contractor_id,
    supervisor_id,
    responsible_area_id,
    status:                input.status,
    subscription_date:     input.subscription_date,
    start_date:            input.start_date || null,
    end_date:              input.end_date   || null,
    initial_value:         Number(input.initial_value),
    total_additions_value: 0,
    paid_value:            0,
    future_validity:       0,
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert([payload])
    .select("id")
    .single()

  if (error) return { error: error.message }
  return { error: null, id: data.id }
}
