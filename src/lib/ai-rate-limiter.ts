import { createSupabaseServerClient } from "@/lib/supabase/server"

/** Máximo de análisis de IA por usuario por hora. */
const MAX_REQUESTS_PER_HOUR = 20

export interface RateLimitResult {
  allowed: boolean
  /** Mensaje de error para devolver al cliente si no está permitido. */
  error?: string
}

/**
 * Verifica si el usuario puede hacer un análisis de IA.
 * Si está permitido, registra el uso en la tabla interadmin_ai_usage_log.
 * Requiere que MIGRATION_AI_USAGE_LOG.sql haya sido ejecutado.
 */
export async function checkAndLogAiUsage(
  userId: string,
  userEmail: string | null | undefined,
  endpoint: string,
  fileName?: string,
): Promise<RateLimitResult> {
  const supabase = await createSupabaseServerClient()

  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()

  const { count, error: countError } = await supabase
    .from("interadmin_ai_usage_log" as never)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("created_at", oneHourAgo)

  if (countError) {
    // Si no existe la tabla (migración pendiente), permitir sin bloquear.
    if (countError.code === "42P01") return { allowed: true }
    console.warn("[ai-rate-limiter] Error consultando uso:", countError.message)
    return { allowed: true }
  }

  if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de ${MAX_REQUESTS_PER_HOUR} análisis por hora. Intenta de nuevo más tarde.`,
    }
  }

  // Registrar uso (fire-and-forget — no bloquear si falla)
  supabase
    .from("interadmin_ai_usage_log" as never)
    .insert({
      user_id: userId,
      user_email: userEmail ?? null,
      endpoint,
      file_name: fileName ?? null,
    } as never)
    .then(() => {})

  return { allowed: true }
}
