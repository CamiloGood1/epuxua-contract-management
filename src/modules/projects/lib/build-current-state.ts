/**
 * buildCurrentState — construye el estado contractual consolidado.
 *
 * Fuente única de lógica para valores operativos vigentes.
 * Reutilizable en: listado, kanban, calendario, dashboard, alertas, reportes.
 */

import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"
import type { ContractCurrentState, ContractHealth } from "@/types/contract-current-state"
import { calcInteradminFinancials } from "./interadmin-financials"

// ── Input shapes (subset de los tipos completos, optimizado para batch queries) ─

export interface AdicionLite {
  interadministrativo_id: number
  valor_total:              number | null
  valor_bienes_servicios:   number | null
  valor_cuota_gerencia:     number | null
}

export interface ProrrogaLite {
  interadministrativo_id:  number
  numero_prorroga:          number
  nueva_fecha_terminacion:  string
}

// ── Health logic ──────────────────────────────────────────────────────────────

const TERMINAL_ESTADOS = new Set<EstadoInteradministrativo>([
  "TERMINADO",
  "LIQUIDADO",
  "TERMINADO ANTICIPADAMENTE",
])

export function computeContractHealth(
  estado:       EstadoInteradministrativo,
  daysRemaining: number | null,
  avancePct:    number
): ContractHealth {
  if (TERMINAL_ESTADOS.has(estado)) return "VERDE"
  if (estado === "SUSPENDIDO")      return "AMARILLO"
  if (estado === "PLANEACIÓN" || estado === "CONTRATACIÓN") return "VERDE"

  if (daysRemaining === null) return "VERDE"
  if (daysRemaining < 0)      return "ROJO"
  if (daysRemaining < 15)     return "ROJO"
  if (daysRemaining < 30)     return "AMARILLO"
  if (daysRemaining < 60 && avancePct < 40) return "AMARILLO"
  return "VERDE"
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildCurrentState(
  contract:         Interadministrativo,
  adiciones:        AdicionLite[],
  prorrogas:        ProrrogaLite[],
  suspensionsCount: number,
  restartsCount:    number,
  today:            Date
): ContractCurrentState {
  // Financiero: usa filas reales de adiciones (nunca el campo legacy `adicion`)
  const fin = calcInteradminFinancials({
    valor_inicial:       contract.valor_inicial,
    cuota_admin_inicial: contract.cuota_admin_inicial,
    total_contrato:      contract.total_contrato,
    adiciones,
  })

  // Fecha vigente: última prórroga (mayor numero_prorroga) o fecha original
  const sortedProrrogas = [...prorrogas].sort((a, b) => b.numero_prorroga - a.numero_prorroga)
  const lastProrroga    = sortedProrrogas[0] ?? null
  const currentEndDate  = lastProrroga?.nueva_fecha_terminacion ?? contract.fecha_terminacion ?? null

  // Días restantes sobre fecha vigente
  let daysRemaining: number | null = null
  if (currentEndDate) {
    const end = new Date(currentEndDate.slice(0, 10) + "T00:00:00")
    daysRemaining = Math.floor((end.getTime() - today.getTime()) / 86400000)
  }

  const health = computeContractHealth(
    contract.estado,
    daysRemaining,
    contract.avance_fisico_pct ?? 0
  )

  return {
    contractId:       contract.id,
    originalValue:    fin.valorOriginal,
    additions:        fin.totalAdiciones,
    currentValue:     fin.valorTotalActual,
    originalEndDate:  contract.fecha_terminacion ?? null,
    currentEndDate,
    additionsCount:   adiciones.length,
    extensionsCount:  prorrogas.length,
    suspensionsCount,
    restartsCount,
    daysRemaining,
    health,
  }
}

// ── Batch builder ─────────────────────────────────────────────────────────────

/** Agrupa arrays de modificaciones por interadministrativo_id en un Map. */
export function groupByContract<T extends { interadministrativo_id: number }>(
  arr: T[]
): Map<number, T[]> {
  const m = new Map<number, T[]>()
  for (const item of arr) {
    const list = m.get(item.interadministrativo_id) ?? []
    list.push(item)
    m.set(item.interadministrativo_id, list)
  }
  return m
}

/** Cuenta elementos por interadministrativo_id. */
export function countByContract(
  arr: { interadministrativo_id: number }[]
): Map<number, number> {
  const m = new Map<number, number>()
  for (const item of arr) {
    m.set(item.interadministrativo_id, (m.get(item.interadministrativo_id) ?? 0) + 1)
  }
  return m
}

/** Construye el mapa id → ContractCurrentState para todos los contratos. */
export function buildAllCurrentStates(
  contracts:  Interadministrativo[],
  adiciones:  AdicionLite[],
  prorrogas:  ProrrogaLite[],
  suspensiones: { interadministrativo_id: number }[],
  reinicios:  { interadministrativo_id: number }[],
  today:      Date
): Record<number, ContractCurrentState> {
  const adMap   = groupByContract(adiciones)
  const prMap   = groupByContract(prorrogas)
  const suspMap = countByContract(suspensiones)
  const reMap   = countByContract(reinicios)

  const result: Record<number, ContractCurrentState> = {}
  for (const c of contracts) {
    result[c.id] = buildCurrentState(
      c,
      adMap.get(c.id)  ?? [],
      prMap.get(c.id)  ?? [],
      suspMap.get(c.id) ?? 0,
      reMap.get(c.id)  ?? 0,
      today
    )
  }
  return result
}
