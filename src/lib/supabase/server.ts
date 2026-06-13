import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function requireSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error(
      "[supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Configúrelas en .env.local o en el panel de despliegue."
    )
    return null
  }
  return { url, key }
}

export async function createSupabaseServerClient() {
  const env = requireSupabaseEnv()
  if (!env) {
    throw new Error("Supabase no está configurado. Revise las variables de entorno.")
  }
  const { url, key } = env
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
          // Server Component: el proxy refresca la sesión.
        }
      },
    },
  })
}
