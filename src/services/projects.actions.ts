"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ProjectLifecycle } from "@/types/project"

export async function updateProjectLifecycle(
  projectId: string,
  lifecycleStatus: ProjectLifecycle
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("projects")
    .update({ lifecycle_status: lifecycleStatus })
    .eq("id", projectId)

  if (error) return { error: error.message }

  revalidatePath("/proyectos/kanban")
  revalidatePath("/proyectos")
  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath("/")

  return { error: null }
}

// ── Crear proyecto interadministrativo + contrato principal ───────────────────

export interface NewInteradminProjectInput {
  project_code: string
  name: string
  year: number
  secretaria: string
  total_value: number
  // Contrato principal
  contract_number: string
  object: string
  contractor_name: string
  supervisor_name: string
  subscription_date: string
  start_date: string
  end_date: string
  initial_value: number
}

export async function createInteradminProject(
  input: NewInteradminProjectInput
): Promise<{ error: string | null; projectId?: string }> {
  const supabase = await createSupabaseServerClient()

  // 1. Crear proyecto
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      project_code: input.project_code.trim(),
      name: input.name.trim(),
      project_type: "INTERADMINISTRATIVO",
      year: input.year,
      lifecycle_status: "PLANEACION",
      secretaria: input.secretaria.trim() || null,
      total_value: Number(input.total_value),
      goods_services_value: Number(input.total_value),
      management_fee_type: "PORCENTAJE",
      management_fee_value: 0,
      management_fee_amount: 0,
      executed_value: 0,
      paid_value: 0,
    })
    .select("id")
    .single()

  if (projectError) return { error: projectError.message }

  // 2. Buscar o crear contratista
  let contractor_id: string | null = null
  if (input.contractor_name.trim()) {
    const { data: existing } = await supabase
      .from("contractors")
      .select("id")
      .ilike("full_name", input.contractor_name.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      contractor_id = existing.id
    } else {
      const { data: newContractor } = await supabase
        .from("contractors")
        .insert({ full_name: input.contractor_name.trim(), person_type: "JURIDICA" })
        .select("id")
        .single()
      contractor_id = newContractor?.id ?? null
    }
  }

  // 3. Buscar o crear supervisor
  let supervisor_id: string | null = null
  if (input.supervisor_name.trim()) {
    const { data: existing } = await supabase
      .from("supervisors")
      .select("id")
      .ilike("full_name", input.supervisor_name.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      supervisor_id = existing.id
    } else {
      const { data: newSupervisor } = await supabase
        .from("supervisors")
        .insert({ full_name: input.supervisor_name.trim() })
        .select("id")
        .single()
      supervisor_id = newSupervisor?.id ?? null
    }
  }

  // 4. Crear contrato principal (INTERADMINISTRATIVO)
  if (input.contract_number.trim() && contractor_id) {
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        contract_number: input.contract_number.trim(),
        year: input.year,
        contract_type: "INTERADMINISTRATIVO",
        selection_modality: "CONTRATACION_DIRECTA",
        contract_class: "Contrato interadministrativo",
        object: input.object.trim(),
        contractor_id,
        supervisor_id,
        status: "EN_EJECUCION",
        subscription_date: input.subscription_date,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        initial_value: Number(input.initial_value),
        total_additions_value: 0,
        paid_value: 0,
        future_validity: 0,
        project_id: project.id,
      })
      .select("id")
      .single()

    if (!contractError && contract) {
      // 5. Vincular contrato principal al proyecto
      await supabase
        .from("projects")
        .update({ primary_contract_id: contract.id })
        .eq("id", project.id)
    }
  }

  revalidatePath("/")
  revalidatePath("/proyectos")
  revalidatePath("/proyectos/kanban")

  return { error: null, projectId: project.id }
}

// ── Crear contrato derivado ────────────────────────────────────────────────────

export interface NewDerivedContractInput {
  project_id: string
  parent_contract_id: string
  contract_number: string
  object: string
  contractor_name: string
  supervisor_name: string
  subscription_date: string
  start_date: string
  end_date: string
  initial_value: number
  year: number
}

export async function createDerivedContract(
  input: NewDerivedContractInput
): Promise<{ error: string | null; contractId?: string }> {
  const supabase = await createSupabaseServerClient()

  // Buscar o crear contratista
  let contractor_id: string | null = null
  if (input.contractor_name.trim()) {
    const { data: existing } = await supabase
      .from("contractors")
      .select("id")
      .ilike("full_name", input.contractor_name.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      contractor_id = existing.id
    } else {
      const { data: newContractor } = await supabase
        .from("contractors")
        .insert({ full_name: input.contractor_name.trim(), person_type: "NATURAL" })
        .select("id")
        .single()
      contractor_id = newContractor?.id ?? null
    }
  }

  if (!contractor_id) return { error: "Contratista requerido" }

  // Buscar o crear supervisor
  let supervisor_id: string | null = null
  if (input.supervisor_name.trim()) {
    const { data: existing } = await supabase
      .from("supervisors")
      .select("id")
      .ilike("full_name", input.supervisor_name.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      supervisor_id = existing.id
    } else {
      const { data: newSup } = await supabase
        .from("supervisors")
        .insert({ full_name: input.supervisor_name.trim() })
        .select("id")
        .single()
      supervisor_id = newSup?.id ?? null
    }
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      contract_number: input.contract_number.trim(),
      year: input.year,
      contract_type: "DERIVADO",
      selection_modality: "CONTRATACION_DIRECTA",
      contract_class: "Prestación de servicios profesionales",
      object: input.object.trim(),
      contractor_id,
      supervisor_id,
      parent_contract_id: input.parent_contract_id,
      status: "EN_EJECUCION",
      subscription_date: input.subscription_date,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      initial_value: Number(input.initial_value),
      total_additions_value: 0,
      paid_value: 0,
      future_validity: 0,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/proyectos")
  revalidatePath(`/proyectos/${input.project_id}`)
  revalidatePath("/contratacion/derivados")

  return { error: null, contractId: data.id }
}

// ── Crear contrato de funcionamiento ──────────────────────────────────────────

export interface NewFuncionamientoContractInput {
  project_id: string
  contract_number: string
  object: string
  contractor_name: string
  supervisor_name: string
  subscription_date: string
  start_date: string
  end_date: string
  initial_value: number
  year: number
}

export async function createFuncionamientoContract(
  input: NewFuncionamientoContractInput
): Promise<{ error: string | null; contractId?: string }> {
  const supabase = await createSupabaseServerClient()

  // Buscar o crear contratista
  let contractor_id: string | null = null
  if (input.contractor_name.trim()) {
    const { data: existing } = await supabase
      .from("contractors")
      .select("id")
      .ilike("full_name", input.contractor_name.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      contractor_id = existing.id
    } else {
      const { data: newContractor } = await supabase
        .from("contractors")
        .insert({ full_name: input.contractor_name.trim(), person_type: "NATURAL" })
        .select("id")
        .single()
      contractor_id = newContractor?.id ?? null
    }
  }

  if (!contractor_id) return { error: "Contratista requerido" }

  // Buscar o crear supervisor
  let supervisor_id: string | null = null
  if (input.supervisor_name.trim()) {
    const { data: existing } = await supabase
      .from("supervisors")
      .select("id")
      .ilike("full_name", input.supervisor_name.trim())
      .limit(1)
      .maybeSingle()

    if (existing) {
      supervisor_id = existing.id
    } else {
      const { data: newSup } = await supabase
        .from("supervisors")
        .insert({ full_name: input.supervisor_name.trim() })
        .select("id")
        .single()
      supervisor_id = newSup?.id ?? null
    }
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      contract_number: input.contract_number.trim(),
      year: input.year,
      contract_type: "DIRECTO",
      selection_modality: "CONTRATACION_DIRECTA",
      contract_class: "Prestación de servicios profesionales",
      object: input.object.trim(),
      contractor_id,
      supervisor_id,
      project_id: input.project_id,
      status: "EN_EJECUCION",
      subscription_date: input.subscription_date,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      initial_value: Number(input.initial_value),
      total_additions_value: 0,
      paid_value: 0,
      future_validity: 0,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/funcionamiento")
  revalidatePath(`/proyectos/${input.project_id}`)
  revalidatePath("/")

  return { error: null, contractId: data.id }
}

// ── Crear proyecto contenedor FUNCIONAMIENTO-AAAA ──────────────────────────────

export async function createFuncionamientoProject(
  year: number
): Promise<{ error: string | null; projectId?: string }> {
  const supabase = await createSupabaseServerClient()

  const code = `FUNCIONAMIENTO-${year}`

  // Verificar que no existe
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("project_code", code)
    .maybeSingle()

  if (existing) return { error: `Ya existe el proyecto ${code}`, projectId: existing.id }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      project_code: code,
      name: `Contratos de Funcionamiento ${year}`,
      project_type: "FUNCIONAMIENTO",
      year,
      lifecycle_status: "EJECUCION",
      total_value: 0,
      goods_services_value: 0,
      management_fee_type: "PORCENTAJE",
      management_fee_value: 0,
      management_fee_amount: 0,
      executed_value: 0,
      paid_value: 0,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/funcionamiento")
  revalidatePath("/")

  return { error: null, projectId: data.id }
}
