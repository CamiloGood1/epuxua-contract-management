import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/layout/AppLayout"
import { getCurrentUserProfile } from "@/services/user.service"
import type { UserRole } from "@/types/project"

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
    user = data.user
  } catch (err) {
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
