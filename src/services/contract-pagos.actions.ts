"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { assertContratoWriteAccess } from "./interadmin-access"
import { canEditProjects } from "@/modules/projects/lib/access"
import type { ContractPago } from "@/types/contract-derivado"

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
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateContractPagoInput {
  contrato_id: number
  project_id: string
  fecha_pago: string
  valor_pagado: number
  numero_orden_pago?: string
  numero_factura_contratista?: string
  descuentos?: number
  valor_neto_girado?: number
  observaciones?: string
  enlace_soporte?: string
  factura_interadmin_id?: number
}

export async function createContractPago(input: CreateContractPagoInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar pagos." }
  const denied = await requireWrite(input.contrato_id)
  if (denied) return denied
  if (!input.fecha_pago)       return { error: "La fecha de pago es obligatoria." }
  if (input.valor_pagado <= 0) return { error: "El valor pagado debe ser mayor a cero." }

  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from("contract_pagos" as never)
    .select("numero_pago")
    .eq("contrato_id", input.contrato_id)
    .order("numero_pago", { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = ((last as { numero_pago?: number } | null)?.numero_pago ?? 0) + 1

  const valorNeto = input.valor_neto_girado != null
    ? input.valor_neto_girado
    : input.valor_pagado - (input.descuentos ?? 0)

  const { error } = await supabase.from("contract_pagos" as never).insert({
    contrato_id: input.contrato_id,
    numero_pago: numero,
    fecha_pago: input.fecha_pago,
    valor_pagado: input.valor_pagado,
    numero_orden_pago: input.numero_orden_pago?.trim() ?? null,
    numero_factura_contratista: input.numero_factura_contratista?.trim() ?? null,
    descuentos: input.descuentos ?? 0,
    valor_neto_girado: valorNeto,
    observaciones: input.observaciones?.trim() ?? null,
    enlace_soporte: input.enlace_soporte?.trim() ?? null,
    factura_interadmin_id: input.factura_interadmin_id ?? null,
    user_id: profile?.id ?? null,
    user_email: profile?.email ?? null,
  } as never)

  if (error) return { error: error.message }

  await supabase.from("contract_derivado_change_log" as never).insert({
    contrato_id: input.contrato_id,
    field_name: "pago",
    old_value: null,
    new_value: `Pago N°${numero} — valor: ${input.valor_pagado} — fecha: ${input.fecha_pago}`,
    changed_by: profile?.full_name ?? profile?.email ?? null,
    changed_by_id: profile?.id ?? null,
  } as never)

  revalidate(input.project_id, input.contrato_id)
  return { error: null }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteContractPago(
  id: number, contratoId: number, projectId: string
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos." }
  const denied = await requireWrite(contratoId)
  if (denied) return denied
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("contract_pagos" as never)
    .delete()
    .eq("id", id as never)
  if (error) return { error: error.message }
  revalidate(projectId, contratoId)
  return { error: null }
}
