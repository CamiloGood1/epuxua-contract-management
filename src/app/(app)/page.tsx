import {
  getProjectsForDashboard,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { getFuncionamientoContracts } from "@/services/funcionamiento.service"
import {
  getFuncionamientoDashboardKPIs,
  getInteradminDashboardKPIs,
  getDashboardAlerts,
  getFacturacionDashboardKPIs,
  type FuncionamientoDashboardKPIs,
  type InteradminDashboardKPIs,
  type DashboardAlerts,
  type FacturacionDashboardKPIs,
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
const EMPTY_FACTURACION_KPIS: FacturacionDashboardKPIs = {
  facturadoTotal: 0, ingresadoTotal: 0, pendienteTotal: 0, facturadoBienes: 0, facturadoCuota: 0,
}

export default async function Page() {
  let projects: Awaited<ReturnType<typeof getProjectsForDashboard>> = []
  let entities: string[] = []
  let topFuncContracts: FuncionamientoContrato[] = []
  let funcKPIs: FuncionamientoDashboardKPIs = EMPTY_FUNC_KPIS
  let interadminKPIs: InteradminDashboardKPIs = EMPTY_INTERADMIN_KPIS
  let facturacionKPIs: FacturacionDashboardKPIs = EMPTY_FACTURACION_KPIS
  let alerts: DashboardAlerts = EMPTY_ALERTS
  let fetchError: string | undefined
  let canCreate = false
  let isAdmin   = false

  try {
    const [raw, catalogs, funcContracts, funcKPIsRaw, interadminKPIsRaw, alertsRaw, facturacionRaw, profile] =
      await Promise.all([
        getProjectsForDashboard(),
        getProjectFilterCatalogs(),
        getFuncionamientoContracts(),
        getFuncionamientoDashboardKPIs(),
        getInteradminDashboardKPIs(),
        getDashboardAlerts(),
        getFacturacionDashboardKPIs().catch(() => EMPTY_FACTURACION_KPIS),
        getCurrentUserProfile().catch(() => null),
      ])

    funcKPIs        = funcKPIsRaw
    interadminKPIs  = interadminKPIsRaw
    facturacionKPIs = facturacionRaw
    alerts          = alertsRaw
    canCreate       = canCreateProject(profile?.role)
    isAdmin         = profile?.role === "ADMIN"
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
      facturacionKPIs={facturacionKPIs}
      topActiveFuncContracts={topFuncContracts}
      alerts={alerts}
      canCreate={canCreate}
      isAdmin={isAdmin}
    />
  )
}
