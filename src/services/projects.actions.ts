"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { EstadoContrato } from "@/types/database"

// ── Actualizar estado de un interadministrativo (kanban) ──────────────────────

export async function updateProjectLifecycle(
  idContrato: string,
  estado: EstadoContrato
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadministrativos")
    .update({ estado })
    .eq("id_contrato", idContrato)

  if (error) return { error: error.message }

  revalidatePath("/proyectos")
  revalidatePath("/proyectos/kanban")
  revalidatePath("/")

  return { error: null }
}

// ── Crear interadministrativo ─────────────────────────────────────────────────

export interface NewInteradminProjectInput {
  id_contrato: string          // N° contrato, ej: '3407-2026'
  secretaria?: string
  objeto_contrato?: string
  clase_contrato?: string
  area_responsable?: string
  supervision?: string
  modalidad_seleccion?: string
  plazo_ejecucion_inicial?: string
  fecha_suscripcion?: string
  fecha_inicio_ejecucion?: string
  fecha_terminacion?: string
  valor_inicial?: number
  total_contrato?: number
  cuota_admin_inicial?: number
  bolsa_gerencia_inicial?: number
  observaciones?: string
}

// Alias para compatibilidad con imports existentes
export type NewInteradministrativoInput = NewInteradminProjectInput

export async function createInteradminProject(
  input: NewInteradminProjectInput
): Promise<{ error: string | null; projectId?: string }> {
  const supabase = await createSupabaseServerClient()

  const cuota = input.cuota_admin_inicial ?? null
  const bolsa = input.bolsa_gerencia_inicial ?? null

  const { data, error } = await supabase
    .from("interadministrativos")
    .insert({
      id_contrato:              input.id_contrato.trim(),
      secretaria:               input.secretaria?.trim()               || null,
      objeto_contrato:          input.objeto_contrato?.trim()          || null,
      clase_contrato:           input.clase_contrato?.trim()           || null,
      area_responsable:         input.area_responsable?.trim()         || null,
      supervision:              input.supervision?.trim()              || null,
      modalidad_seleccion:      input.modalidad_seleccion?.trim()      || null,
      plazo_ejecucion_inicial:  input.plazo_ejecucion_inicial?.trim()  || null,
      fecha_suscripcion:        input.fecha_suscripcion               || null,
      fecha_inicio_ejecucion:   input.fecha_inicio_ejecucion          || null,
      fecha_terminacion:        input.fecha_terminacion               || null,
      valor_inicial:            input.valor_inicial                   ?? null,
      adicion:                  0,
      total_contrato:           input.total_contrato ?? input.valor_inicial ?? null,
      cuota_admin_inicial:      cuota,
      adicion_cuota_admin:      0,
      total_cuota_admin:        cuota,
      bolsa_gerencia_inicial:   bolsa,
      adicion_bolsa_mandato:    0,
      total_bolsa_mandato:      bolsa,
      valor_pendiente_cobrar:   null,
      vigencias_futuras:        null,
      estado:                   "EN EJECUCIÓN",
      observaciones:            input.observaciones?.trim()            || null,
    })
    .select("id, id_contrato")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/proyectos")

  return { error: null, projectId: String(data.id) }
}

// Alias
export const createInteradministrativo = createInteradminProject

// ── Crear contrato derivado ────────────────────────────────────────────────────

export interface NewDerivedContractInput {
  id_interadministrativo: string    // id_contrato del padre
  proyecto_ref: string              // N° del contrato derivado
  origen_hoja?: string              // ej: 'Contratación_2024'
  // Legacy — no se usan en el nuevo esquema pero se mantienen para compatibilidad
  project_id?: string
  parent_contract_id?: string
  contract_number?: string
  object?: string
  contractor_name?: string
  supervisor_name?: string
  subscription_date?: string
  start_date?: string
  end_date?: string
  initial_value?: number
  year?: number
}

export async function createDerivedContract(
  input: NewDerivedContractInput
): Promise<{ error: string | null; contractId?: string }> {
  const supabase = await createSupabaseServerClient()

  // Normalizar: soporta tanto el nuevo formato como el legacy
  const idInteradmin = input.id_interadministrativo || input.parent_contract_id || ""
  const proyectoRef  = input.proyecto_ref || input.contract_number || ""
  const year         = input.year ?? new Date().getFullYear()
  const origenHoja   = input.origen_hoja || `Contratación_${year}`

  if (!idInteradmin) return { error: "id_interadministrativo es requerido" }
  if (!proyectoRef)  return { error: "proyecto_ref (N° contrato) es requerido" }

  const { data, error } = await supabase
    .from("contratos")
    .insert({
      id_interadministrativo: idInteradmin,
      proyecto_ref:           proyectoRef,
      origen_hoja:            origenHoja,
      tipo_contrato:          "DERIVADO",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/proyectos")
  revalidatePath("/contratacion/derivados")
  if (input.project_id) revalidatePath(`/proyectos/${input.project_id}`)

  return { error: null, contractId: String(data.id) }
}

// ── Crear contrato de funcionamiento ──────────────────────────────────────────

export interface NewFuncionamientoContractInput {
  proyecto_ref: string       // N° o ID del contrato
  origen_hoja?: string       // ej: 'Contratación_2024'
  // Legacy fields mantenidos para no romper el modal existente
  project_id?: string
  contract_number?: string
  year?: number
  contract_type?: string
  contract_class?: string
  selection_modality?: string
  resource_type?: string
  object?: string
  contractor_name?: string
  contractor_document?: string
  contractor_person_type?: string
  supervisor_name?: string
  area_name?: string
  interventor?: string
  status?: string
  subscription_date?: string
  publication_date?: string
  start_date?: string
  end_date?: string
  initial_term_text?: string
  initial_term_days?: number
  initial_value?: number
  monthly_value?: number
  paa_code?: string
  paa_description?: string
  paa_estimated_value?: number
  secop_url?: string
  observations?: string
}

export async function createFuncionamientoContract(
  input: NewFuncionamientoContractInput
): Promise<{ error: string | null; contractId?: string }> {
  const supabase = await createSupabaseServerClient()

  const year       = input.year ?? new Date().getFullYear()
  const origenHoja = input.origen_hoja || `Contratación_${year}`
  const ref        = input.proyecto_ref || input.contract_number || ""

  if (!ref) return { error: "proyecto_ref (N° contrato) es requerido" }

  const { data, error } = await supabase
    .from("contratos")
    .insert({
      proyecto_ref:           ref,
      origen_hoja:            origenHoja,
      tipo_contrato:          "FUNCIONAMIENTO",
      id_interadministrativo: null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/funcionamiento")
  revalidatePath("/")

  return { error: null, contractId: String(data.id) }
}

// ── No-op mantenido para compatibilidad (ya no existe projects table) ─────────

export async function createFuncionamientoProject(
  _year: number
): Promise<{ error: string | null; projectId?: string }> {
  // En el nuevo esquema no hay tabla projects — devolver OK sin operación
  return { error: null, projectId: undefined }
}
