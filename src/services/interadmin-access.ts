import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  canAccessInteradmin,
  canEditFinancialTabs,
  canReadAllInteradmins,
  canViewAllInteradmins,
  canWriteInteradmin,
} from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import type { UserRole } from "@/types/project"

export interface AccessContext {
  role: UserRole
  userId: string
  assignedIds: Set<number>
}

async function loadAccessContext(): Promise<AccessContext | null> {
  const profile = await getCurrentUserProfile()
  if (!profile?.role) return null

  if (canReadAllInteradmins(profile.role)) {
    return { role: profile.role, userId: profile.id, assignedIds: new Set() }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("interadmin_assignments" as never)
    .select("interadministrativo_id")
    .eq("user_id", profile.id)
    .eq("active", true)

  if (error) {
    console.warn("[interadmin-access] assignments:", error.message)
    return { role: profile.role, userId: profile.id, assignedIds: new Set<number>() }
  }

  const assignedIds = new Set(
    ((data ?? []) as { interadministrativo_id: number }[]).map((r) => r.interadministrativo_id)
  )

  return { role: profile.role, userId: profile.id, assignedIds }
}

/** null = sin filtro (ve todos); [] = ninguno asignado */
export async function getAssignedInteradminIdsForCurrentUser(): Promise<number[] | null> {
  const profile = await getCurrentUserProfile()
  if (!profile?.role) return []

  if (canReadAllInteradmins(profile.role)) return null

  const ctx = await loadAccessContext()
  if (!ctx) return []
  return [...ctx.assignedIds]
}

export async function canCurrentUserAccessInteradmin(interadminId: number): Promise<boolean> {
  const ctx = await loadAccessContext()
  if (!ctx) return false
  return canAccessInteradmin(ctx.role, interadminId, ctx.assignedIds)
}

export async function assertInteradminWriteAccess(
  interadminId: number
): Promise<{ error: string | null }> {
  const ctx = await loadAccessContext()
  if (!ctx) return { error: "Sin permisos para editar." }
  if (!canWriteInteradmin(ctx.role, interadminId, ctx.assignedIds)) {
    return { error: "No tiene acceso para editar este contrato interadministrativo." }
  }
  return { error: null }
}

export async function getAccessContextForCurrentUser(): Promise<AccessContext | null> {
  return loadAccessContext()
}

/**
 * Verifica acceso de escritura exclusivamente para pestañas financieras
 * (Fuentes de Financiación y Rendimientos Financieros).
 * Roles permitidos: ADMIN, GERENTE, SUBADMINISTRATIVA.
 */
export async function assertFinancialWriteAccess(
  _interadminId: number
): Promise<{ error: string | null }> {
  const ctx = await loadAccessContext()
  if (!ctx) return { error: "Sin permisos para editar datos financieros." }
  if (!canEditFinancialTabs(ctx.role)) {
    return {
      error:
        "Sin permisos para editar información financiera. Esta sección es exclusiva de ADMIN y SUBADMINISTRATIVA.",
    }
  }
  return { error: null }
}

export function shouldFilterProjectsByAssignment(role: UserRole | null | undefined): boolean {
  if (!role) return true
  return !canViewAllInteradmins(role) && !canReadAllInteradmins(role)
}

/**
 * Verifica acceso de escritura sobre un contrato derivado.
 * ADMIN y GERENTE: acceso total.
 * GERENTE_PROYECTO: solo si el interadministrativo padre está en sus asignaciones.
 */
export async function assertContratoWriteAccess(
  contratoId: number
): Promise<{ error: string | null }> {
  const ctx = await loadAccessContext()
  if (!ctx) return { error: "Sin permisos para editar." }

  if (ctx.role === "ADMIN" || ctx.role === "GERENTE") return { error: null }

  if (ctx.role === "GERENTE_PROYECTO") {
    const supabase = await createSupabaseServerClient()

    const { data: contrato } = await supabase
      .from("contratos")
      .select("id_interadministrativo")
      .eq("id", contratoId)
      .maybeSingle()

    if (!contrato?.id_interadministrativo) {
      return { error: "Contrato no encontrado o sin contrato padre." }
    }

    const { data: parent } = await supabase
      .from("interadministrativos")
      .select("id")
      .eq("id_contrato", contrato.id_interadministrativo)
      .maybeSingle()

    if (!parent) return { error: "Contrato interadministrativo padre no encontrado." }
    if (ctx.assignedIds.has(parent.id)) return { error: null }

    return { error: "No tiene acceso para editar este contrato derivado." }
  }

  return { error: "Su rol no tiene permisos de escritura en contratos derivados." }
}
