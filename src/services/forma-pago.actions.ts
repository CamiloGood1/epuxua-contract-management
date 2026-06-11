"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import type { DestinoHito } from "@/types/forma-pago"

type Res = { error: string | null }

export interface CreateMilestoneInput {
  interadministrativo_id: number
  milestone_number: number
  milestone_name: string
  destination: DestinoHito
  percentage?: number | null
  scheduled_value: number
  payment_condition: string
  observations?: string | null
}

async function audit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>,
) {
  supabase.from("interadmin_audit_log" as never).insert(payload as never).then(() => {})
}

export async function createMilestone(input: CreateMilestoneInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar hitos de pago." }
  if (!input.milestone_name.trim())     return { error: "El nombre del hito es obligatorio." }
  if (!input.payment_condition.trim())  return { error: "La condición de pago es obligatoria." }
  if (input.scheduled_value <= 0)       return { error: "El valor programado debe ser mayor a cero." }
  if (input.percentage != null && (input.percentage < 0 || input.percentage > 100)) {
    return { error: "El porcentaje debe estar entre 0 y 100." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("contract_payment_schedule" as never)
    .insert({
      interadministrativo_id: input.interadministrativo_id,
      milestone_number:   input.milestone_number,
      milestone_name:     input.milestone_name.trim(),
      destination:        input.destination,
      percentage:         input.percentage ?? null,
      scheduled_value:    input.scheduled_value,
      payment_condition:  input.payment_condition.trim(),
      observations:       input.observations?.trim() || null,
      created_by:         profile?.email ?? null,
      created_by_id:      profile?.id    ?? null,
    } as never)

  if (error) {
    if (error.code === "23505") return { error: `El número de hito ${input.milestone_number} ya existe en este contrato.` }
    return { error: error.message }
  }

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    action:        "CREATE_PAYMENT_MILESTONE",
    new_value:     JSON.stringify({ milestone_number: input.milestone_number, milestone_name: input.milestone_name, scheduled_value: input.scheduled_value }),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePath(`/proyectos/${input.interadministrativo_id}`)
  return { error: null }
}

export async function updateMilestone(
  id: number,
  interadministrativoId: number,
  updates: Partial<CreateMilestoneInput>,
  prevSnapshot: Record<string, unknown>,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar hitos de pago." }
  if (updates.scheduled_value !== undefined && updates.scheduled_value <= 0) {
    return { error: "El valor programado debe ser mayor a cero." }
  }
  if (updates.percentage != null && (updates.percentage < 0 || updates.percentage > 100)) {
    return { error: "El porcentaje debe estar entre 0 y 100." }
  }

  const supabase = await createSupabaseServerClient()

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.milestone_number   !== undefined) patch.milestone_number   = updates.milestone_number
  if (updates.milestone_name     !== undefined) patch.milestone_name     = updates.milestone_name.trim()
  if (updates.destination        !== undefined) patch.destination        = updates.destination
  if (updates.percentage         !== undefined) patch.percentage         = updates.percentage ?? null
  if (updates.scheduled_value    !== undefined) patch.scheduled_value    = updates.scheduled_value
  if (updates.payment_condition  !== undefined) patch.payment_condition  = updates.payment_condition.trim()
  if (updates.observations       !== undefined) patch.observations       = updates.observations?.trim() || null

  const { error } = await supabase
    .from("contract_payment_schedule" as never)
    .update(patch as never)
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { error: `El número de hito ${updates.milestone_number} ya existe en este contrato.` }
    return { error: error.message }
  }

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    action:        "UPDATE_PAYMENT_MILESTONE",
    old_value:     JSON.stringify(prevSnapshot),
    new_value:     JSON.stringify(patch),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePath(`/proyectos/${interadministrativoId}`)
  return { error: null }
}

export async function deleteMilestone(
  id: number,
  interadministrativoId: number,
  snapshot: Record<string, unknown>,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Sin permisos para eliminar hitos de pago." }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("contract_payment_schedule" as never)
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    action:        "DELETE_PAYMENT_MILESTONE",
    old_value:     JSON.stringify(snapshot),
    user_id:       profile?.id    ?? null,
    user_email:    profile?.email ?? null,
  })

  revalidatePath(`/proyectos/${interadministrativoId}`)
  return { error: null }
}
