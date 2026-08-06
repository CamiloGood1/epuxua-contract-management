"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

/** Registra una entrada en interadmin_audit_log sin bloquear la operación principal. */
export async function logAuditEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: Record<string, unknown>,
): Promise<void> {
  supabase
    .from("interadmin_audit_log" as never)
    .insert(payload as never)
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) {
        console.error("[audit] Error al registrar evento de auditoría:", error.message, JSON.stringify(payload))
      }
    })
}
