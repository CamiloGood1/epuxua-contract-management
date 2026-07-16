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
import type { UserRole } from "@/types/project"

export type ModCounts = Record<number, {
  adiciones:   number
  prorrogas:   number
  suspensiones: number
  reinicios:   number
}>

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
  let modCounts: ModCounts = {}
  let loadError: string | null = null

  try {
    const [raw, catalogsResult] = await Promise.all([
      getProjects(),
      getProjectFilterCatalogs(),
    ])
    projects = await enrichProjectsWithManagers(raw)
    catalogs = catalogsResult

    // Batch-fetch modification counts — 4 queries, zero N+1
    if (projects.length > 0) {
      const ids = projects.map((p) => p.id)
      const supabase = await createSupabaseServerClient()
      const [adRes, prRes, suRes, reRes] = await Promise.all([
        supabase.from("interadmin_adiciones")   .select("interadministrativo_id").in("interadministrativo_id", ids).limit(20000),
        supabase.from("interadmin_prorrogas")    .select("interadministrativo_id").in("interadministrativo_id", ids).limit(20000),
        supabase.from("interadmin_suspensiones") .select("interadministrativo_id").in("interadministrativo_id", ids).limit(20000),
        supabase.from("interadmin_reinicios")    .select("interadministrativo_id").in("interadministrativo_id", ids).limit(20000),
      ])

      for (const id of ids) modCounts[id] = { adiciones: 0, prorrogas: 0, suspensiones: 0, reinicios: 0 }
      for (const r of (adRes.data ?? [])) if (modCounts[r.interadministrativo_id]) modCounts[r.interadministrativo_id].adiciones++
      for (const r of (prRes.data ?? [])) if (modCounts[r.interadministrativo_id]) modCounts[r.interadministrativo_id].prorrogas++
      for (const r of (suRes.data ?? [])) if (modCounts[r.interadministrativo_id]) modCounts[r.interadministrativo_id].suspensiones++
      for (const r of (reRes.data ?? [])) if (modCounts[r.interadministrativo_id]) modCounts[r.interadministrativo_id].reinicios++
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
        modCounts={modCounts}
      />
    </PageShell>
  )
}
