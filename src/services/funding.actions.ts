"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { assertFinancialWriteAccess } from "@/services/interadmin-access"
import { canEditFinancialTabs, canDeleteProject } from "@/modules/projects/lib/access"
import type { Adicion } from "@/types/modificaciones"

type Res = { error: string | null }

const TOLERANCE = 0.01

async function requireWrite(interadminId: number): Promise<Res | null> {
  const access = await assertFinancialWriteAccess(interadminId)
  if (access.error) return { error: access.error }
  return null
}

function revalidate(projectId: number) {
  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath("/proyectos")
}

async function audit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>,
) {
  supabase.from("interadmin_audit_log" as never).insert(payload as never).then(() => {})
}

async function getGroupTotal(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, groupId: number) {
  const { data } = await supabase
    .from("interadmin_funding_groups" as never)
    .select("total_value, interadministrativo_id, group_name")
    .eq("id", groupId)
    .single()
  return data as { total_value: number; interadministrativo_id: number; group_name: string } | null
}

// ── Sincronizar grupos (bolsa original + adiciones) ───────────────────────────

export async function syncFundingGroups(
  interadministrativoId: number,
  valorInicial: number | null,
  adiciones: Pick<Adicion, "id" | "numero_adicion" | "valor_total">[],
): Promise<Res> {
  const supabase = await createSupabaseServerClient()

  const { data: existing } = await supabase
    .from("interadmin_funding_groups" as never)
    .select("id, group_type, related_modification_id")
    .eq("interadministrativo_id", interadministrativoId)

  const groups = (existing ?? []) as { id: number; group_type: string; related_modification_id: number | null }[]
  const hasOriginal = groups.some((g) => g.group_type === "ORIGINAL")

  if (!hasOriginal) {
    await supabase.from("interadmin_funding_groups" as never).insert({
      interadministrativo_id: interadministrativoId,
      group_type: "ORIGINAL",
      group_name: "Bolsa Original",
      total_value: valorInicial ?? 0,
    } as never)
  } else {
    await supabase
      .from("interadmin_funding_groups" as never)
      .update({ total_value: valorInicial ?? 0, updated_at: new Date().toISOString() } as never)
      .eq("interadministrativo_id", interadministrativoId)
      .eq("group_type", "ORIGINAL")
  }

  for (const ad of adiciones) {
    const exists = groups.some((g) => g.related_modification_id === ad.id)
    if (!exists) {
      await supabase.from("interadmin_funding_groups" as never).insert({
        interadministrativo_id: interadministrativoId,
        group_type: "ADICION",
        group_name: `Adición No. ${ad.numero_adicion}`,
        related_modification_id: ad.id,
        total_value: ad.valor_total ?? 0,
      } as never)
    } else {
      await supabase
        .from("interadmin_funding_groups" as never)
        .update({
          group_name: `Adición No. ${ad.numero_adicion}`,
          total_value: ad.valor_total ?? 0,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("related_modification_id", ad.id)
    }
  }

  return { error: null }
}

// ── CRUD Fuentes ──────────────────────────────────────────────────────────────

export interface CreateFundingSourceInput {
  interadministrativo_id: number
  funding_group_id: number
  source_name: string
  source_value: number
  observations?: string | null
}

export async function createFundingSource(input: CreateFundingSourceInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditFinancialTabs(profile?.role)) return { error: "Sin permisos para registrar fuentes de financiación." }

  const denied = await requireWrite(input.interadministrativo_id)
  if (denied) return denied

  if (!input.source_name.trim()) return { error: "El nombre de la fuente es obligatorio." }
  if (input.source_value <= 0) return { error: "El valor aportado debe ser mayor a 0." }

  const supabase = await createSupabaseServerClient()

  const group = await getGroupTotal(supabase, input.funding_group_id)
  if (!group) return { error: "Grupo de financiación no encontrado." }
  if (group.interadministrativo_id !== input.interadministrativo_id) {
    return { error: "El grupo no pertenece a este contrato." }
  }

  const { data: existingSources } = await supabase
    .from("interadmin_funding_sources" as never)
    .select("source_value")
    .eq("funding_group_id", input.funding_group_id)

  const currentSum = ((existingSources ?? []) as { source_value: number }[])
    .reduce((acc, s) => acc + Number(s.source_value), 0)

  if (currentSum + input.source_value - group.total_value > TOLERANCE) {
    return {
      error: `El valor aportado excede el total del grupo. Disponible: ${Math.max(0, group.total_value - currentSum).toLocaleString("es-CO")} COP.`,
    }
  }

  const { data: inserted, error } = await supabase
    .from("interadmin_funding_sources" as never)
    .insert({
      funding_group_id: input.funding_group_id,
      interadministrativo_id: input.interadministrativo_id,
      source_name: input.source_name.trim(),
      source_value: input.source_value,
      observations: input.observations?.trim() || null,
      user_id: profile?.id ?? null,
      user_email: profile?.email ?? null,
    } as never)
    .select("id, source_name, source_value, participation_percentage")
    .single()

  if (error) return { error: error.message }

  const { data: interadmin } = await supabase
    .from("interadministrativos")
    .select("id_contrato")
    .eq("id", input.interadministrativo_id)
    .single()

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato: interadmin?.id_contrato ?? null,
    action: "CREATE_FUNDING_SOURCE",
    old_value: null,
    new_value: JSON.stringify(inserted),
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
    metadata: JSON.stringify({ group_name: group.group_name }),
  })

  revalidate(input.interadministrativo_id)
  return { error: null }
}

export async function updateFundingSource(
  id: number,
  interadministrativoId: number,
  updates: Partial<CreateFundingSourceInput>,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditFinancialTabs(profile?.role)) return { error: "Sin permisos para editar fuentes de financiación." }

  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()

  const { data: prev } = await supabase
    .from("interadmin_funding_sources" as never)
    .select("*")
    .eq("id", id)
    .single()

  if (!prev) return { error: "Fuente de financiación no encontrada." }

  const prevRow = prev as { funding_group_id: number; source_name: string; source_value: number; observations: string | null }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.source_name !== undefined) {
    if (!updates.source_name.trim()) return { error: "El nombre de la fuente es obligatorio." }
    patch.source_name = updates.source_name.trim()
  }
  if (updates.source_value !== undefined) {
    if (updates.source_value <= 0) return { error: "El valor aportado debe ser mayor a 0." }
    patch.source_value = updates.source_value
  }
  if (updates.observations !== undefined) {
    patch.observations = updates.observations?.trim() || null
  }

  const newValue = (updates.source_value ?? prevRow.source_value) as number
  const group = await getGroupTotal(supabase, prevRow.funding_group_id)
  if (!group) return { error: "Grupo de financiación no encontrado." }

  const { data: siblings } = await supabase
    .from("interadmin_funding_sources" as never)
    .select("source_value")
    .eq("funding_group_id", prevRow.funding_group_id)
    .neq("id", id)

  const siblingSum = ((siblings ?? []) as { source_value: number }[])
    .reduce((acc, s) => acc + Number(s.source_value), 0)

  if (siblingSum + newValue - group.total_value > TOLERANCE) {
    return {
      error: `El valor aportado excede el total del grupo. Disponible: ${Math.max(0, group.total_value - siblingSum).toLocaleString("es-CO")} COP.`,
    }
  }

  const { data: updated, error } = await supabase
    .from("interadmin_funding_sources" as never)
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return { error: error.message }

  const { data: interadmin } = await supabase
    .from("interadministrativos")
    .select("id_contrato")
    .eq("id", interadministrativoId)
    .single()

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    id_contrato: interadmin?.id_contrato ?? null,
    action: "UPDATE_FUNDING_SOURCE",
    old_value: JSON.stringify(prevRow),
    new_value: JSON.stringify(updated),
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  })

  revalidate(interadministrativoId)
  return { error: null }
}

export async function deleteFundingSource(
  id: number,
  interadministrativoId: number,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Sin permisos para eliminar fuentes de financiación." }

  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()

  const { data: prev } = await supabase
    .from("interadmin_funding_sources" as never)
    .select("*")
    .eq("id", id)
    .single()

  if (!prev) return { error: "Fuente de financiación no encontrada." }

  const { error } = await supabase
    .from("interadmin_funding_sources" as never)
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  const { data: interadmin } = await supabase
    .from("interadministrativos")
    .select("id_contrato")
    .eq("id", interadministrativoId)
    .single()

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    id_contrato: interadmin?.id_contrato ?? null,
    action: "DELETE_FUNDING_SOURCE",
    old_value: JSON.stringify(prev),
    new_value: null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  })

  revalidate(interadministrativoId)
  return { error: null }
}
