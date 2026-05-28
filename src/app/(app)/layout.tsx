import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/layout/AppLayout"

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const userEmail = user.email ?? ""

  return <AppLayout userEmail={userEmail}>{children}</AppLayout>
}
