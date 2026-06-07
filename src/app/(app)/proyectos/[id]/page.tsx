import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getProjectExpedienteData } from "@/services/project-expediente.service"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { ProjectExpediente } from "@/modules/projects/components/project-expediente"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

function ExpedienteLoadError({ message }: { message: string }) {
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="text-lg font-semibold">No se pudo cargar el expediente</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={14} />
        Volver a proyectos
      </Link>
    </div>
  )
}

export default async function ProyectoExpedientePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  try {
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
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Ocurrió un error inesperado al cargar el proyecto."
    return <ExpedienteLoadError message={message} />
  }
}
