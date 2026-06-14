"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { assertContratoWriteAccess } from "./interadmin-access"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import type { ContractTask } from "@/types/contract-derivado"

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
  revalidatePath("/proyectos/kanban")
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateContractTaskInput {
  contrato_id: number
  project_id: string
  nombre: string
  descripcion: string
  fecha_compromiso: string
  prioridad: ContractTask["prioridad"]
  responsable: string
}

export async function createContractTask(input: CreateContractTaskInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para crear tareas." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.nombre.trim())       return { error: "El nombre de la tarea es obligatorio." }
  if (!input.descripcion.trim())  return { error: "La descripción es obligatoria." }
  if (!input.fecha_compromiso)    return { error: "La fecha compromiso es obligatoria." }
  if (!input.responsable.trim())  return { error: "El responsable es obligatorio." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("contract_tasks" as never).insert({
    contrato_id: input.contrato_id,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion.trim(),
    fecha_compromiso: input.fecha_compromiso,
    prioridad: input.prioridad,
    responsable: input.responsable.trim(),
    status: "PENDIENTE",
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }
  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

// ── Update status ─────────────────────────────────────────────────────────────

export async function startContractTask(
  id: number, contratoId: number, projectId: string
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("contract_tasks" as never)
    .update({ status: "EN_PROCESO" } as never)
    .eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}

export interface CompleteContractTaskInput {
  id: number
  contrato_id: number
  project_id: string
  comentario_cierre?: string
  enlace_evidencia_cierre?: string
}

export async function completeContractTask(input: CompleteContractTaskInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("contract_tasks" as never)
    .update({
      status: "COMPLETADA",
      fecha_completada: new Date().toISOString().split("T")[0],
      comentario_cierre: input.comentario_cierre?.trim() ?? null,
      enlace_evidencia_cierre: input.enlace_evidencia_cierre?.trim() ?? null,
    } as never)
    .eq("id", input.id as never)
  if (error) return { error: error.message }
  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteContractTask(
  id: number, contratoId: number, projectId: string, deleteReason: string
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Solo los administradores pueden eliminar tareas." }
  if (!deleteReason.trim()) return { error: "El motivo de eliminación es obligatorio." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()
  const deletedBy = profile?.full_name ?? profile?.email ?? "ADMIN"
  const deletedAt = new Date().toISOString()

  const { error } = await supabase
    .from("contract_tasks" as never)
    .update({
      deleted_at:    deletedAt,
      deleted_by:    deletedBy,
      delete_reason: deleteReason.trim(),
    } as never)
    .eq("id", id as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id:    contratoId,
    field_name:     "tarea_eliminada",
    old_value:      JSON.stringify({ id, status: "activa" }),
    new_value:      JSON.stringify({ status: "ELIMINADA", deleted_by: deletedBy, delete_reason: deleteReason.trim(), deleted_at: deletedAt }),
    changed_by:     deletedBy,
    changed_by_id:  profile?.id ?? null,
  } as never)

  revalidate(projectId, contratoId)
  return { error: null }
}

export type { ContractTask }
