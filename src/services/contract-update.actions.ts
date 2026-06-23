"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { assertContratoWriteAccess } from "./interadmin-access"
import { canEditProjects } from "@/modules/projects/lib/access"

type Res = { error: string | null }

// ── Input ─────────────────────────────────────────────────────────────────────

export interface UpdateContratoInput {
  id: number
  project_id: string
  // Campos editables
  contratista?:              string | null
  objeto_contrato?:          string | null
  supervisor?:               string | null
  estado?:                   string | null
  fecha_suscripcion?:        string | null
  fecha_inicio?:             string | null
  fecha_terminacion?:        string | null
  plazo_ejecucion?:          string | null
  valor_inicial?:            number | null
  adicion?:                  number | null
  valor_final?:              number | null
  valor_pagado?:             number | null
  valor_pendiente?:          number | null
  modalidad_seleccion?:      string | null
  clase_contrato?:           string | null
  area_responsable?:         string | null
  persona_natural_juridica?: string | null
  recurso?:                  string | null
  rubro?:                    string | null
  numero_proceso_seleccion?: string | null
  nit_identificacion?:       string | null
  cdp?:                      string | null
  fecha_cdp?:                string | null
  crp?:                      string | null
  fecha_crp?:                string | null
  link_carpeta_documental?:  string | null
  numero_poliza?:            string | null
  fecha_aprobacion_poliza?:  string | null
  link_ficha?:               string | null
  observaciones?:            string | null
}

// ── Acción ────────────────────────────────────────────────────────────────────

export async function updateContrato(input: UpdateContratoInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar contratos." }

  const access = await assertContratoWriteAccess(input.id)
  if (access.error) return { error: access.error }

  const supabase = await createSupabaseServerClient()

  // Leer valores anteriores para change log
  const { data: prev } = await supabase
    .from("contratos")
    .select("*")
    .eq("id", input.id)
    .maybeSingle()

  if (!prev) return { error: "Contrato no encontrado." }

  // Construir patch solo con campos presentes
  const { id, project_id, ...fields } = input
  const patch: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) patch[key] = val
  }

  if (Object.keys(patch).length === 0) return { error: null }

  const { error } = await supabase.from("contratos").update(patch).eq("id", id)
  if (error) return { error: error.message }

  // Change log — una entrada por campo modificado
  const logEntries: Record<string, unknown>[] = []
  for (const [key, newVal] of Object.entries(patch)) {
    const oldVal = (prev as Record<string, unknown>)[key]
    const oldStr = oldVal != null ? String(oldVal) : null
    const newStr = newVal != null ? String(newVal) : null
    if (oldStr !== newStr) {
      logEntries.push({
        contrato_id:    id,
        field_name:     key,
        old_value:      oldStr,
        new_value:      newStr,
        changed_by:     profile?.full_name ?? profile?.email ?? null,
        changed_by_id:  profile?.id ?? null,
      })
    }
  }

  if (logEntries.length > 0) {
    await supabase
      .from("contract_derivado_change_log" as never)
      .insert(logEntries as never)
  }

  revalidatePath(`/contratacion/derivados/${id}`)
  revalidatePath("/contratacion/derivados")
  revalidatePath(`/proyectos/${project_id}/contratos/${id}`)
  revalidatePath(`/proyectos/${project_id}`)
  return { error: null }
}
