"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { canCreateProposal, canEditProposal, canDeleteProposal } from "@/modules/proposals/lib/access"
import type { ProposalRequest, ProposalAuditEntry, ProposalStatus, ProposalType } from "@/types/proposals"
import { PROPOSAL_FIELD_LABELS } from "@/types/proposals"

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateProposalInput {
  reception_date:             string
  client_name:                string
  proposal_object:            string
  proposal_delivery_deadline: string
  proposal_type:              ProposalType
  status:                     ProposalStatus
  submission_date?:           string | null
  request_link?:              string | null
  proposal_link?:             string | null
  observations?:              string | null
}

export interface UpdateProposalInput extends Partial<CreateProposalInput> {
  id: number
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getProposals(): Promise<ProposalRequest[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("proposal_requests" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)
    return (data ?? []) as ProposalRequest[]
  } catch {
    return []
  }
}

export async function getProposalAuditLog(proposalId: number): Promise<ProposalAuditEntry[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("proposal_audit_log" as never)
      .select("*")
      .eq("proposal_id", proposalId)
      .order("changed_at", { ascending: false })
      .limit(500)
    return (data ?? []) as ProposalAuditEntry[]
  } catch {
    return []
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createProposal(
  input: CreateProposalInput
): Promise<{ id: number | null; error: string | null }> {
  try {
    const profile = await getCurrentUserProfile().catch(() => null)
    if (!canCreateProposal(profile?.role)) return { id: null, error: "Sin permisos para crear propuestas." }

    const supabase = await createSupabaseServerClient()
    const now = new Date().toISOString()

    const row = {
      reception_date:             input.reception_date,
      client_name:                input.client_name.trim(),
      proposal_object:            input.proposal_object.trim(),
      proposal_delivery_deadline: input.proposal_delivery_deadline,
      proposal_type:              input.proposal_type,
      status:                     input.status,
      submission_date:            input.submission_date   || null,
      request_link:               input.request_link     || null,
      proposal_link:              input.proposal_link    || null,
      observations:               input.observations     || null,
      created_by:                 profile?.full_name ?? profile?.email ?? null,
      created_by_id:              profile?.id ?? null,
      updated_by:                 profile?.full_name ?? profile?.email ?? null,
      updated_by_id:              profile?.id ?? null,
      created_at:                 now,
      updated_at:                 now,
    }

    const { data, error } = await supabase
      .from("proposal_requests" as never)
      .insert(row as never)
      .select("id")
      .maybeSingle()

    if (error) return { id: null, error: (error as { message: string }).message }
    const newId = (data as { id: number } | null)?.id ?? null

    if (newId) {
      void supabase
        .from("proposal_audit_log" as never)
        .insert({
          proposal_id:  newId,
          action:       "CREATE",
          field_name:   null,
          old_value:    null,
          new_value:    JSON.stringify(row),
          changed_by:   profile?.full_name ?? profile?.email ?? null,
          changed_by_id: profile?.id ?? null,
          changed_at:   now,
        } as never)
        .then(() => {})
    }

    revalidatePath("/propuestas")
    return { id: newId, error: null }
  } catch (e) {
    console.error("[createProposal]", e)
    return { id: null, error: e instanceof Error ? e.message : "Error inesperado." }
  }
}

export async function updateProposal(
  input: UpdateProposalInput
): Promise<{ error: string | null }> {
  try {
    const profile = await getCurrentUserProfile().catch(() => null)
    if (!canEditProposal(profile?.role)) return { error: "Sin permisos para editar propuestas." }

    const supabase = await createSupabaseServerClient()

    const { data: prev, error: fetchErr } = await supabase
      .from("proposal_requests" as never)
      .select("*")
      .eq("id", input.id)
      .maybeSingle()

    if (fetchErr) return { error: (fetchErr as { message: string }).message }
    if (!prev) return { error: "No se encontró la propuesta." }

    const prevRecord = prev as Record<string, unknown>

    const EDITABLE_KEYS: (keyof CreateProposalInput)[] = [
      "reception_date", "client_name", "proposal_object", "proposal_delivery_deadline",
      "proposal_type", "status", "submission_date", "request_link", "proposal_link", "observations",
    ]

    const patch: Record<string, unknown> = {}
    const auditRows: Array<{ field: string; oldVal: string | null; newVal: string | null }> = []

    for (const key of EDITABLE_KEYS) {
      if (!(key in input)) continue
      const newVal = (input as unknown as Record<string, unknown>)[key]
      const oldVal = prevRecord[key]
      const normStr = (v: unknown): string | null =>
        v === null || v === undefined || v === "" ? null : String(v).trim()
      if (normStr(oldVal) === normStr(newVal)) continue
      patch[key] = newVal === "" || newVal === undefined ? null : newVal
      auditRows.push({ field: key, oldVal: normStr(oldVal), newVal: normStr(newVal) })
    }

    if (Object.keys(patch).length === 0) return { error: null }

    const now = new Date().toISOString()
    patch.updated_at = now
    patch.updated_by = profile?.full_name ?? profile?.email ?? null
    patch.updated_by_id = profile?.id ?? null

    const { error: updateErr } = await supabase
      .from("proposal_requests" as never)
      .update(patch as never)
      .eq("id", input.id)

    if (updateErr) return { error: (updateErr as { message: string }).message }

    void supabase
      .from("proposal_audit_log" as never)
      .insert(
        auditRows.map(r => ({
          proposal_id:   input.id,
          action:        "UPDATE",
          field_name:    r.field,
          old_value:     r.oldVal,
          new_value:     r.newVal,
          changed_by:    profile?.full_name ?? profile?.email ?? null,
          changed_by_id: profile?.id ?? null,
          changed_at:    now,
        })) as never
      )
      .then(() => {})

    revalidatePath("/propuestas")
    return { error: null }
  } catch (e) {
    console.error("[updateProposal]", e)
    return { error: e instanceof Error ? e.message : "Error inesperado." }
  }
}

export async function deleteProposal(id: number): Promise<{ error: string | null }> {
  try {
    const profile = await getCurrentUserProfile().catch(() => null)
    if (!canDeleteProposal(profile?.role)) return { error: "Solo administradores pueden eliminar propuestas." }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from("proposal_requests" as never)
      .delete()
      .eq("id", id)

    if (error) return { error: (error as { message: string }).message }

    revalidatePath("/propuestas")
    return { error: null }
  } catch (e) {
    console.error("[deleteProposal]", e)
    return { error: e instanceof Error ? e.message : "Error inesperado." }
  }
}

export { PROPOSAL_FIELD_LABELS }
