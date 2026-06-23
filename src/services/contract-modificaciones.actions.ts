"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { assertContratoWriteAccess } from "./interadmin-access"
import { canEditProjects } from "@/modules/projects/lib/access"
import type {
  ContractAdicion, ContractProrroga, ContractSuspension,
  ContractReinicio, ContractAclaratorio,
} from "@/types/contract-derivado"

type Res = { error: string | null }

async function requireWrite(contratoId: number): Promise<Res | null> {
  const access = await assertContratoWriteAccess(contratoId)
  if (access.error) return { error: access.error }
  return null
}

function revalidate(projectId: string, contratoId: number) {
  revalidatePath(`/contratacion/derivados/${contratoId}`)
  revalidatePath("/contratacion/derivados")
  revalidatePath(`/proyectos/${projectId}/contratos/${contratoId}`)
  revalidatePath(`/proyectos/${projectId}`)
}

// ── Adiciones ─────────────────────────────────────────────────────────────────

export interface CreateContractAdicionInput {
  contrato_id: number
  project_id: string
  fecha_adicion: string
  valor_adicion: number
  valor_bienes_servicios: number
  motivo: string
  numero_cdp: string
  fecha_cdp: string
  numero_rp: string
  fecha_rp: string
  link_documental?: string
  observaciones?: string
}

export async function createContractAdicion(input: CreateContractAdicionInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar adiciones." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.fecha_adicion)                           return { error: "La fecha de suscripción es obligatoria." }
  if (input.valor_adicion <= 0)                       return { error: "El valor total de la adición debe ser mayor a cero." }
  if (input.valor_bienes_servicios < 0)               return { error: "El valor bienes y servicios no puede ser negativo." }
  if (!input.motivo.trim())                           return { error: "El motivo de la adición es obligatorio." }
  if (!input.numero_cdp.trim())                       return { error: "El número CDP es obligatorio." }
  if (!input.fecha_cdp)                               return { error: "La fecha CDP es obligatoria." }
  if (!input.numero_rp.trim())                        return { error: "El número RP es obligatorio." }
  if (!input.fecha_rp)                                return { error: "La fecha RP es obligatoria." }

  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from("contract_adiciones" as never)
    .select("numero_adicion")
    .eq("contrato_id", input.contrato_id)
    .order("numero_adicion", { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = ((last as { numero_adicion?: number } | null)?.numero_adicion ?? 0) + 1

  const { error } = await supabase.from("contract_adiciones" as never).insert({
    contrato_id:            input.contrato_id,
    numero_adicion:         numero,
    fecha_adicion:          input.fecha_adicion,
    valor_adicion:          input.valor_adicion,
    valor_bienes_servicios: input.valor_bienes_servicios,
    valor_cuota_gerencia:   null,
    motivo:                 input.motivo.trim(),
    numero_cdp:             input.numero_cdp.trim(),
    fecha_cdp:              input.fecha_cdp,
    numero_rp:              input.numero_rp.trim(),
    fecha_rp:               input.fecha_rp,
    link_documental:        input.link_documental?.trim() ?? null,
    observaciones:          input.observaciones?.trim() ?? null,
    user_id:                profile?.id    ?? null,
    user_email:             profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id:    input.contrato_id,
    field_name:     "adicion",
    old_value:      null,
    new_value:      `Adición N°${numero} — $${input.valor_adicion} — CDP: ${input.numero_cdp} — RP: ${input.numero_rp}`,
    changed_by:     profile?.full_name ?? profile?.email ?? null,
    changed_by_id:  profile?.id ?? null,
  } as never)

  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

export async function deleteContractAdicion(id: number, contratoId: number, projectId: string): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("contract_adiciones" as never).delete().eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}

// ── Prórrogas ─────────────────────────────────────────────────────────────────

export interface CreateContractProrrogaInput {
  contrato_id: number
  project_id: string
  fecha_suscripcion: string
  nueva_fecha_terminacion: string
  plazo_prorroga?: string
  justificacion?: string
}

export async function createContractProrroga(input: CreateContractProrrogaInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar prórrogas." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.fecha_suscripcion) return { error: "La fecha de suscripción es obligatoria." }
  if (!input.nueva_fecha_terminacion) return { error: "La nueva fecha de terminación es obligatoria." }

  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from("contract_prorrogas" as never)
    .select("numero_prorroga")
    .eq("contrato_id", input.contrato_id)
    .order("numero_prorroga", { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = ((last as { numero_prorroga?: number } | null)?.numero_prorroga ?? 0) + 1

  const { error } = await supabase.from("contract_prorrogas" as never).insert({
    contrato_id: input.contrato_id,
    numero_prorroga: numero,
    fecha_suscripcion: input.fecha_suscripcion,
    nueva_fecha_terminacion: input.nueva_fecha_terminacion,
    plazo_prorroga: input.plazo_prorroga?.trim() ?? null,
    justificacion: input.justificacion?.trim() ?? null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id: input.contrato_id,
    field_name: "prorroga",
    old_value: null,
    new_value: `Prórroga N°${numero} — nueva terminación: ${input.nueva_fecha_terminacion}`,
    changed_by: profile?.full_name ?? profile?.email ?? null,
    changed_by_id: profile?.id ?? null,
  } as never)

  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

export async function deleteContractProrroga(id: number, contratoId: number, projectId: string): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("contract_prorrogas" as never).delete().eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}

// ── Suspensiones ──────────────────────────────────────────────────────────────

export interface CreateContractSuspensionInput {
  contrato_id: number
  project_id: string
  fecha_suscripcion?: string
  inicio_suspension: string
  fin_suspension?: string
  plazo_suspension?: string
  motivo?: string
}

export async function createContractSuspension(input: CreateContractSuspensionInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar suspensiones." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.inicio_suspension) return { error: "La fecha de inicio de suspensión es obligatoria." }

  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from("contract_suspensiones" as never)
    .select("numero_suspension")
    .eq("contrato_id", input.contrato_id)
    .order("numero_suspension", { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = ((last as { numero_suspension?: number } | null)?.numero_suspension ?? 0) + 1

  const { error } = await supabase.from("contract_suspensiones" as never).insert({
    contrato_id: input.contrato_id,
    numero_suspension: numero,
    fecha_suscripcion: input.fecha_suscripcion ?? null,
    inicio_suspension: input.inicio_suspension,
    fin_suspension: input.fin_suspension ?? null,
    plazo_suspension: input.plazo_suspension?.trim() ?? null,
    motivo: input.motivo?.trim() ?? null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id: input.contrato_id,
    field_name: "suspension",
    old_value: null,
    new_value: `Suspensión N°${numero} — inicio: ${input.inicio_suspension}`,
    changed_by: profile?.full_name ?? profile?.email ?? null,
    changed_by_id: profile?.id ?? null,
  } as never)

  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

export async function deleteContractSuspension(id: number, contratoId: number, projectId: string): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("contract_suspensiones" as never).delete().eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}

// ── Reinicios ─────────────────────────────────────────────────────────────────

export interface CreateContractReinicioInput {
  contrato_id: number
  project_id: string
  fecha_reinicio: string
  fecha_suscripcion?: string
  motivo?: string
  observaciones?: string
}

export async function createContractReinicio(input: CreateContractReinicioInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar reinicios." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.fecha_reinicio) return { error: "La fecha de reinicio es obligatoria." }

  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from("contract_reinicios" as never)
    .select("numero_reinicio")
    .eq("contrato_id", input.contrato_id)
    .order("numero_reinicio", { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = ((last as { numero_reinicio?: number } | null)?.numero_reinicio ?? 0) + 1

  const { error } = await supabase.from("contract_reinicios" as never).insert({
    contrato_id: input.contrato_id,
    numero_reinicio: numero,
    fecha_reinicio: input.fecha_reinicio,
    fecha_suscripcion: input.fecha_suscripcion ?? null,
    motivo: input.motivo?.trim() ?? null,
    observaciones: input.observaciones?.trim() ?? null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id: input.contrato_id,
    field_name: "reinicio",
    old_value: null,
    new_value: `Reinicio N°${numero} — fecha: ${input.fecha_reinicio}`,
    changed_by: profile?.full_name ?? profile?.email ?? null,
    changed_by_id: profile?.id ?? null,
  } as never)

  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

export async function deleteContractReinicio(id: number, contratoId: number, projectId: string): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("contract_reinicios" as never).delete().eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}

// ── Aclaratorios ─────────────────────────────────────────────────────────────

export interface CreateContractAclaratoriInput {
  contrato_id: number
  project_id: string
  fecha_suscripcion: string
  motivo?: string
  descripcion?: string
}

export async function createContractAclaratorio(input: CreateContractAclaratoriInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar aclaratorios." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.fecha_suscripcion) return { error: "La fecha de suscripción es obligatoria." }

  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from("contract_aclaratorios" as never)
    .select("numero_aclaratorio")
    .eq("contrato_id", input.contrato_id)
    .order("numero_aclaratorio", { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = ((last as { numero_aclaratorio?: number } | null)?.numero_aclaratorio ?? 0) + 1

  const { error } = await supabase.from("contract_aclaratorios" as never).insert({
    contrato_id: input.contrato_id,
    numero_aclaratorio: numero,
    fecha_suscripcion: input.fecha_suscripcion,
    motivo: input.motivo?.trim() ?? null,
    descripcion: input.descripcion?.trim() ?? null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id: input.contrato_id,
    field_name: "aclaratorio",
    old_value: null,
    new_value: `Aclaratorio N°${numero} — ${input.fecha_suscripcion}`,
    changed_by: profile?.full_name ?? profile?.email ?? null,
    changed_by_id: profile?.id ?? null,
  } as never)

  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

export async function deleteContractAclaratorio(id: number, contratoId: number, projectId: string): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("contract_aclaratorios" as never).delete().eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}
