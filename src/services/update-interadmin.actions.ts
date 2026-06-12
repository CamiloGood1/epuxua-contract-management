"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import type { EstadoInteradministrativo } from "@/types/database"
import type { ChangeLogEntry } from "@/types/change-log"

export type { ChangeLogEntry }

// ── Input type ────────────────────────────────────────────────────────────────

export interface UpdateInteradminInput {
  id: number
  id_contrato?: string
  objeto_contrato?: string | null
  secretaria?: string | null
  area_responsable?: string | null
  categoria?: string | null
  clase_contrato?: string | null
  modalidad_seleccion?: string | null
  estado?: EstadoInteradministrativo
  supervision?: string | null
  fecha_suscripcion?: string | null
  fecha_inicio_ejecucion?: string | null
  fecha_terminacion?: string | null
  plazo_ejecucion_inicial?: string | null
  pct_cuota_gerencia?: number | null
  valor_inicial?: number | null
  cuota_admin_inicial?: number | null
  total_contrato?: number | null
  link_secop?: string | null
  link_documentacion?: string | null
  avance_fisico_pct?: number | null
  observaciones?: string | null
}

// ── Load change log ───────────────────────────────────────────────────────────

export async function getChangeLog(interadministrativoId: number): Promise<ChangeLogEntry[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("contract_change_log" as never)
      .select("*")
      .eq("interadministrativo_id", interadministrativoId)
      .order("changed_at", { ascending: false })
      .limit(200)
    return (data ?? []) as ChangeLogEntry[]
  } catch {
    return []
  }
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function updateInteradministrativo(input: UpdateInteradminInput): Promise<{ error: string | null }> {
  try {
    const profile = await getCurrentUserProfile().catch(() => null)
    if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar contratos." }

    if (input.avance_fisico_pct != null && (input.avance_fisico_pct < 0 || input.avance_fisico_pct > 100))
      return { error: "El avance físico debe estar entre 0 y 100." }

    if (
      input.cuota_admin_inicial != null &&
      input.total_contrato      != null &&
      input.cuota_admin_inicial > input.total_contrato
    ) return { error: "La Cuota de Gerencia no puede superar el Valor Total del contrato." }

    const supabase = await createSupabaseServerClient()

    const { data: prev, error: fetchErr } = await supabase
      .from("interadministrativos")
      .select("*")
      .eq("id", input.id)
      .single()

    if (fetchErr || !prev) return { error: "No se pudo cargar el registro actual." }

    const prevRecord = prev as Record<string, unknown>

    const EDITABLE_KEYS: (keyof UpdateInteradminInput)[] = [
      "id_contrato", "objeto_contrato", "secretaria", "area_responsable", "categoria",
      "clase_contrato", "modalidad_seleccion", "estado", "supervision",
      "fecha_suscripcion", "fecha_inicio_ejecucion", "fecha_terminacion",
      "plazo_ejecucion_inicial", "pct_cuota_gerencia", "valor_inicial",
      "cuota_admin_inicial", "total_contrato", "link_secop", "link_documentacion",
      "avance_fisico_pct", "observaciones",
    ]

    const patch: Record<string, unknown> = {}
    const changes: Array<{ field: string; oldVal: string | null; newVal: string | null }> = []

    for (const key of EDITABLE_KEYS) {
      if (!(key in input)) continue
      const newVal = input[key] as unknown
      const oldVal = prevRecord[key]

      const norm = (v: unknown): string | null => {
        if (v === null || v === undefined || v === "") return null
        return String(v)
      }

      const oldStr = norm(oldVal)
      const newStr = norm(newVal)

      if (oldStr !== newStr) {
        patch[key] = (newVal === "" || newVal === undefined) ? null : newVal
        changes.push({ field: key, oldVal: oldStr, newVal: newStr })
      }
    }

    if (Object.keys(patch).length === 0) return { error: null }

    patch.updated_at = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from("interadministrativos")
      .update(patch)
      .eq("id", input.id)

    if (updateErr) return { error: updateErr.message }

    // Fire-and-forget audit writes — do not let failures block the response
    const now = new Date().toISOString()
    Promise.all([
      supabase
        .from("contract_change_log" as never)
        .insert(
          changes.map(c => ({
            interadministrativo_id: input.id,
            field_name:    c.field,
            old_value:     c.oldVal,
            new_value:     c.newVal,
            changed_by:    profile?.email ?? null,
            changed_by_id: profile?.id    ?? null,
            changed_at:    now,
          })) as never,
        ),
      supabase
        .from("interadmin_audit_log" as never)
        .insert({
          interadmin_id: input.id,
          id_contrato:   prevRecord.id_contrato as string,
          action:        "UPDATE_FULL",
          old_value:     JSON.stringify(Object.fromEntries(changes.map(c => [c.field, c.oldVal]))),
          new_value:     JSON.stringify(Object.fromEntries(changes.map(c => [c.field, c.newVal]))),
          user_id:       profile?.id    ?? null,
          user_email:    profile?.email ?? null,
        } as never),
    ]).catch(() => {})

    revalidatePath(`/proyectos/${input.id}`)
    revalidatePath("/proyectos")
    return { error: null }
  } catch (e) {
    console.error("[updateInteradministrativo]", e)
    return { error: e instanceof Error ? e.message : "Error inesperado al guardar." }
  }
}
