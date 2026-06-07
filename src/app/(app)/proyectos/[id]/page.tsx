import { notFound } from "next/navigation"
import {
  getProjectById,
  getProjectContractTree,
  getProjectFollowups,
  getProjectAssignments,
  getProjectIndicators,
} from "@/services/projects.service"
import {
  getProjectFinancialSummary,
  getProjectPayments,
} from "@/services/project-financial.service"
import { getProjectDocuments } from "@/services/project-documents.service"
import { getProjectAlerts, getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { ProjectExpediente } from "@/modules/projects/components/project-expediente"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProyectoExpedientePage({ params }: PageProps) {
  const { id } = await params

  const project = await getProjectById(id)
  if (!project) notFound()

  const [
    contractTree,
    followups,
    assignments,
    documents,
    indicators,
    alerts,
    financial,
    payments,
    profile,
  ] = await Promise.all([
    getProjectContractTree(id),
    getProjectFollowups(id),
    getProjectAssignments(id),
    getProjectDocuments(id),
    getProjectIndicators(id),
    getProjectAlerts(id),
    getProjectFinancialSummary(id),
    getProjectPayments(id),
    getCurrentUserProfile(),
  ])

  return (
    <ProjectExpediente
      project={project}
      contractTree={contractTree}
      followups={followups}
      assignments={assignments}
      documents={documents}
      indicators={indicators}
      alerts={alerts}
      financial={financial}
      payments={payments}
      canEdit={canEditProjects(profile?.role)}
    />
  )
}
