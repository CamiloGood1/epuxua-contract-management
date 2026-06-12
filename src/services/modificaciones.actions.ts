"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { assertInteradminWriteAccess } from "@/services/interadmin-access"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import type { EstadoInteradministrativo } from "@/types/database"

type Res = { error: string | null }

async function requireWrite(interadminId: number): Promise<Res | null> {
  const access = await assertInteradminWriteAccess(interadminId)
  if (access.error) return { error: access.error }
  return null
}

function revalidate(projectId: number) {
  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath("/proyectos")
}

async function audit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>
) {
  // fire-and-forget
  supabase.from("interadmin_audit_log" as never).insert(payload as never).then(() => {})
}

// ── 0. Edición básica ────────────────────────────────────────────────────────

export interface UpdateBasicInfoInput {
  id: number
  fecha_inicio_ejecucion?: string | null
  estado?: EstadoInteradministrativo
  avance_fisico_pct?: number | null
}

export async function updateInteradminBasicInfo(input: UpdateBasicInfoInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar." }

  const deniedBasic = await requireWrite(input.id)
  if (deniedBasic) return deniedBasic

  if (input.avance_fisico_pct != null && (input.avance_fisico_pct < 0 || input.avance_fisico_pct > 100)) {
    return { error: "El avance físico debe estar entre 0 y 100." }
  }

  const supabase = await createSupabaseServerClient()

  const { data: prev } = await supabase
    .from("interadministrativos")
    .select("estado, fecha_inicio_ejecucion, avance_fisico_pct, id_contrato")
    .eq("id", input.id)
    .single()

  const patch: Record<string, unknown> = {}
  if (input.estado !== undefined)              patch.estado                = input.estado
  if (input.fecha_inicio_ejecucion !== undefined) patch.fecha_inicio_ejecucion = input.fecha_inicio_ejecucion
  if (input.avance_fisico_pct !== undefined)   patch.avance_fisico_pct     = input.avance_fisico_pct

  if (Object.keys(patch).length === 0) return { error: null }

  const { error } = await supabase.from("interadministrativos").update(patch).eq("id", input.id)
  if (error) return { error: error.message }

  if (prev) {
    await audit(supabase, {
      interadmin_id: input.id,
      id_contrato:   prev.id_contrato,
      action:        "UPDATE_BASIC",
      old_value:     JSON.stringify({ estado: prev.estado, fecha_inicio_ejecucion: prev.fecha_inicio_ejecucion, avance_fisico_pct: prev.avance_fisico_pct }),
      new_value:     JSON.stringify(patch),
      user_id:       profile?.id    ?? null,
      user_email:    profile?.email ?? null,
    })
  }

  revalidate(input.id)
  return { error: null }
}

// ── 1. Adiciones ─────────────────────────────────────────────────────────────

export interface CreateAdicionInput {
  interadministrativo_id: number
  numero_adicion: number
  fecha_adicion: string
  valor_total?: number | null
  valor_cuota_gerencia?: number | null
  valor_bienes_servicios?: number | null
  motivo?: string | null
  link_documental?: string | null
}

export async function createAdicion(input: CreateAdicionInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar adiciones." }
  const denied = await requireWrite(input.interadministrativo_id)
  if (denied) return denied
  if (!input.fecha_adicion) return { error: "La fecha de la adición es obligatoria." }
  if (!input.numero_adicion) return { error: "El número de adición es obligatorio." }
  if (input.link_documental) {
    try { new URL(input.link_documental) } catch { return { error: "El enlace documental no es una URL válida." } }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_adiciones").insert({
    interadministrativo_id: input.interadministrativo_id,
    numero_adicion:         input.numero_adicion,
    fecha_adicion:          input.fecha_adicion,
    valor_total:            input.valor_total            ?? null,
    valor_cuota_gerencia:   input.valor_cuota_gerencia   ?? null,
    valor_bienes_servicios: input.valor_bienes_servicios ?? null,
    motivo:                 input.motivo?.trim()         || null,
    link_documental:        input.link_documental?.trim()|| null,
    user_id:                profile?.id                  ?? null,
    user_email:             profile?.email               ?? null,
  })
  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato:   String(input.interadministrativo_id),
    action:        "CREATE_ADICION",
    new_value:     JSON.stringify({ numero: input.numero_adicion, valor_total: input.valor_total }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })
  revalidate(input.interadministrativo_id)
  return { error: null }
}

export async function deleteAdicion(id: number, interadministrativo_id: number): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo ADMIN puede eliminar adiciones." }
  const deniedDelAd = await requireWrite(interadministrativo_id)
  if (deniedDelAd) return deniedDelAd
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_adiciones").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate(interadministrativo_id)
  return { error: null }
}

// ── 2. Prórrogas ─────────────────────────────────────────────────────────────

export interface CreateProrrogaInput {
  interadministrativo_id: number
  numero_prorroga: number
  fecha_suscripcion: string
  nueva_fecha_terminacion: string
  plazo_prorroga?: string | null
  justificacion?: string | null
}

export async function createProrroga(input: CreateProrrogaInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar prórrogas." }
  const deniedPr = await requireWrite(input.interadministrativo_id)
  if (deniedPr) return deniedPr
  if (!input.fecha_suscripcion) return { error: "La fecha de suscripción es obligatoria." }
  if (!input.nueva_fecha_terminacion) return { error: "La nueva fecha de terminación es obligatoria." }
  if (input.nueva_fecha_terminacion < input.fecha_suscripcion)
    return { error: "La nueva fecha de terminación debe ser posterior a la suscripción." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_prorrogas").insert({
    interadministrativo_id:  input.interadministrativo_id,
    numero_prorroga:         input.numero_prorroga,
    fecha_suscripcion:       input.fecha_suscripcion,
    nueva_fecha_terminacion: input.nueva_fecha_terminacion,
    plazo_prorroga:          input.plazo_prorroga?.trim()  || null,
    justificacion:           input.justificacion?.trim()   || null,
    user_id:                 profile?.id                   ?? null,
    user_email:              profile?.email                ?? null,
  })
  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato:   String(input.interadministrativo_id),
    action:        "CREATE_PRORROGA",
    new_value:     JSON.stringify({ numero: input.numero_prorroga, nueva_fecha: input.nueva_fecha_terminacion }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })
  revalidate(input.interadministrativo_id)
  return { error: null }
}

export async function deleteProrroga(id: number, interadministrativo_id: number): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo ADMIN puede eliminar prórrogas." }
  const deniedDelPr = await requireWrite(interadministrativo_id)
  if (deniedDelPr) return deniedDelPr
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_prorrogas").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate(interadministrativo_id)
  return { error: null }
}

// ── 3. Suspensiones ──────────────────────────────────────────────────────────

export interface CreateSuspensionInput {
  interadministrativo_id: number
  numero_suspension: number
  fecha_suscripcion?: string | null
  inicio_suspension: string
  fin_suspension?: string | null
  plazo_suspension?: string | null
  motivo?: string | null
}

export async function createSuspension(input: CreateSuspensionInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar suspensiones." }
  const deniedSu = await requireWrite(input.interadministrativo_id)
  if (deniedSu) return deniedSu
  if (!input.inicio_suspension) return { error: "La fecha de inicio de suspensión es obligatoria." }
  if (input.fin_suspension && input.fin_suspension < input.inicio_suspension)
    return { error: "La fecha de fin debe ser posterior al inicio de la suspensión." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_suspensiones").insert({
    interadministrativo_id: input.interadministrativo_id,
    numero_suspension:      input.numero_suspension,
    fecha_suscripcion:      input.fecha_suscripcion  || null,
    inicio_suspension:      input.inicio_suspension,
    fin_suspension:         input.fin_suspension     || null,
    plazo_suspension:       input.plazo_suspension?.trim() || null,
    motivo:                 input.motivo?.trim()     || null,
    user_id:                profile?.id              ?? null,
    user_email:             profile?.email           ?? null,
  })
  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato:   String(input.interadministrativo_id),
    action:        "CREATE_SUSPENSION",
    new_value:     JSON.stringify({ numero: input.numero_suspension, inicio: input.inicio_suspension }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })
  revalidate(input.interadministrativo_id)
  return { error: null }
}

export async function deleteSuspension(id: number, interadministrativo_id: number): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo ADMIN puede eliminar suspensiones." }
  const deniedDelSu = await requireWrite(interadministrativo_id)
  if (deniedDelSu) return deniedDelSu
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_suspensiones").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate(interadministrativo_id)
  return { error: null }
}

// ── 4. Reinicios ─────────────────────────────────────────────────────────────

export interface CreateReinicioInput {
  interadministrativo_id: number
  numero_reinicio: number
  fecha_reinicio: string
  fecha_suscripcion?: string | null
  motivo?: string | null
  observaciones?: string | null
}

export async function createReinicio(input: CreateReinicioInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar reinicios." }
  const deniedRe = await requireWrite(input.interadministrativo_id)
  if (deniedRe) return deniedRe
  if (!input.fecha_reinicio) return { error: "La fecha de reinicio es obligatoria." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_reinicios").insert({
    interadministrativo_id: input.interadministrativo_id,
    numero_reinicio:        input.numero_reinicio,
    fecha_reinicio:         input.fecha_reinicio,
    fecha_suscripcion:      input.fecha_suscripcion  || null,
    motivo:                 input.motivo?.trim()     || null,
    observaciones:          input.observaciones?.trim() || null,
    user_id:                profile?.id              ?? null,
    user_email:             profile?.email           ?? null,
  })
  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato:   String(input.interadministrativo_id),
    action:        "CREATE_REINICIO",
    new_value:     JSON.stringify({ numero: input.numero_reinicio, fecha: input.fecha_reinicio }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })
  revalidate(input.interadministrativo_id)
  return { error: null }
}

export async function deleteReinicio(id: number, interadministrativo_id: number): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo ADMIN puede eliminar reinicios." }
  const deniedDelRe = await requireWrite(interadministrativo_id)
  if (deniedDelRe) return deniedDelRe
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_reinicios").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate(interadministrativo_id)
  return { error: null }
}

// ── 5. Aclaratorios ──────────────────────────────────────────────────────────

export interface CreateAclaratorioInput {
  interadministrativo_id: number
  numero_aclaratorio: number
  fecha_suscripcion: string
  motivo?: string | null
  descripcion?: string | null
}

export async function createAclaratorio(input: CreateAclaratorioInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar aclaratorios." }
  const deniedAc = await requireWrite(input.interadministrativo_id)
  if (deniedAc) return deniedAc
  if (!input.fecha_suscripcion) return { error: "La fecha de suscripción es obligatoria." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_aclaratorios").insert({
    interadministrativo_id: input.interadministrativo_id,
    numero_aclaratorio:     input.numero_aclaratorio,
    fecha_suscripcion:      input.fecha_suscripcion,
    motivo:                 input.motivo?.trim()      || null,
    descripcion:            input.descripcion?.trim() || null,
    user_id:                profile?.id               ?? null,
    user_email:             profile?.email            ?? null,
  })
  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato:   String(input.interadministrativo_id),
    action:        "CREATE_ACLARATORIO",
    new_value:     JSON.stringify({ numero: input.numero_aclaratorio, fecha: input.fecha_suscripcion }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })
  revalidate(input.interadministrativo_id)
  return { error: null }
}

export async function deleteAclaratorio(id: number, interadministrativo_id: number): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo ADMIN puede eliminar aclaratorios." }
  const deniedDelAc = await requireWrite(interadministrativo_id)
  if (deniedDelAc) return deniedDelAc
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("interadmin_aclaratorios").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate(interadministrativo_id)
  return { error: null }
}
