"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { assertInteradminWriteAccess } from "@/services/interadmin-access"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import { computeDistributionRows, monthName } from "@/types/financial-returns"
import type { RepaymentStatus } from "@/types/financial-returns"

type Res = { error: string | null; id?: number }

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
  payload: Record<string, unknown>,
) {
  supabase.from("interadmin_audit_log" as never).insert(payload as never).then(() => {})
}

async function loadFundingSourcesForGroup(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fundingGroupId: number,
  interadministrativoId: number,
) {
  const { data: group } = await supabase
    .from("interadmin_funding_groups" as never)
    .select("id, group_name, interadministrativo_id")
    .eq("id", fundingGroupId)
    .single()

  if (!group) return { error: "Grupo de financiación no encontrado.", sources: null, groupName: null }
  const g = group as { id: number; group_name: string; interadministrativo_id: number }
  if (g.interadministrativo_id !== interadministrativoId) {
    return { error: "El origen de recursos no pertenece a este contrato.", sources: null, groupName: null }
  }

  const { data: sources } = await supabase
    .from("interadmin_funding_sources" as never)
    .select("id, source_name, participation_percentage, source_value")
    .eq("funding_group_id", fundingGroupId)
    .order("source_name")

  const rows = (sources ?? []) as { id: number; source_name: string; participation_percentage: number; source_value: number }[]
  if (rows.length === 0) {
    return {
      error: `No hay fuentes de financiación configuradas en "${g.group_name}". Configure fuentes antes de registrar rendimientos.`,
      sources: null,
      groupName: g.group_name,
    }
  }

  return { error: null, sources: rows, groupName: g.group_name }
}

async function checkDuplicatePeriod(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fundingGroupId: number,
  month: number,
  year: number,
  excludeId?: number,
): Promise<string | null> {
  let query = supabase
    .from("interadmin_financial_returns" as never)
    .select("id")
    .eq("funding_group_id", fundingGroupId)
    .eq("return_month", month)
    .eq("return_year", year)

  if (excludeId) query = query.neq("id", excludeId)

  const { data } = await query.maybeSingle()
  if (data) {
    return `Ya existe un rendimiento para este origen en ${monthName(month)} ${year}.`
  }
  return null
}

export interface CreateFinancialReturnInput {
  interadministrativo_id: number
  funding_group_id: number
  return_month: number
  return_year: number
  return_date: string
  gross_return_value: number
  observations?: string | null
}

export async function createFinancialReturn(input: CreateFinancialReturnInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar rendimientos." }

  const denied = await requireWrite(input.interadministrativo_id)
  if (denied) return denied

  if (input.return_month < 1 || input.return_month > 12) return { error: "Mes inválido." }
  if (input.return_year < 2000 || input.return_year > 2100) return { error: "Año inválido." }
  if (!input.return_date) return { error: "La fecha de registro es obligatoria." }
  if (input.gross_return_value <= 0) return { error: "El valor del rendimiento debe ser mayor a 0." }

  const supabase = await createSupabaseServerClient()

  const dup = await checkDuplicatePeriod(supabase, input.funding_group_id, input.return_month, input.return_year)
  if (dup) return { error: dup }

  const loaded = await loadFundingSourcesForGroup(supabase, input.funding_group_id, input.interadministrativo_id)
  if (loaded.error || !loaded.sources) return { error: loaded.error! }

  const distRows = computeDistributionRows(input.gross_return_value, loaded.sources)

  const { data: inserted, error } = await supabase
    .from("interadmin_financial_returns" as never)
    .insert({
      interadministrativo_id: input.interadministrativo_id,
      funding_group_id: input.funding_group_id,
      return_month: input.return_month,
      return_year: input.return_year,
      return_date: input.return_date,
      gross_return_value: input.gross_return_value,
      repayment_status: "PENDIENTE",
      observations: input.observations?.trim() || null,
      user_id: profile?.id ?? null,
      user_email: profile?.email ?? null,
    } as never)
    .select("id")
    .single()

  if (error) return { error: error.message }
  const returnId = (inserted as { id: number }).id

  const { error: distError } = await supabase
    .from("interadmin_financial_return_distribution" as never)
    .insert(
      distRows.map((d) => ({
        financial_return_id: returnId,
        interadministrativo_id: input.interadministrativo_id,
        funding_source_id: d.funding_source_id,
        source_name: d.source_name,
        participation_percentage: d.participation_percentage,
        distributed_value: d.distributed_value,
      })) as never,
    )

  if (distError) {
    await supabase.from("interadmin_financial_returns" as never).delete().eq("id", returnId)
    return { error: distError.message }
  }

  const { data: interadmin } = await supabase
    .from("interadministrativos")
    .select("id_contrato")
    .eq("id", input.interadministrativo_id)
    .single()

  await audit(supabase, {
    interadmin_id: input.interadministrativo_id,
    id_contrato: interadmin?.id_contrato ?? null,
    action: "CREATE_FINANCIAL_RETURN",
    old_value: null,
    new_value: JSON.stringify({ ...input, distributions: distRows }),
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
    metadata: JSON.stringify({ origen: loaded.groupName }),
  })

  revalidate(input.interadministrativo_id)
  return { error: null, id: returnId }
}

export async function updateFinancialReturn(
  id: number,
  interadministrativoId: number,
  updates: Partial<CreateFinancialReturnInput> & { repayment_status?: RepaymentStatus },
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar rendimientos." }

  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()

  const { data: prev } = await supabase
    .from("interadmin_financial_returns" as never)
    .select("*")
    .eq("id", id)
    .single()

  if (!prev) return { error: "Rendimiento no encontrado." }
  const prevRow = prev as CreateFinancialReturnInput & { id: number; repayment_status: RepaymentStatus; gross_return_value: number; funding_group_id: number; return_month: number; return_year: number }

  const fundingGroupId = updates.funding_group_id ?? prevRow.funding_group_id
  const month = updates.return_month ?? prevRow.return_month
  const year = updates.return_year ?? prevRow.return_year
  const grossValue = updates.gross_return_value ?? prevRow.gross_return_value

  if (grossValue <= 0) return { error: "El valor del rendimiento debe ser mayor a 0." }

  const dup = await checkDuplicatePeriod(supabase, fundingGroupId, month, year, id)
  if (dup) return { error: dup }

  const needsRedist =
    fundingGroupId !== prevRow.funding_group_id ||
    grossValue !== prevRow.gross_return_value

  let distRows: ReturnType<typeof computeDistributionRows> | null = null
  if (needsRedist) {
    const loaded = await loadFundingSourcesForGroup(supabase, fundingGroupId, interadministrativoId)
    if (loaded.error || !loaded.sources) return { error: loaded.error! }
    distRows = computeDistributionRows(grossValue, loaded.sources)
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.funding_group_id !== undefined) patch.funding_group_id = updates.funding_group_id
  if (updates.return_month !== undefined) patch.return_month = updates.return_month
  if (updates.return_year !== undefined) patch.return_year = updates.return_year
  if (updates.return_date !== undefined) patch.return_date = updates.return_date
  if (updates.gross_return_value !== undefined) patch.gross_return_value = updates.gross_return_value
  if (updates.observations !== undefined) patch.observations = updates.observations?.trim() || null
  if (updates.repayment_status !== undefined) patch.repayment_status = updates.repayment_status

  const { error } = await supabase
    .from("interadmin_financial_returns" as never)
    .update(patch as never)
    .eq("id", id)

  if (error) return { error: error.message }

  if (distRows) {
    await supabase
      .from("interadmin_financial_return_distribution" as never)
      .delete()
      .eq("financial_return_id", id)

    await supabase
      .from("interadmin_financial_return_distribution" as never)
      .insert(
        distRows.map((d) => ({
          financial_return_id: id,
          interadministrativo_id: interadministrativoId,
          funding_source_id: d.funding_source_id,
          source_name: d.source_name,
          participation_percentage: d.participation_percentage,
          distributed_value: d.distributed_value,
        })) as never,
      )
  }

  const { data: interadmin } = await supabase
    .from("interadministrativos")
    .select("id_contrato")
    .eq("id", interadministrativoId)
    .single()

  await audit(supabase, {
    interadmin_id: interadministrativoId,
    id_contrato: interadmin?.id_contrato ?? null,
    action: "UPDATE_FINANCIAL_RETURN",
    old_value: JSON.stringify(prevRow),
    new_value: JSON.stringify({ ...prevRow, ...patch, distributions: distRows }),
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  })

  revalidate(interadministrativoId)
  return { error: null }
}

export async function deleteFinancialReturn(
  id: number,
  interadministrativoId: number,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Sin permisos para eliminar rendimientos." }

  const denied = await requireWrite(interadministrativoId)
  if (denied) return denied

  const supabase = await createSupabaseServerClient()

  const { data: prev } = await supabase
    .from("interadmin_financial_returns" as never)
    .select("*")
    .eq("id", id)
    .single()

  if (!prev) return { error: "Rendimiento no encontrado." }

  const { error } = await supabase
    .from("interadmin_financial_returns" as never)
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
    action: "DELETE_FINANCIAL_RETURN",
    old_value: JSON.stringify(prev),
    new_value: null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  })

  revalidate(interadministrativoId)
  return { error: null }
}
