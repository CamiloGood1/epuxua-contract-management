"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { EstadoInteradministrativo } from "@/types/database"

// ── Actualizar estado de un interadministrativo (kanban) ──────────────────────

export async function updateProjectLifecycle(
  idContrato: string,
  estado: EstadoInteradministrativo
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
  numero_contrato: string           // N° del contrato derivado (ej: '001-2024')
  origen_hoja?: string              // ej: 'Contratación_2024'
  contratista?: string
  objeto_contrato?: string
  clase_contrato?: string
  supervisor?: string
  fecha_suscripcion?: string
  fecha_inicio?: string
  fecha_terminacion?: string
  valor_inicial?: number
  valor_final?: number
  estado?: string
  // Backward compat
  proyecto_ref?: string
  contract_number?: string
  year?: number
  project_id?: string
}

export async function createDerivedContract(
  input: NewDerivedContractInput
): Promise<{ error: string | null; contractId?: string }> {
  const supabase = await createSupabaseServerClient()

  const idInteradmin  = input.id_interadministrativo || ""
  const numeroContrato = input.numero_contrato || input.proyecto_ref || input.contract_number || ""
  const year           = input.year ?? new Date().getFullYear()
  const origenHoja     = input.origen_hoja || `Contratación_${year}`

  if (!idInteradmin)   return { error: "id_interadministrativo es requerido" }
  if (!numeroContrato) return { error: "numero_contrato es requerido" }

  const { data, error } = await supabase
    .from("contratos")
    .insert({
      id_interadministrativo: idInteradmin,
      numero_contrato:        numeroContrato,
      origen_hoja:            origenHoja,
      tipo_contrato:          "DERIVADO",
      contratista:            input.contratista             || null,
      objeto_contrato:        input.objeto_contrato         || null,
      clase_contrato:         input.clase_contrato          || null,
      supervisor:             input.supervisor              || null,
      fecha_suscripcion:      input.fecha_suscripcion       || null,
      fecha_inicio:           input.fecha_inicio            || null,
      fecha_terminacion:      input.fecha_terminacion       || null,
      valor_inicial:          input.valor_inicial           ?? null,
      valor_final:            input.valor_final             ?? input.valor_inicial ?? null,
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
  numero_contrato: string    // N° o ID del contrato
  origen_hoja?: string       // ej: 'Contratación_2024'
  contratista?: string
  objeto_contrato?: string
  clase_contrato?: string
  modalidad_seleccion?: string
  area_responsable?: string
  supervisor?: string
  persona_natural_juridica?: string
  fecha_suscripcion?: string
  fecha_inicio?: string
  fecha_terminacion?: string
  plazo_ejecucion?: string
  valor_inicial?: number
  valor_final?: number
  estado?: string
  recurso?: string
  rubro?: string
  observaciones?: string
  // Backward compat
  proyecto_ref?: string
  contract_number?: string
  year?: number
}

export async function createFuncionamientoContract(
  input: NewFuncionamientoContractInput
): Promise<{ error: string | null; contractId?: string }> {
  const supabase = await createSupabaseServerClient()

  const year           = input.year ?? new Date().getFullYear()
  const origenHoja     = input.origen_hoja || `Contratación_${year}`
  const numeroContrato = input.numero_contrato || input.proyecto_ref || input.contract_number || ""

  if (!numeroContrato) return { error: "numero_contrato es requerido" }

  const { data, error } = await supabase
    .from("contratos")
    .insert({
      numero_contrato:        numeroContrato,
      origen_hoja:            origenHoja,
      tipo_contrato:          "FUNCIONAMIENTO",
      id_interadministrativo: null,
      contratista:            input.contratista             || null,
      objeto_contrato:        input.objeto_contrato         || null,
      clase_contrato:         input.clase_contrato          || null,
      modalidad_seleccion:    input.modalidad_seleccion     || null,
      area_responsable:       input.area_responsable        || null,
      supervisor:             input.supervisor              || null,
      persona_natural_juridica: input.persona_natural_juridica || null,
      fecha_suscripcion:      input.fecha_suscripcion       || null,
      fecha_inicio:           input.fecha_inicio            || null,
      fecha_terminacion:      input.fecha_terminacion       || null,
      plazo_ejecucion:        input.plazo_ejecucion         || null,
      valor_inicial:          input.valor_inicial           ?? null,
      valor_final:            input.valor_final             ?? input.valor_inicial ?? null,
      estado:                 input.estado                  || null,
      recurso:                input.recurso                 || null,
      rubro:                  input.rubro                   || null,
      observaciones:          input.observaciones           || null,
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
