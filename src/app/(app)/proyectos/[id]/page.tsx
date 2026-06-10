import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { InteradministrativoDetail } from "@/modules/projects/components/interadministrativo-detail"
import type { Interadministrativo, Contrato } from "@/types/database"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProyectoDetallePage({ params }: PageProps) {
  const { id } = await params

  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) notFound()

  const supabase = await createSupabaseServerClient()

  const [{ data: project, error: projError }, { data: contratos, error: contError }, profile] =
    await Promise.all([
      supabase
        .from("interadministrativos")
        .select("*")
        .eq("id", numericId)
        .maybeSingle(),
      supabase
        .from("contratos")
        .select("*")
        .eq("id_interadministrativo", id)
        .order("numero_contrato", { ascending: true })
        .limit(500),
      getCurrentUserProfile().catch(() => null),
    ])

  if (projError || !project) notFound()

  return (
    <div className="space-y-0">
      <div className="px-6 pt-5">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </Link>
      </div>

      <InteradministrativoDetail
        project={project as Interadministrativo}
        contratos={(contratos ?? []) as Contrato[]}
        canEdit={canEditProjects(profile?.role)}
        contratosError={contError?.message}
      />
    </div>
  )
}
