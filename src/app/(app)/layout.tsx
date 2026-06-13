import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/layout/AppLayout"
import { getCurrentUserProfile } from "@/services/user.service"
import type { UserRole } from "@/types/project"

export const dynamic = "force-dynamic"

function isNextNavigationError(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err)) return false
  const digest = String((err as { digest?: string }).digest)
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
}

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) console.warn("[layout] getUser:", error.message)
    user = data?.user ?? null
  } catch (err) {
    if (isNextNavigationError(err)) throw err
    console.warn("[layout] auth failed:", err instanceof Error ? err.message : err)
  }

  if (!user) redirect("/login")

  const profile = await getCurrentUserProfile().catch(() => null)
  const userEmail = user.email ?? ""
  const userRole = (profile?.role ?? "ESPECTADOR") as UserRole
  const userName = profile?.full_name ?? userEmail.split("@")[0] ?? "Usuario"

  return (
    <AppLayout userEmail={userEmail} userRole={userRole} userName={userName}>
      {children}
    </AppLayout>
  )
}
