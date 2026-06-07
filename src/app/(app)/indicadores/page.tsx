import { getGlobalIndicators, getProjectFilterCatalogs } from "@/services/projects.service"
import { IndicatorsPageClient } from "@/modules/projects/components/indicators-page-client"

export default async function IndicadoresPage() {
  let indicators: Awaited<ReturnType<typeof getGlobalIndicators>> = []
  let years: number[] = []
  let loadError: string | null = null

  try {
    ;[indicators, { years }] = await Promise.all([
      getGlobalIndicators(),
      getProjectFilterCatalogs(),
    ])
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar indicadores"
  }

  if (loadError) {
    return (
      <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
        {loadError}
      </div>
    )
  }

  return <IndicatorsPageClient indicators={indicators} years={years} />
}
