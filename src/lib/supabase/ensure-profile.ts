import type { SupabaseClient } from "@supabase/supabase-js"

/** Crea o actualiza user_profiles con id = auth.uid() (nunca un UUID introducido por el usuario). */
export async function ensureUserProfile(supabase: SupabaseClient) {
  const { error } = await supabase.rpc("ensure_user_profile")
  if (error) {
    console.warn("[ensure_user_profile]", error.message)
  }
}
