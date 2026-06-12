// Fuentes de Financiación — grupos (bolsa original + adiciones) y fuentes detalladas

export type FundingGroupType = "ORIGINAL" | "ADICION"

export interface FundingGroup {
  id: number
  interadministrativo_id: number
  group_type: FundingGroupType
  group_name: string
  related_modification_id: number | null
  total_value: number
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface FundingSource {
  id: number
  funding_group_id: number
  interadministrativo_id: number
  source_name: string
  source_value: number
  participation_percentage: number
  observations: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface FundingGroupSummary {
  funding_group_id: number
  interadministrativo_id: number
  group_type: FundingGroupType
  group_name: string
  related_modification_id: number | null
  total_value: number
  total_aportado: number
  diferencia: number
  num_fuentes: number
  es_consistente: boolean
}

export interface FundingConsolidated {
  interadministrativo_id: number
  source_name: string
  total_aportado: number
  participacion_consolidada_pct: number
}

export interface FundingKPIs {
  totalGrupos: number
  totalFuentes: number
  valorFinanciadoTotal: number
  fuentesDistintas: number
  valorBolsaOriginal: number
  valorAdiciones: number
  principalFinanciador: string | null
  participacionPrincipal: number
  valorPrincipal: number
}

export interface FundingData {
  groups: FundingGroup[]
  sources: FundingSource[]
  consolidated: FundingConsolidated[]
}

export const EMPTY_FUNDING: FundingData = {
  groups: [],
  sources: [],
  consolidated: [],
}

const TOLERANCE = 0.01

export function calcParticipationPct(sourceValue: number, groupTotal: number): number {
  if (groupTotal <= 0) return 0
  return Math.round((sourceValue / groupTotal) * 10000) / 100
}

export function sumSourceValues(sources: FundingSource[], groupId: number): number {
  return sources
    .filter((s) => s.funding_group_id === groupId)
    .reduce((acc, s) => acc + s.source_value, 0)
}

export function isGroupConsistent(
  group: FundingGroup,
  sources: FundingSource[],
): { consistent: boolean; totalAportado: number; diferencia: number } {
  const totalAportado = sumSourceValues(sources, group.id)
  const diferencia = totalAportado - group.total_value
  return {
    consistent: Math.abs(diferencia) < TOLERANCE,
    totalAportado,
    diferencia,
  }
}

export function getSourcesForGroup(sources: FundingSource[], groupId: number): FundingSource[] {
  return sources.filter((s) => s.funding_group_id === groupId)
}

export function calcFundingKPIs(data: FundingData): FundingKPIs {
  const { groups, sources, consolidated } = data

  const valorBolsaOriginal = sources
    .filter((s) => {
      const g = groups.find((gr) => gr.id === s.funding_group_id)
      return g?.group_type === "ORIGINAL"
    })
    .reduce((acc, s) => acc + s.source_value, 0)

  const valorAdiciones = sources
    .filter((s) => {
      const g = groups.find((gr) => gr.id === s.funding_group_id)
      return g?.group_type === "ADICION"
    })
    .reduce((acc, s) => acc + s.source_value, 0)

  const valorFinanciadoTotal = sources.reduce((acc, s) => acc + s.source_value, 0)
  const fuentesDistintas = new Set(sources.map((s) => s.source_name.trim().toLowerCase())).size

  const principal = consolidated.length > 0
    ? [...consolidated].sort((a, b) => b.total_aportado - a.total_aportado)[0]
    : null

  return {
    totalGrupos: groups.length,
    totalFuentes: sources.length,
    valorFinanciadoTotal,
    fuentesDistintas,
    valorBolsaOriginal,
    valorAdiciones,
    principalFinanciador: principal?.source_name ?? null,
    participacionPrincipal: principal?.participacion_consolidada_pct ?? 0,
    valorPrincipal: principal?.total_aportado ?? 0,
  }
}

export function calcConsolidatedFromSources(
  interadminId: number,
  sources: FundingSource[],
): FundingConsolidated[] {
  const map = new Map<string, number>()
  for (const s of sources) {
    const key = s.source_name.trim()
    map.set(key, (map.get(key) ?? 0) + s.source_value)
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0)
  return [...map.entries()]
    .map(([source_name, total_aportado]) => ({
      interadministrativo_id: interadminId,
      source_name,
      total_aportado,
      participacion_consolidada_pct: total > 0
        ? Math.round((total_aportado / total) * 10000) / 100
        : 0,
    }))
    .sort((a, b) => b.total_aportado - a.total_aportado)
}

export function hasFundingInconsistencies(data: FundingData): boolean {
  return data.groups.some((g) => !isGroupConsistent(g, data.sources).consistent)
}

export const CHART_COLORS = [
  "#0B3D91", "#D9A520", "#10B981", "#F59E0B", "#8B5CF6",
  "#EF4444", "#06B6D4", "#EC4899", "#84CC16", "#6366F1",
]
