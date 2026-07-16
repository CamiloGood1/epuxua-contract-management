import Link from "next/link"
import { PageShell } from "@/components/ui/page-shell"
import {
  getProjects,
  getProjectFilterCatalogs,
  enrichProjectsWithManagers,
} from "@/services/projects.service"
import { InteradministrativosPageClient } from "@/modules/projects/components/interadministrativos-page-client"
import { getCurrentUserProfile } from "@/services/user.service"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { buildAllCurrentStates } from "@/modules/projects/lib/build-current-state"
import type { ContractCurrentState } from "@/types/contract-current-state"
import type { UserRole } from "@/types/project"
import type { AdicionLite, ProrrogaLite } from "@/modules/projects/lib/build-current-state"

export default async function ProyectosPage() {
  const profile  = await getCurrentUserProfile().catch(() => null)
  const userRole = (profile?.role ?? null) as UserRole | null

  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let catalogs = {
    entities: [] as string[],
    secretarias: [] as string[],
    areas: [] as string[],
    years: [] as number[],
  }
  let currentStates: Record<number, ContractCurrentState> = {}
  let loadError: string | null = null

  try {
    const [raw, catalogsResult] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
    ])
    projects = await enrichProjectsWithManagers(raw)
    catalogs = catalogsResult

    if (projects.length > 0) {
      const ids     = projects.map((p) => p.id)
      const supabase = await createSupabaseServerClient()

      // 4 queries paralelas — seleccionamos campos reales, no solo IDs
      const [adRes, prRes, suRes, reRes] = await Promise.all([
        supabase
          .from("interadmin_adiciones")
          .select("interadministrativo_id, valor_total, valor_bienes_servicios, valor_cuota_gerencia")
          .in("interadministrativo_id", ids)
          .limit(20000),
        supabase
          .from("interadmin_prorrogas")
          .select("interadministrativo_id, numero_prorroga, nueva_fecha_terminacion")
          .in("interadministrativo_id", ids)
          .limit(20000),
        supabase
          .from("interadmin_suspensiones")
          .select("interadministrativo_id")
          .in("interadministrativo_id", ids)
          .limit(20000),
        supabase
          .from("interadmin_reinicios")
          .select("interadministrativo_id")
          .in("interadministrativo_id", ids)
          .limit(20000),
      ])

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      currentStates = buildAllCurrentStates(
        projects,
        (adRes.data ?? []) as AdicionLite[],
        (prRes.data ?? []) as ProrrogaLite[],
        suRes.data ?? [],
        reRes.data ?? [],
        today
      )
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar contratos"
  }

  return (
    <PageShell
      title="Contratos Interadministrativos"
      subtitle="Cartera de contratos interadministrativos EPUXUA."
      icon="folder_special"
      actions={
        <Link
          href="/proyectos/kanban"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90"
        >
          Ver Kanban
        </Link>
      }
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          No se pudieron cargar los contratos: {loadError}
        </div>
      )}
      <InteradministrativosPageClient
        projects={projects}
        entities={catalogs.entities}
        years={catalogs.years}
        userRole={userRole}
        currentStates={currentStates}
      />
    </PageShell>
  )
}
