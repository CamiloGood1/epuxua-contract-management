"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "./user.service"
import { canEditProjects, canDeleteProject } from "@/modules/projects/lib/access"
import type { DestinoFactura, EstadoFactura } from "@/types/facturas"

type Res = { error: string | null }

export interface CreateFacturaInput {
  interadministrativo_id: number
  numero_factura: string
  fecha_remision: string
  fecha_ingreso?: string | null
  destino: DestinoFactura
  valor_cobrado: number
  valor_ingresado?: number
  descuentos?: number
  estado: EstadoFactura
}

export async function createFactura(input: CreateFacturaInput): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para registrar facturas." }
  if (!input.numero_factura.trim()) return { error: "El número de factura es obligatorio." }
  if (!input.fecha_remision) return { error: "La fecha de remisión es obligatoria." }
  if (input.valor_cobrado <= 0) return { error: "El valor cobrado debe ser mayor a 0." }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_facturas" as never)
    .insert({
      interadministrativo_id: input.interadministrativo_id,
      numero_factura:  input.numero_factura.trim(),
      fecha_remision:  input.fecha_remision,
      fecha_ingreso:   input.fecha_ingreso || null,
      destino:         input.destino,
      valor_cobrado:   input.valor_cobrado,
      valor_ingresado: input.valor_ingresado ?? 0,
      descuentos:      input.descuentos      ?? 0,
      estado:          input.estado,
      user_id:         profile?.id    ?? null,
      user_email:      profile?.email ?? null,
    } as never)

  if (error) return { error: error.message }

  revalidatePath(`/proyectos/${input.interadministrativo_id}`)
  return { error: null }
}

export async function updateFactura(
  id: number,
  interadministrativoId: number,
  updates: Partial<CreateFacturaInput>,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canEditProjects(profile?.role)) return { error: "Sin permisos para editar facturas." }

  const supabase = await createSupabaseServerClient()

  const patch: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
  if ("numero_factura" in updates && updates.numero_factura) patch.numero_factura = updates.numero_factura.trim()
  if ("fecha_ingreso"  in updates && !updates.fecha_ingreso)  patch.fecha_ingreso  = null

  const { error } = await supabase
    .from("interadmin_facturas" as never)
    .update(patch as never)
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(`/proyectos/${interadministrativoId}`)
  return { error: null }
}

export async function deleteFactura(
  id: number,
  interadministrativoId: number,
): Promise<Res> {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!canDeleteProject(profile?.role)) return { error: "Sin permisos para eliminar facturas." }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("interadmin_facturas" as never)
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(`/proyectos/${interadministrativoId}`)
  return { error: null }
}
