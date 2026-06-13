import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Configúrelas en .env.local (local) o en el panel de despliegue (producción)."
    )
  }
  return { url, key }
}

export async function createSupabaseServerClient() {
  const { url, key } = requireSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore.
            // Middleware handles session refresh.
          }
        },
      },
    }
  )
}
