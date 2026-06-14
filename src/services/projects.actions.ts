"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { EstadoInteradministrativo } from "@/types/database"
import { getCurrentUserProfile } from "@/services/user.service"
import { canCreateProject } from "@/modules/projects/lib/access"

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
  // Identificación
  id_contrato:              string
  estado:                   EstadoInteradministrativo
  // Objeto
  objeto_contrato:          string
  categoria?:               string
  // Responsables
  secretaria:               string
  area_responsable?:        string
  supervision?:             string
  // Fechas
  fecha_suscripcion:        string
  fecha_inicio_ejecucion:   string
  fecha_terminacion:        string
  plazo_ejecucion_inicial?: string
  // Valores
  pct_cuota_gerencia?:      number
  valor_inicial?:           number   // bienes y servicios
  cuota_admin_inicial?:     number   // cuota de gerencia
  total_contrato?:          number   // valor total
  bolsa_gerencia_inicial?:  number
  // Links
  link_secop?:              string
  link_documentacion?:      string
  // Opcionales legacy
  clase_contrato?:          string
  modalidad_seleccion?:     string
  observaciones?:           string
}


function isValidUrl(url: string | undefined): boolean {
  if (!url) return true
  try { new URL(url); return true } catch { return false }
}

export async function createInteradminProject(
  input: NewInteradminProjectInput
): Promise<{ error: string | null; projectId?: string }> {
  // ── Permisos ─────────────────────────────────────────────
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canCreateProject(profile?.role)) {
    return { error: "No tiene permisos para crear contratos interadministrativos." }
  }

  // ── Validaciones ─────────────────────────────────────────
  const idContrato = input.id_contrato?.trim()
  if (!idContrato) return { error: "El número de contrato es obligatorio." }

  const objeto = input.objeto_contrato?.trim() ?? ""
  if (!objeto) return { error: "El objeto del contrato es obligatorio." }
  if (objeto.length < 20) return { error: "El objeto debe tener al menos 20 caracteres." }
  if (!input.secretaria?.trim()) return { error: "La secretaría / área es obligatoria." }
  if (!input.fecha_suscripcion) return { error: "La fecha de suscripción es obligatoria." }
  if (!input.fecha_inicio_ejecucion) return { error: "La fecha de inicio es obligatoria." }
  if (!input.fecha_terminacion) return { error: "La fecha de terminación es obligatoria." }

  if (input.fecha_terminacion < input.fecha_inicio_ejecucion) {
    return { error: "La fecha de terminación no puede ser anterior a la fecha de inicio." }
  }
  if (input.pct_cuota_gerencia != null &&
    (input.pct_cuota_gerencia < 0 || input.pct_cuota_gerencia > 100)) {
    return { error: "El porcentaje de cuota de gerencia debe estar entre 0 y 100." }
  }
  if (input.total_contrato != null && input.total_contrato <= 0) {
    return { error: "El valor total debe ser mayor que 0." }
  }
  if (!isValidUrl(input.link_secop)) return { error: "El enlace SECOP II no tiene formato URL válido." }
  if (!isValidUrl(input.link_documentacion)) return { error: "El enlace de documentación no tiene formato URL válido." }

  const supabase = await createSupabaseServerClient()

  // ── Unicidad ──────────────────────────────────────────────
  const { data: existing } = await supabase
    .from("interadministrativos")
    .select("id")
    .eq("id_contrato", idContrato)
    .maybeSingle()

  if (existing) return { error: `Ya existe un contrato con el número "${idContrato}".` }

  // ── Calcular derivados ────────────────────────────────────
  const cuota = input.cuota_admin_inicial ?? null
  const bolsa = input.bolsa_gerencia_inicial ?? null
  const total = input.total_contrato
    ?? (((input.valor_inicial ?? 0) + (cuota ?? 0)) || null)

  // ── Insertar ──────────────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from("interadministrativos")
    .insert({
      id_contrato:              idContrato,
      estado:                   input.estado,
      objeto_contrato:          objeto,
      categoria:                input.categoria?.trim()               || null,
      secretaria:               input.secretaria.trim(),
      area_responsable:         input.area_responsable?.trim()        || null,
      supervision:              input.supervision?.trim()             || null,
      clase_contrato:           input.clase_contrato?.trim()          || null,
      modalidad_seleccion:      input.modalidad_seleccion?.trim()     || null,
      plazo_ejecucion_inicial:  input.plazo_ejecucion_inicial?.trim() || null,
      fecha_suscripcion:        input.fecha_suscripcion,
      fecha_inicio_ejecucion:   input.fecha_inicio_ejecucion,
      fecha_terminacion:        input.fecha_terminacion,
      pct_cuota_gerencia:       input.pct_cuota_gerencia              ?? null,
      valor_inicial:            input.valor_inicial                   ?? null,
      adicion:                  0,
      total_contrato:           total,
      cuota_admin_inicial:      cuota,
      adicion_cuota_admin:      0,
      total_cuota_admin:        cuota,
      bolsa_gerencia_inicial:   bolsa,
      adicion_bolsa_mandato:    0,
      total_bolsa_mandato:      bolsa,
      valor_pendiente_cobrar:   null,
      vigencias_futuras:        null,
      link_secop:               input.link_secop?.trim()              || null,
      link_documentacion:       input.link_documentacion?.trim()      || null,
      observaciones:            input.observaciones?.trim()           || null,
    })
    .select("id, id_contrato")
    .single()

  if (insertError) return { error: insertError.message }

  // ── Auditoría (fire-and-forget) ───────────────────────────
  supabase.from("interadmin_audit_log" as never).insert({
    interadmin_id: data.id,
    id_contrato:   idContrato,
    action:        "CREATE",
    new_value:     JSON.stringify({ estado: input.estado, secretaria: input.secretaria }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
    metadata:      { total_contrato: total },
  } as never).then(() => {})

  revalidatePath("/")
  revalidatePath("/proyectos")
  revalidatePath("/proyectos/kanban")

  return { error: null, projectId: String(data.id) }
}


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
