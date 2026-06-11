import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import {
  getFuncionamientoDashboardKPIs,
  getInteradminDashboardKPIs,
  getDashboardAlerts,
  type FuncionamientoDashboardKPIs,
  type InteradminDashboardKPIs,
  type DashboardAlerts,
} from "@/services/dashboard.service"
import { getCurrentUserProfile } from "@/services/user.service"
import { canCreateProject } from "@/modules/projects/lib/access"
import { ProjectDashboardView } from "@/modules/projects/components/project-dashboard-view"
import type { FuncionamientoContrato } from "@/services/funcionamiento.service"

const EMPTY_FUNC_KPIS: FuncionamientoDashboardKPIs = {
  totalContracts: 0, activeContracts: 0, suspendedContracts: 0,
  finishedContracts: 0, liquidatedContracts: 0, totalValue: 0,
  totalPaidValue: 0, avgValue: 0, soonExpiring: 0, expired: 0,
}

const EMPTY_INTERADMIN_KPIS: InteradminDashboardKPIs = {
  totalContracts: 0, activeContracts: 0, terminatedContracts: 0,
  liquidatedContracts: 0, totalValue: 0, activeValue: 0, pendingValue: 0,
  totalCuotaAdmin: 0, activeCuotaAdmin: 0,
  totalDerivedContracts: 0, activeDerivedContracts: 0,
}
const EMPTY_ALERTS: DashboardAlerts = { expiringSoon: [], expired: [] }

export default async function Page() {
  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let entities: string[] = []
  let topFuncContracts: FuncionamientoContrato[] = []
  let funcKPIs: FuncionamientoDashboardKPIs = EMPTY_FUNC_KPIS
  let interadminKPIs: InteradminDashboardKPIs = EMPTY_INTERADMIN_KPIS
  let alerts: DashboardAlerts = EMPTY_ALERTS
  let fetchError: string | undefined
  let canCreate = false
  let isAdmin   = false

  try {
    const [raw, catalogs, funcContracts, funcKPIsRaw, interadminKPIsRaw, alertsRaw, profile] =
      await Promise.all([
        getProjects(),
        getProjectFilterCatalogs(),
        getFuncionamientoContracts(),
        getFuncionamientoDashboardKPIs(),
        getInteradminDashboardKPIs(),
        getDashboardAlerts(),
        getCurrentUserProfile().catch(() => null),
      ])

    funcKPIs       = funcKPIsRaw
    interadminKPIs = interadminKPIsRaw
    alerts         = alertsRaw
    canCreate      = canCreateProject(profile?.role)
    isAdmin        = profile?.role === "ADMIN"
    topFuncContracts = funcContracts.slice(0, 5)
    projects = await enrichProjectsWithManagers(raw)
    entities = catalogs.entities
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Error desconocido"
  }

  return (
    <ProjectDashboardView
      projects={projects}
      entities={entities}
      fetchError={fetchError}
      funcionamientoKPIs={funcKPIs}
      interadminKPIs={interadminKPIs}
      topActiveFuncContracts={topFuncContracts}
      alerts={alerts}
      canCreate={canCreate}
      isAdmin={isAdmin}
    />
  )
}
