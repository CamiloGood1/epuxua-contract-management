"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { assertInteradminWriteAccess } from "./interadmin-access"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import type { TareaPrioridad, TareaStatus } from "@/types/seguimiento"

type Res = { error: string | null }

async function requireWrite(interadminId: number): Promise<Res | null> {
  const access = await assertInteradminWriteAccess(interadminId)
  if (access.error) return { error: access.error }
  return null
}

async function audit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>,
) {
  supabase.from("interadmin_audit_log" as never).insert(payload as never).then(() => {})
}

function revalidatePaths(interadminId: number) {
  revalidatePath(`/proyectos/${interadminId}`)
  revalidatePath("/proyectos/kanban")
}

// ── Tareas ────────────────────────────────────────────────────────────────────

export interface CreateTareaInput {
  interadministrativo_id: number
  nombre: string
  descripcion: string
  fecha_compromiso: string
  prioridad: TareaPrioridad
  responsable: string
}

export async function createTarea(input: CreateTareaInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para crear tareas." }
  const denied = await requireWrite(input.interadministrativo_id)
  if (denied) return denied
  if (!input.nombre.trim())       return { error: "El nombre de la tarea es obligatorio." }
  if (!input.descripcion.trim())  return { error: "La descripción es obligatoria." }
  if (!input.fecha_compromiso)    return { error: "La fecha compromiso es obligatoria." }
  if (!input.responsable.trim())  return { error: "El responsable es obligatorio." }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_tasks" as never)
    .insert({
      interadministrativo_id: input.interadministrativo_id,
      nombre:           input.nombre.trim(),
      descripcion:      input.descripcion.trim(),
      fecha_compromiso: input.fecha_compromiso,
      prioridad:        input.prioridad,
      responsable:      input.responsable.trim(),
      status:           "PENDIENTE" as TareaStatus,
      user_id:          profile?.id    ?? null,
      user_email:       profile?.email ?? null,
    } as never)

  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    action:        "CREATE_TAREA",
    new_value:     JSON.stringify({ nombre: input.nombre, prioridad: input.prioridad, responsable: input.responsable }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePaths(input.interadministrativo_id)
  return { error: null }
}

export async function startTarea(
  id: number,
  interadministrativoId: number,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_tasks" as never)
    .update({ status: "EN_PROCESO", updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("status", "PENDIENTE")

  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    action:        "START_TAREA",
    old_value:     JSON.stringify({ status: "PENDIENTE" }),
    new_value:     JSON.stringify({ status: "EN_PROCESO" }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePaths(interadministrativoId)
  return { error: null }
}

export interface CompleteTareaInput {
  id: number
  interadministrativo_id: number
  enlace_evidencia_cierre: string
  comentario_cierre?: string | null
}

export async function completeTarea(input: CompleteTareaInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(input.interadministrativo_id)
  if (denied) return denied
  if (!input.enlace_evidencia_cierre.trim()) return { error: "El enlace de evidencia es obligatorio." }
  try { new URL(input.enlace_evidencia_cierre) }
  catch { return { error: "El enlace de evidencia no es una URL válida." } }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_tasks" as never)
    .update({
      status:                  "COMPLETADA",
      fecha_completada:        new Date().toISOString().split("T")[0],
      enlace_evidencia_cierre: input.enlace_evidencia_cierre.trim(),
      comentario_cierre:       input.comentario_cierre?.trim() || null,
      updated_at:              new Date().toISOString(),
    } as never)
    .eq("id", input.id)

  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    action:        "COMPLETE_TAREA",
    new_value:     JSON.stringify({ status: "COMPLETADA", enlace: input.enlace_evidencia_cierre }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePaths(input.interadministrativo_id)
  return { error: null }
}

export async function deleteTarea(
  id: number,
  interadministrativoId: number,
  snapshot: Record<string, unknown>,
  deleteReason: string,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo los administradores pueden eliminar tareas." }
  if (!deleteReason.trim()) return { error: "El motivo de eliminación es obligatorio." }
  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()
  const deletedBy = profile?.full_name ?? profile?.email ?? "ADMIN"
  const deletedAt = new Date().toISOString()

  const { error } = await supabase
    .from("interadmin_tasks" as never)
    .update({
      deleted_at:    deletedAt,
      deleted_by:    deletedBy,
      delete_reason: deleteReason.trim(),
    } as never)
    .eq("id", id)

  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    action:        "DELETE_TAREA",
    old_value:     JSON.stringify(snapshot),
    new_value:     JSON.stringify({ status: "ELIMINADA", deleted_by: deletedBy, delete_reason: deleteReason.trim(), deleted_at: deletedAt }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePaths(interadministrativoId)
  return { error: null }
}

// ── Avances ───────────────────────────────────────────────────────────────────

export interface CreateAvanceInput {
  interadministrativo_id: number
  fecha: string
  descripcion: string
  enlace_evidencia: string
}

export async function createAvance(input: CreateAvanceInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar avances." }
  const denied = await requireWrite(input.interadministrativo_id)
  if (denied) return denied
  if (!input.fecha)                    return { error: "La fecha es obligatoria." }
  if (!input.descripcion.trim())       return { error: "La descripción es obligatoria." }
  if (!input.enlace_evidencia.trim())  return { error: "El enlace de evidencia es obligatorio." }
  try { new URL(input.enlace_evidencia) }
  catch { return { error: "El enlace de evidencia no es una URL válida." } }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_avances" as never)
    .insert({
      interadministrativo_id: input.interadministrativo_id,
      fecha:            input.fecha,
      descripcion:      input.descripcion.trim(),
      enlace_evidencia: input.enlace_evidencia.trim(),
      user_id:          profile?.id    ?? null,
      user_email:       profile?.email ?? null,
    } as never)

  if (error) return { error: error.message }

  revalidatePaths(input.interadministrativo_id)
  return { error: null }
}

export async function deleteAvance(
  id: number,
  interadministrativoId: number,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo los administradores pueden eliminar avances." }
  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_avances" as never)
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePaths(interadministrativoId)
  return { error: null }
}
