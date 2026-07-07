// Centro de Integridad de Datos — Módulo: Consistencia Financiera
// 13 reglas de validación financiera para contratos interadministrativos.
// Funciones puras: reciben datos, retornan hallazgos (sin llamadas a BD).

import type { Interadministrativo } from "@/types/database"
import type { Adicion, Prorroga } from "@/types/modificaciones"
import type { PaymentMilestone } from "@/types/forma-pago"
import type { AuditFinding, ContractAuditResult, AuditStatus } from "./types"
import { calcInteradminFinancials } from "@/modules/projects/lib/interadmin-financials"
import { calcFormaPagoSummary } from "@/types/forma-pago"

export interface FinancialAuditInput {
  contract: Interadministrativo
  adiciones: Adicion[]
  prorrogas: Prorroga[]
  hitos: PaymentMilestone[]
}

// ── Formatters ────────────────────────────────────────────────────────────────

function cop(n: number): string {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
}

function pct(n: number): string {
  return n.toFixed(2) + "%"
}

function approxEqual(a: number, b: number, tolerance = 1): boolean {
  return Math.abs(a - b) <= tolerance
}

// ── SQL fix generators ────────────────────────────────────────────────────────

function sqlUpdate(id: number, fields: Record<string, string>): string {
  const sets = Object.entries(fields)
    .map(([k, v]) => `  ${k} = ${v}`)
    .join(",\n")
  return `UPDATE interadministrativos\nSET\n${sets},\n  updated_at = NOW()\nWHERE id = ${id};`
}

// ── 13 Reglas de validación ───────────────────────────────────────────────────

/**
 * R01 — Valor Original coherente
 * valor_inicial + cuota_admin_inicial ≈ total_contrato
 */
function r01TotalCoherente(c: Interadministrativo): AuditFinding | null {
  const bienes = Number(c.valor_inicial ?? 0)
  const cuota  = Number(c.cuota_admin_inicial ?? 0)
  const total  = Number(c.total_contrato ?? 0)
  if (bienes === 0 || cuota === 0 || total === 0) return null
  const calculated = bienes + cuota
  if (approxEqual(calculated, total)) return null
  return {
    ruleId: "R01_TOTAL_COHERENTE",
    ruleName: "Valor Original coherente",
    severity: "error",
    module: "Info General / Resumen Financiero",
    field: "total_contrato",
    message: "La suma de Bienes y Cuota de Gerencia no coincide con el Valor Total del contrato.",
    expected: cop(calculated),
    found: cop(total),
    sqlFix: sqlUpdate(c.id, { total_contrato: String(calculated) }),
  }
}

/**
 * R02 — Cuota no excede valor total
 * cuota_admin_inicial ≤ total_contrato
 */
function r02CuotaNoExcede(c: Interadministrativo): AuditFinding | null {
  const cuota = Number(c.cuota_admin_inicial ?? 0)
  const total = Number(c.total_contrato ?? 0)
  if (cuota === 0 || total === 0) return null
  if (cuota <= total) return null
  return {
    ruleId: "R02_CUOTA_NO_EXCEDE",
    ruleName: "Cuota no excede valor total",
    severity: "error",
    module: "Info General",
    field: "cuota_admin_inicial",
    message: "La Cuota de Gerencia es mayor al Valor Total del contrato.",
    expected: `≤ ${cop(total)}`,
    found: cop(cuota),
    sqlFix: `-- Revisar manualmente: cuota_admin_inicial > total_contrato para id=${c.id}`,
  }
}

/**
 * R03 — total_cuota_admin sincronizado con cuota_admin_inicial
 * Detecta el desincronismo conocido del campo legacy.
 */
function r03CuotaAdminSync(c: Interadministrativo): AuditFinding | null {
  const canonical = Number(c.cuota_admin_inicial ?? 0)
  const legacy    = Number(c.total_cuota_admin    ?? 0)
  if (approxEqual(canonical, legacy)) return null
  return {
    ruleId: "R03_CUOTA_ADMIN_SYNC",
    ruleName: "Cuota Admin sincronizada",
    severity: "warning",
    module: "Forma de Pago",
    field: "total_cuota_admin",
    message: "El campo total_cuota_admin no coincide con cuota_admin_inicial. Puede causar visualización invertida en Forma de Pago.",
    expected: cop(canonical),
    found: cop(legacy),
    sqlFix: sqlUpdate(c.id, { total_cuota_admin: "cuota_admin_inicial" }),
  }
}

/**
 * R04 — Porcentaje de cuota coherente
 * pct_cuota_gerencia ≈ (cuota_admin_inicial / total_contrato) * 100
 */
function r04PctCuotaCoherente(c: Interadministrativo): AuditFinding | null {
  const pctDB  = Number(c.pct_cuota_gerencia  ?? 0)
  const cuota  = Number(c.cuota_admin_inicial ?? 0)
  const total  = Number(c.total_contrato      ?? 0)
  if (pctDB === 0 || cuota === 0 || total === 0) return null
  const calculated = (cuota / total) * 100
  if (Math.abs(pctDB - calculated) <= 0.5) return null
  return {
    ruleId: "R04_PCT_CUOTA_COHERENTE",
    ruleName: "Porcentaje de Cuota coherente",
    severity: "warning",
    module: "Info General",
    field: "pct_cuota_gerencia",
    message: "El porcentaje de Cuota de Gerencia almacenado no corresponde al cálculo cuota/total.",
    expected: pct(calculated),
    found: pct(pctDB),
    sqlFix: sqlUpdate(c.id, {
      pct_cuota_gerencia: `ROUND((cuota_admin_inicial::numeric / NULLIF(total_contrato, 0)) * 100, 2)`,
    }),
  }
}

/**
 * R05 — Adición DB vs suma de filas
 * DB.adicion ≈ sum(interadmin_adiciones.valor_total)
 */
function r05AdicionDbSum(c: Interadministrativo, adiciones: Adicion[]): AuditFinding | null {
  if (adiciones.length === 0) return null
  const dbAdicion   = Number(c.adicion ?? 0)
  const rowsSum     = adiciones.reduce((s, a) => s + Number(a.valor_total ?? 0), 0)
  if (approxEqual(dbAdicion, rowsSum)) return null
  return {
    ruleId: "R05_ADICION_DB_SUM",
    ruleName: "Total Adicionado coherente",
    severity: "error",
    module: "Modificaciones Contractuales",
    field: "adicion",
    message: "El campo adicion en la BD no coincide con la suma real de las adiciones registradas.",
    expected: cop(rowsSum),
    found: cop(dbAdicion),
    sqlFix: `UPDATE interadministrativos\nSET\n  adicion = (\n    SELECT COALESCE(SUM(valor_total), 0)\n    FROM interadmin_adiciones\n    WHERE interadministrativo_id = ${c.id}\n  ),\n  updated_at = NOW()\nWHERE id = ${c.id};`,
  }
}

/**
 * R06 — Coherencia interna de cada adición
 * valor_bienes + valor_cuota ≤ valor_total (con margen de 1 peso)
 */
function r06AdicionSplit(c: Interadministrativo, adiciones: Adicion[]): AuditFinding | null {
  for (const a of adiciones) {
    const total  = Number(a.valor_total ?? 0)
    const bienes = Number(a.valor_bienes_servicios ?? 0)
    const cuota  = Number(a.valor_cuota_gerencia   ?? 0)
    if (bienes === 0 && cuota === 0) continue
    const split = bienes + cuota
    if (split > total + 1) {
      return {
        ruleId: "R06_ADICION_SPLIT",
        ruleName: "Desglose de Adición coherente",
        severity: "warning",
        module: "Modificaciones Contractuales",
        field: `interadmin_adiciones.id=${a.id}`,
        message: `Adición #${a.numero_adicion}: la suma de Bienes (${cop(bienes)}) + Cuota (${cop(cuota)}) = ${cop(split)} supera el valor total de la adición (${cop(total)}).`,
        expected: `Bienes + Cuota ≤ ${cop(total)}`,
        found: cop(split),
        sqlFix: `-- Revisar adición #${a.numero_adicion} (id=${a.id}) del contrato ${c.id_contrato}`,
      }
    }
  }
  return null
}

/**
 * R07 — Fecha de terminación coherente con última prórroga
 * fecha_terminacion = last_prorroga.nueva_fecha_terminacion
 */
function r07FechaProrroga(c: Interadministrativo, prorrogas: Prorroga[]): AuditFinding | null {
  if (prorrogas.length === 0) return null
  const sorted = [...prorrogas].sort((a, b) => b.numero_prorroga - a.numero_prorroga)
  const lastProrroga = sorted[0]
  const fechaDB       = c.fecha_terminacion?.slice(0, 10) ?? null
  const fechaProrroga = lastProrroga.nueva_fecha_terminacion?.slice(0, 10) ?? null
  if (!fechaDB || !fechaProrroga) return null
  if (fechaDB === fechaProrroga) return null
  return {
    ruleId: "R07_FECHA_PRORROGA",
    ruleName: "Fecha terminación coherente con Prórroga",
    severity: "warning",
    module: "Info General / Modificaciones",
    field: "fecha_terminacion",
    message: `La fecha de terminación almacenada no coincide con la nueva fecha establecida en la Prórroga #${lastProrroga.numero_prorroga}.`,
    expected: fechaProrroga,
    found: fechaDB,
    sqlFix: sqlUpdate(c.id, { fecha_terminacion: `'${fechaProrroga}'` }),
  }
}

/**
 * R08 — Bolsa de Bienes no negativa
 * bienesServiciosVigente ≥ 0
 */
function r08BienesNoNegativo(c: Interadministrativo, adiciones: Adicion[]): AuditFinding | null {
  const fin = calcInteradminFinancials({ ...c, adiciones })
  if (fin.bienesServiciosVigente >= 0) return null
  return {
    ruleId: "R08_BIENES_NO_NEGATIVO",
    ruleName: "Bolsa de Bienes no negativa",
    severity: "error",
    module: "Resumen Financiero",
    field: "bienesServiciosVigente",
    message: "El valor vigente de Bienes y Servicios es negativo tras aplicar las adiciones.",
    expected: "≥ 0",
    found: cop(fin.bienesServiciosVigente),
    sqlFix: `-- Revisar adiciones de bienes para contrato ${c.id_contrato} (id=${c.id})`,
  }
}

/**
 * R09 — Bolsa de Cuota no negativa
 * cuotaGerenciaVigente ≥ 0
 */
function r09CuotaNoNegativa(c: Interadministrativo, adiciones: Adicion[]): AuditFinding | null {
  const fin = calcInteradminFinancials({ ...c, adiciones })
  if (fin.cuotaGerenciaVigente >= 0) return null
  return {
    ruleId: "R09_CUOTA_NO_NEGATIVA",
    ruleName: "Bolsa de Cuota no negativa",
    severity: "error",
    module: "Resumen Financiero",
    field: "cuotaGerenciaVigente",
    message: "El valor vigente de Cuota de Gerencia es negativo tras aplicar las adiciones.",
    expected: "≥ 0",
    found: cop(fin.cuotaGerenciaVigente),
    sqlFix: `-- Revisar adiciones de cuota para contrato ${c.id_contrato} (id=${c.id})`,
  }
}

/**
 * R10 — Bienes no sobre-programados
 * bienesVigente ≥ bienesProgramados
 */
function r10BienesDisponibles(c: Interadministrativo, adiciones: Adicion[], hitos: PaymentMilestone[]): AuditFinding | null {
  if (hitos.length === 0) return null
  const fin    = calcInteradminFinancials({ ...c, adiciones })
  const pagos  = calcFormaPagoSummary(hitos)
  if (fin.bienesServiciosVigente >= pagos.programadoBienes) return null
  return {
    ruleId: "R10_BIENES_DISPONIBLES",
    ruleName: "Bienes no sobre-programados",
    severity: "warning",
    module: "Forma de Pago",
    field: "programadoBienes",
    message: "Los hitos de Bienes y Servicios programados superan el valor vigente de la bolsa de bienes.",
    expected: `Programado ≤ ${cop(fin.bienesServiciosVigente)}`,
    found: cop(pagos.programadoBienes),
    sqlFix: `-- Revisar hitos de BIENES_SERVICIOS para contrato ${c.id_contrato} (id=${c.id})`,
  }
}

/**
 * R11 — Cuota no sobre-programada
 * cuotaVigente ≥ cuotaProgramada
 */
function r11CuotaDisponible(c: Interadministrativo, adiciones: Adicion[], hitos: PaymentMilestone[]): AuditFinding | null {
  if (hitos.length === 0) return null
  const fin   = calcInteradminFinancials({ ...c, adiciones })
  const pagos = calcFormaPagoSummary(hitos)
  if (fin.cuotaGerenciaVigente >= pagos.programadoCuota) return null
  return {
    ruleId: "R11_CUOTA_DISPONIBLE",
    ruleName: "Cuota no sobre-programada",
    severity: "warning",
    module: "Forma de Pago",
    field: "programadoCuota",
    message: "Los hitos de Cuota de Gerencia programados superan el valor vigente de la bolsa de cuota.",
    expected: `Programado ≤ ${cop(fin.cuotaGerenciaVigente)}`,
    found: cop(pagos.programadoCuota),
    sqlFix: `-- Revisar hitos de CUOTA_GERENCIA para contrato ${c.id_contrato} (id=${c.id})`,
  }
}

/**
 * R12 — Hitos no exceden el valor contractual total
 * programadoTotal ≤ valorTotalActual
 */
function r12TotalProgramadoCoherente(c: Interadministrativo, adiciones: Adicion[], hitos: PaymentMilestone[]): AuditFinding | null {
  if (hitos.length === 0) return null
  const fin   = calcInteradminFinancials({ ...c, adiciones })
  const pagos = calcFormaPagoSummary(hitos)
  if (pagos.programadoTotal <= fin.valorTotalActual + 1) return null
  return {
    ruleId: "R12_TOTAL_PROGRAMADO",
    ruleName: "Total programado no excede valor vigente",
    severity: "warning",
    module: "Forma de Pago",
    field: "programadoTotal",
    message: "La suma de todos los hitos de pago supera el valor total actual del contrato.",
    expected: `≤ ${cop(fin.valorTotalActual)}`,
    found: cop(pagos.programadoTotal),
    sqlFix: `-- Revisar cronograma de pagos para contrato ${c.id_contrato} (id=${c.id})`,
  }
}

/**
 * R13 — Porcentaje acumulado de hitos ≤ 100%
 * sum(hito.percentage) ≤ 100 para el total del contrato
 */
function r13PctHitos(c: Interadministrativo, hitos: PaymentMilestone[]): AuditFinding | null {
  if (hitos.length === 0) return null
  const pagos = calcFormaPagoSummary(hitos)
  if (pagos.sumaPct <= 100.01) return null
  return {
    ruleId: "R13_PCT_HITOS",
    ruleName: "Porcentaje acumulado de hitos ≤ 100%",
    severity: "warning",
    module: "Forma de Pago",
    field: "percentage",
    message: `La suma de porcentajes de todos los hitos (${pct(pagos.sumaPct)}) supera el 100%.`,
    expected: "≤ 100%",
    found: pct(pagos.sumaPct),
    sqlFix: `-- Revisar porcentajes de hitos para contrato ${c.id_contrato} (id=${c.id})`,
  }
}

// ── Engine: run all 13 rules for a single contract ────────────────────────────

export function auditContract(input: FinancialAuditInput): ContractAuditResult {
  const { contract: c, adiciones, prorrogas, hitos } = input

  const checks: Array<AuditFinding | null> = [
    r01TotalCoherente(c),
    r02CuotaNoExcede(c),
    r03CuotaAdminSync(c),
    r04PctCuotaCoherente(c),
    r05AdicionDbSum(c, adiciones),
    r06AdicionSplit(c, adiciones),
    r07FechaProrroga(c, prorrogas),
    r08BienesNoNegativo(c, adiciones),
    r09CuotaNoNegativa(c, adiciones),
    r10BienesDisponibles(c, adiciones, hitos),
    r11CuotaDisponible(c, adiciones, hitos),
    r12TotalProgramadoCoherente(c, adiciones, hitos),
    r13PctHitos(c, hitos),
  ]

  const findings = checks.filter((f): f is AuditFinding => f !== null)
  const hasErrors   = findings.some((f) => f.severity === "error")
  const hasWarnings = findings.some((f) => f.severity === "warning")
  const status: AuditStatus = hasErrors ? "error" : hasWarnings ? "warning" : "ok"

  return {
    contractId: c.id,
    contractNumber: c.id_contrato,
    contractName: c.objeto_contrato ?? null,
    status,
    findings,
  }
}
