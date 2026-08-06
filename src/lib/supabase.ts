/**
 * @deprecated Este archivo crea un cliente Supabase estático sin cookies de sesión.
 * Usarlo en el servidor bypasea las RLS Policies porque las queries se ejecutan
 * sin el contexto de autenticación del usuario.
 *
 * Usa en su lugar:
 *  - Server Components / Server Actions → import { createSupabaseServerClient } from "@/lib/supabase/server"
 *  - Browser (acciones sin sesión)      → import { createBrowserClient } from "@supabase/ssr"
 *
 * Este archivo puede eliminarse de forma segura: ningún módulo lo importa actualmente.
 */
throw new Error(
  "[supabase.ts] Este cliente legacy fue deshabilitado. " +
  "Usa createSupabaseServerClient() en el servidor o createBrowserClient() en el cliente. " +
  "Ver src/lib/supabase/server.ts"
)

export const supabase = null as never
