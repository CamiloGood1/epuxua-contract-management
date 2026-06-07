import { notFound } from "next/navigation"
import { getProjectExpedienteData } from "@/services/project-expediente.service"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { ProjectExpediente } from "@/modules/projects/components/project-expediente"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProyectoExpedientePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  const [data, profile] = await Promise.all([
    getProjectExpedienteData(id),
    getCurrentUserProfile(),
  ])

  if (!data) notFound()

  return (
    <ProjectExpediente
      data={data}
      initialTab={tab}
      canEdit={canEditProjects(profile?.role)}
    />
  )
}
