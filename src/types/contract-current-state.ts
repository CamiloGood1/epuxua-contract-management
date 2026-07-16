/**
 * Estado contractual consolidado — fuente única de verdad para valores operativos.
 *
 * Separa explícitamente el dato histórico (original) del dato operativo (vigente).
 * Construido server-side mediante `buildCurrentState()` y reutilizable en:
 * listado, kanban, calendario, dashboard, alertas, reportes.
 */

export type ContractHealth = "VERDE" | "AMARILLO" | "ROJO"

export interface ContractCurrentState {
  contractId: number

  // ── Financiero ──────────────────────────────────────────────────────────────
  /** valor_inicial + cuota_admin_inicial — dato histórico inmutable. */
  originalValue: number
  /** Suma real de todas las filas en interadmin_adiciones.valor_total. */
  additions: number
  /** originalValue + additions — dato operativo vigente. */
  currentValue: number

  // ── Fechas ──────────────────────────────────────────────────────────────────
  /** fecha_terminacion almacenada en interadministrativos — dato histórico. */
  originalEndDate: string | null
  /**
   * Fecha de terminación vigente:
   * = nueva_fecha_terminacion de la última prórroga (mayor numero_prorroga)
   * = originalEndDate si no hay prórrogas registradas.
   */
  currentEndDate: string | null

  // ── Contadores de modificaciones ───────────────────────────────────────────
  additionsCount:   number   // filas en interadmin_adiciones
  extensionsCount:  number   // filas en interadmin_prorrogas
  suspensionsCount: number   // filas en interadmin_suspensiones
  restartsCount:    number   // filas en interadmin_reinicios

  // ── Operativos derivados ───────────────────────────────────────────────────
  /**
   * Días hasta vencimiento calculados sobre currentEndDate.
   * Positivo = días restantes. Negativo = días desde vencimiento. null = sin fecha.
   */
  daysRemaining: number | null
  /** Semáforo calculado sobre fecha vigente + avance físico + estado. */
  health: ContractHealth
}
