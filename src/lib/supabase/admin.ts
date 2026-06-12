import { createClient } from "@supabase/supabase-js"

/** Cliente con service role — SOLO en servidor (inviteUserByEmail, etc.). */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const missing: string[] = []
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables en .env.local (solo servidor): ${missing.join(", ")}. ` +
        "SUPABASE_SERVICE_ROLE_KEY está en Supabase → Settings → API → service_role (secreta). " +
        "Reinicie npm run dev después de guardar."
    )
  }

  return createClient(url!, serviceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
