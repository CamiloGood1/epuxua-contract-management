import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { canViewProposals } from "@/modules/proposals/lib/access"
import { ProposalsPageClient } from "@/modules/proposals/components/proposals-page-client"
import { redirect } from "next/navigation"
import type { ProposalRequest } from "@/types/proposals"

export default async function PropuestasPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!canViewProposals(profile?.role)) {
    redirect("/")
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("proposal_requests" as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000)

  if (error) {
    console.error("[propuestas] query:", error.message)
  }

  const proposals = (data ?? []) as ProposalRequest[]

  return (
    <ProposalsPageClient
      initialProposals={proposals}
      userRole={profile?.role ?? null}
    />
  )
}
