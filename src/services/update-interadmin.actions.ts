"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { assertInteradminWriteAccess } from "./interadmin-access"
import { canEditProjects } from "@/modules/projects/lib/access"
import type { EstadoInteradministrativo } from "@/types/database"
import type { ChangeLogEntry } from "@/types/change-log"

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

const NUMERIC_FIELDS = new Set([
  "pct_cuota_gerencia",
  "valor_inicial",
  "cuota_admin_inicial",
  "total_contrato",
  "avance_fisico_pct",
])

function fieldValuesEqual(key: string, oldVal: unknown, newVal: unknown): boolean {
  if (NUMERIC_FIELDS.has(key)) {
    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }
    let oldN = toNum(oldVal)
    let newN = toNum(newVal)
    // La UI muestra null como 0% en el formulario de edición
    if (key === "avance_fisico_pct") {
      if (oldN === null) oldN = 0
      if (newN === null) newN = 0
    }
    if (oldN === null && newN === null) return true
    if (oldN === null || newN === null) return false
    return Math.abs(oldN - newN) < 0.001
  }

  const norm = (v: unknown): string | null => {
    if (v === null || v === undefined || v === "") return null
    return String(v).trim()
  }
  return norm(oldVal) === norm(newVal)
}

function safeRevalidate(projectId: number) {
  try {
    revalidatePath(`/proyectos/${projectId}`, "page")
    revalidatePath("/proyectos", "page")
    revalidatePath("/", "page")
  } catch (e) {
    console.warn("[updateInteradministrativo] revalidatePath:", e)
  }
}

export async function updateInteradministrativo(
  input: UpdateInteradminInput
): Promise<{ error: string | null }> {
  try {
    const profile = await getCurrentUserProfile().catch(() => null)
    if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar contratos." }

    const access = await assertInteradminWriteAccess(input.id)
    if (access.error) return access

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
      .maybeSingle()

    if (fetchErr) return { error: fetchErr.message }
    if (!prev) return { error: "No se pudo cargar el registro actual." }

    const prevRecord = prev as Record<string, unknown>
    const prevIdContrato = prevRecord.id_contrato as string

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

    const normForLog = (v: unknown): string | null => {
      if (v === null || v === undefined || v === "") return null
      return String(v)
    }

    for (const key of EDITABLE_KEYS) {
      if (!(key in input)) continue
      const newVal = input[key] as unknown
      const oldVal = prevRecord[key]

      if (fieldValuesEqual(key, oldVal, newVal)) continue

      patch[key] = newVal === "" || newVal === undefined ? null : newVal
      changes.push({
        field: key,
        oldVal: normForLog(oldVal),
        newVal: normForLog(newVal),
      })
    }

    if (Object.keys(patch).length === 0) return { error: null }

    patch.updated_at = new Date().toISOString()
    const { data: updated, error: updateErr } = await supabase
      .from("interadministrativos")
      .update(patch)
      .eq("id", input.id)
      .select("id")
      .maybeSingle()

    if (updateErr) {
      if (updateErr.message.includes("avance_fisico_pct")) {
        return {
          error:
            "Falta la columna avance_fisico_pct en Supabase. Ejecute MIGRATION_MODIFICACIONES.sql.",
        }
      }
      return { error: updateErr.message }
    }

    if (!updated) {
      return {
        error:
          "No se guardaron los cambios. Verifique permisos de escritura (RLS) en Supabase — ejecute MIGRATION_INTERADMIN_RLS.sql.",
      }
    }

    // Si cambió el N° de contrato, actualizar referencias en contratos derivados
    const newIdContrato = patch.id_contrato as string | undefined
    if (newIdContrato && newIdContrato !== prevIdContrato) {
      const { error: syncErr } = await supabase
        .from("contratos")
        .update({ id_interadministrativo: newIdContrato })
        .eq("id_interadministrativo", prevIdContrato)

      if (syncErr) {
        console.warn("[updateInteradministrativo] sync contratos:", syncErr.message)
      }
    }

    // Fire-and-forget audit — no bloquear la respuesta si falla el historial
    const now = new Date().toISOString()
    const auditIdContrato = (newIdContrato ?? prevIdContrato) as string
    void Promise.all([
      changes.length > 0
        ? supabase.from("contract_change_log" as never).insert(
            changes.map((c) => ({
              interadministrativo_id: input.id,
              field_name: c.field,
              old_value: c.oldVal,
              new_value: c.newVal,
              changed_by: profile?.email ?? null,
              changed_by_id: profile?.id ?? null,
              changed_at: now,
            })) as never
          )
        : Promise.resolve({ error: null }),
      supabase.from("interadmin_audit_log" as never).insert({
        interadmin_id: input.id,
        id_contrato: auditIdContrato,
        action: "UPDATE_FULL",
        old_value: JSON.stringify(Object.fromEntries(changes.map((c) => [c.field, c.oldVal]))),
        new_value: JSON.stringify(Object.fromEntries(changes.map((c) => [c.field, c.newVal]))),
        user_id: profile?.id ?? null,
        user_email: profile?.email ?? null,
      } as never),
    ]).catch((e) => console.warn("[updateInteradministrativo] audit:", e))

    safeRevalidate(input.id)
    return { error: null }
  } catch (e) {
    console.error("[updateInteradministrativo]", e)
    return { error: e instanceof Error ? e.message : "Error inesperado al guardar." }
  }
}
