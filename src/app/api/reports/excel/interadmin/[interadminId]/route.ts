import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import type { Interadministrativo, Contrato } from "@/types/database"
import type { Adicion, Prorroga, Suspension, Reinicio, Aclaratorio } from "@/types/modificaciones"
import type { Factura } from "@/types/facturas"
import type { FundingGroup, FundingSource } from "@/types/funding"
import type { FinancialReturn, FinancialReturnDistribution } from "@/types/financial-returns"
import type { Tarea } from "@/types/seguimiento"
import type { ContractPago, ContractAdicion } from "@/types/contract-derivado"
import { calcDerivedContractFinancials } from "@/modules/contracts/lib/derived-contract-financials"
import { calcInteradminFinancials } from "@/modules/projects/lib/interadmin-financials"
import { calcFacturacionKPIs } from "@/types/facturas"

const REPORT_ROLES = new Set(["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"])

// ── Format helpers ────────────────────────────────────────────────────────────

function n(v: number | null | undefined): number | string {
  return v ?? ""
}

function s(v: string | number | null | undefined): string {
  return v == null ? "" : String(v)
}

function d(v: string | null | undefined): string {
  if (!v) return ""
  try { return new Date(v).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }) }
  catch { return v }
}

function dt(v: string | null | undefined): string {
  if (!v) return ""
  try { return new Date(v).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) }
  catch { return v }
}

// ── Sheet builder helpers ─────────────────────────────────────────────────────

type Row = Record<string, string | number>

function makeSheet(headers: string[], rows: Row[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [Object.fromEntries(headers.map(h => [h, ""]))])
  ws["!cols"] = headers.map(() => ({ wch: 22 }))
  return ws
}

function kv2rows(pairs: [string, string | number][]): Row[] {
  return pairs.map(([campo, valor]) => ({ "Campo": campo, "Valor": valor }))
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ interadminId: string }> },
) {
  const { interadminId } = await params
  const numericId = parseInt(interadminId, 10)
  if (isNaN(numericId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const supabase = await createSupabaseServerClient()
  const profile  = await getCurrentUserProfile().catch(() => null)

  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!REPORT_ROLES.has(profile.role)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  // ── Carga principal ───────────────────────────────────────────────────────
  const { data: projectRaw } = await supabase
    .from("interadministrativos")
    .select("*")
    .eq("id", numericId)
    .maybeSingle()

  if (!projectRaw) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 })

  const p = projectRaw as Interadministrativo

  const [
    { data: contratosRaw },
    { data: adicionesRaw },
    { data: prorrogasRaw },
    { data: suspensionesRaw },
    { data: reiniciosRaw },
    { data: aclaratariosRaw },
    { data: facturasRaw },
    { data: tareasRaw },
    { data: fGroupsRaw },
    { data: fSourcesRaw },
    { data: returnsRaw },
    { data: returnDistRaw },
    { data: auditRaw },
  ] = await Promise.all([
    supabase.from("contratos").select("*").eq("id_interadministrativo", p.id_contrato).order("numero_contrato"),
    supabase.from("interadmin_adiciones"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_adicion"),
    supabase.from("interadmin_prorrogas"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_prorroga"),
    supabase.from("interadmin_suspensiones" as never).select("*").eq("interadministrativo_id", numericId).order("numero_suspension"),
    supabase.from("interadmin_reinicios"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_reinicio"),
    supabase.from("interadmin_aclaratorios" as never).select("*").eq("interadministrativo_id", numericId).order("numero_aclaratorio"),
    supabase.from("interadmin_facturas"     as never).select("*").eq("interadministrativo_id", numericId).order("fecha_remision", { ascending: false }),
    supabase.from("interadmin_tasks"        as never).select("*").eq("interadministrativo_id", numericId).is("deleted_at", null).order("fecha_compromiso"),
    supabase.from("interadmin_funding_groups"  as never).select("*").eq("interadministrativo_id", numericId).order("id"),
    supabase.from("interadmin_funding_sources" as never).select("*").eq("interadministrativo_id", numericId).order("source_name"),
    supabase.from("interadmin_financial_returns" as never).select("*").eq("interadministrativo_id", numericId).order("return_year", { ascending: false }).order("return_month", { ascending: false }),
    supabase.from("interadmin_financial_return_distribution" as never).select("*").eq("interadministrativo_id", numericId).order("id"),
    supabase.from("interadmin_audit_log" as never).select("*").eq("interadmin_id", numericId).order("created_at", { ascending: false }).limit(500),
  ])

  const contratos    = (contratosRaw    ?? []) as Contrato[]
  const adiciones    = (adicionesRaw    ?? []) as Adicion[]
  const prorrogas    = (prorrogasRaw    ?? []) as Prorroga[]
  const suspensiones = (suspensionesRaw ?? []) as Suspension[]
  const reinicios    = (reiniciosRaw    ?? []) as Reinicio[]
  const aclaratorios = (aclaratariosRaw ?? []) as Aclaratorio[]
  const facturas     = (facturasRaw     ?? []) as Factura[]
  const tareas       = (tareasRaw       ?? []) as Tarea[]
  const fGroups      = (fGroupsRaw      ?? []) as FundingGroup[]
  const fSources     = (fSourcesRaw     ?? []) as FundingSource[]
  const returns_     = (returnsRaw      ?? []) as FinancialReturn[]
  const returnDist   = (returnDistRaw   ?? []) as FinancialReturnDistribution[]
  const audit        = (auditRaw        ?? []) as Record<string, unknown>[]

  const derivados    = contratos.filter(c => c.tipo_contrato === "DERIVADO")

  // ── Pagos y adiciones a derivados ─────────────────────────────────────────
  const derivadoIds = derivados.map(d => d.id)
  let pagos: ContractPago[] = []
  let derivadoAdiciones: ContractAdicion[] = []
  if (derivadoIds.length > 0) {
    const [{ data: pagosRaw }, { data: adicionesDerivRaw }] = await Promise.all([
      supabase
        .from("contract_pagos" as never)
        .select("*")
        .in("contrato_id", derivadoIds)
        .order("fecha_pago", { ascending: false }),
      supabase
        .from("contract_adiciones" as never)
        .select("*")
        .in("contrato_id", derivadoIds),
    ])
    pagos = (pagosRaw ?? []) as ContractPago[]
    derivadoAdiciones = (adicionesDerivRaw ?? []) as ContractAdicion[]
  }

  const derivadoAdicionesMap = new Map<number, ContractAdicion[]>()
  for (const a of derivadoAdiciones) {
    const list = derivadoAdicionesMap.get(a.contrato_id) ?? []
    list.push(a)
    derivadoAdicionesMap.set(a.contrato_id, list)
  }
  const derivadoPagosMap = new Map<number, ContractPago[]>()
  for (const p of pagos) {
    const list = derivadoPagosMap.get(p.contrato_id) ?? []
    list.push(p)
    derivadoPagosMap.set(p.contrato_id, list)
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const fin = calcInteradminFinancials({
    valor_inicial: p.valor_inicial,
    cuota_admin_inicial: p.cuota_admin_inicial,
    total_contrato: p.total_contrato,
    adicion_legacy: p.adicion,
    adiciones,
  })
  const factKpis = calcFacturacionKPIs(facturas)
  const facturadoTotal    = factKpis.facturadoTotal
  const recaudadoTotal    = factKpis.ingresadoTotal
  const rendimientosTotal = returns_.reduce((s, r) => s + Number(r.gross_return_value ?? 0), 0)
  const totalFuentes      = fSources.reduce((s, fs) => s + Number((fs as unknown as Record<string, unknown>).valor_bolsa ?? 0), 0)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diffDays = (dateStr: string) => Math.floor((new Date(dateStr + "T00:00:00").getTime() - today.getTime()) / 86400000)

  // ── HOJA 1 — RESUMEN EJECUTIVO ────────────────────────────────────────────
  const terminacionVigente = (() => {
    if (prorrogas.length > 0) {
      const last = [...prorrogas].sort((a, b) => a.numero_prorroga - b.numero_prorroga).at(-1)
      return last?.nueva_fecha_terminacion ?? p.fecha_terminacion
    }
    return p.fecha_terminacion
  })()

  const diasRestantes = terminacionVigente ? diffDays(terminacionVigente) : null

  const ws1 = makeSheet(["Campo", "Valor"], kv2rows([
    ["Número Contrato",           s(p.id_contrato)],
    ["Objeto",                    s(p.objeto_contrato)],
    ["Secretaría",                s(p.secretaria)],
    ["Categoría",                 s(p.categoria)],
    ["Estado",                    s(p.estado)],
    ["Clase Contrato",            s(p.clase_contrato)],
    ["Área Responsable",          s(p.area_responsable)],
    ["Supervisión / Gerente",     s(p.supervision)],
    ["Fecha Suscripción",         d(p.fecha_suscripcion)],
    ["Fecha Inicio Ejecución",    d(p.fecha_inicio_ejecucion)],
    ["Fecha Terminación Inicial", d(p.fecha_terminacion)],
    ["Fecha Terminación Vigente", d(terminacionVigente)],
    ["Plazo Inicial",             s(p.plazo_ejecucion_inicial)],
    ["Prórrogas Registradas",     prorrogas.length],
    ["Avance Físico (%)",         n(p.avance_fisico_pct)],
    ["Días Restantes",            diasRestantes ?? ""],
    ["Contratos Derivados",       derivados.length],
    ["Link SECOP II",             s(p.link_secop)],
    ["Observaciones",             s(p.observaciones)],
  ]))
  ws1["!cols"] = [{ wch: 30 }, { wch: 60 }]

  // ── HOJA 2 — RESUMEN FINANCIERO ───────────────────────────────────────────
  const ws2 = makeSheet(["Campo", "Valor"], kv2rows([
    ["Valor Inicial (Bienes y Servicios)", n(p.valor_inicial)],
    ["Cuota Gerencia Inicial",             n(p.cuota_admin_inicial)],
    ["Bolsa Gerencia Inicial",             n(p.bolsa_gerencia_inicial)],
    ["Adiciones Bienes y Servicios",       n(adiciones.reduce((s, a) => s + Number(a.valor_bienes_servicios ?? 0), 0))],
    ["Adiciones Cuota Administración",     n(adiciones.reduce((s, a) => s + Number(a.valor_cuota_gerencia ?? 0), 0))],
    ["Adiciones Bolsa Mandato",            n(p.adicion_bolsa_mandato)],
    ["Total Contrato (Bienes + Cuota)",    n(fin.valorTotalActual)],
    ["Total Cuota Administración",         n(fin.cuotaGerenciaVigente)],
    ["Total Bolsa Mandato",                n(p.total_bolsa_mandato)],
    ["% Cuota de Gerencia",                n(p.pct_cuota_gerencia)],
    ["Facturado Bienes y Servicios",       n(factKpis.facturadoBienes)],
    ["Facturado Cuota Gerencia",           n(factKpis.facturadoCuota)],
    ["Facturado Total",                    facturadoTotal],
    ["Recaudado Total",                    recaudadoTotal],
    ["Pendiente Recaudo",                  Math.max(0, facturadoTotal - recaudadoTotal)],
    ["Rendimientos Acumulados",            rendimientosTotal],
    ["Valor Pendiente Cobrar",             n(p.valor_pendiente_cobrar)],
  ]))
  ws2["!cols"] = [{ wch: 35 }, { wch: 25 }]

  // ── HOJA 3 — CONTRATOS DERIVADOS ─────────────────────────────────────────
  const H3 = ["Número Derivado", "Objeto", "Contratista", "Estado", "Clase Contrato",
    "Supervisor", "Fecha Inicio", "Fecha Terminación", "Valor Inicial", "Adición", "Valor Actual",
    "Valor Pagado", "Saldo Pendiente", "Enlace Carpeta Documental"]
  const ws3 = makeSheet(H3, derivados.map(c => {
    const fin = calcDerivedContractFinancials({
      valorInicial: c.valor_inicial,
      adiciones: derivadoAdicionesMap.get(c.id) ?? [],
      pagos: derivadoPagosMap.get(c.id) ?? [],
    })
    return {
    "Número Derivado":           s(c.numero_contrato),
    "Objeto":                    s(c.objeto_contrato),
    "Contratista":               s(c.contratista),
    "Estado":                    s(c.estado),
    "Clase Contrato":            s(c.clase_contrato),
    "Supervisor":                s(c.supervisor),
    "Fecha Inicio":              d(c.fecha_inicio),
    "Fecha Terminación":         d(c.fecha_terminacion),
    "Valor Inicial":             n(c.valor_inicial),
    "Adición":                   fin.totalAdiciones,
    "Valor Actual":              fin.valorActual,
    "Valor Pagado":              fin.valorPagado,
    "Saldo Pendiente":           fin.saldoPendiente,
    "Enlace Carpeta Documental": s((c as unknown as Record<string, unknown>).link_carpeta_documental as string),
  }}))
  ws3["!cols"] = [{ wch: 18 }, { wch: 45 }, { wch: 25 }, { wch: 16 }, { wch: 18 },
    { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
    { wch: 40 }]

  // ── HOJA 4 — MODIFICACIONES CONTRACTUALES ────────────────────────────────
  const H4 = ["Tipo", "Número", "Fecha", "Valor Total", "Valor Bienes y Servicios",
    "Valor Cuota Gerencia", "Número RP", "Motivo", "Observaciones / Justificación", "Usuario Registro"]

  const modRows: Row[] = [
    ...adiciones.map(a => ({
      "Tipo":                       "ADICIÓN",
      "Número":                     n(a.numero_adicion),
      "Fecha":                      d(a.fecha_adicion),
      "Valor Total":                n(a.valor_total),
      "Valor Bienes y Servicios":   n(a.valor_bienes_servicios),
      "Valor Cuota Gerencia":       n(a.valor_cuota_gerencia),
      "Número RP":                  s((a as unknown as Record<string, unknown>).numero_rp as string),
      "Motivo":                     s(a.motivo),
      "Observaciones / Justificación": "",
      "Usuario Registro":           s(a.user_email),
    })),
    ...prorrogas.map(pr => ({
      "Tipo":                       "PRÓRROGA",
      "Número":                     n(pr.numero_prorroga),
      "Fecha":                      d(pr.fecha_suscripcion),
      "Valor Total":                "",
      "Valor Bienes y Servicios":   "",
      "Valor Cuota Gerencia":       "",
      "Número RP":                  "",
      "Motivo":                     s(pr.justificacion),
      "Observaciones / Justificación": s(pr.plazo_prorroga),
      "Usuario Registro":           s(pr.user_email),
    })),
    ...suspensiones.map(su => ({
      "Tipo":                       "SUSPENSIÓN",
      "Número":                     n(su.numero_suspension),
      "Fecha":                      d(su.inicio_suspension),
      "Valor Total":                "",
      "Valor Bienes y Servicios":   "",
      "Valor Cuota Gerencia":       "",
      "Número RP":                  "",
      "Motivo":                     s(su.motivo),
      "Observaciones / Justificación": su.fin_suspension ? `Fin: ${d(su.fin_suspension)}` : "",
      "Usuario Registro":           s(su.user_email),
    })),
    ...reinicios.map(re => ({
      "Tipo":                       "REINICIO",
      "Número":                     n(re.numero_reinicio),
      "Fecha":                      d(re.fecha_reinicio),
      "Valor Total":                "",
      "Valor Bienes y Servicios":   "",
      "Valor Cuota Gerencia":       "",
      "Número RP":                  "",
      "Motivo":                     s(re.motivo),
      "Observaciones / Justificación": s(re.observaciones),
      "Usuario Registro":           s(re.user_email),
    })),
    ...aclaratorios.map(ac => ({
      "Tipo":                       "ACLARATORIO",
      "Número":                     n(ac.numero_aclaratorio),
      "Fecha":                      d(ac.fecha_suscripcion),
      "Valor Total":                "",
      "Valor Bienes y Servicios":   "",
      "Valor Cuota Gerencia":       "",
      "Número RP":                  "",
      "Motivo":                     s(ac.motivo),
      "Observaciones / Justificación": s(ac.descripcion),
      "Usuario Registro":           s(ac.user_email),
    })),
  ]
  const ws4 = makeSheet(H4, modRows)
  ws4["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 24 },
    { wch: 22 }, { wch: 18 }, { wch: 35 }, { wch: 28 }, { wch: 28 }]

  // ── HOJA 5 — FUENTES DE FINANCIACIÓN ─────────────────────────────────────
  const H5 = ["Grupo Financiación", "Fuente", "Descripción", "Valor Bolsa", "Participación %"]
  const groupMap = new Map(fGroups.map(g => [g.id, g]))
  const ws5 = makeSheet(H5, fSources.map(fs => {
    const fsAny = fs as unknown as Record<string, unknown>
    const grupo = groupMap.get(fsAny.funding_group_id as number)
    const val   = Number(fsAny.valor_bolsa ?? 0)
    return {
      "Grupo Financiación": s(grupo ? (grupo as unknown as Record<string, unknown>).origen_recursos as string : ""),
      "Fuente":             s(fs.source_name),
      "Descripción":        s(fsAny.description as string),
      "Valor Bolsa":        val,
      "Participación %":    totalFuentes > 0 ? Number(((val / totalFuentes) * 100).toFixed(2)) : 0,
    }
  }))
  ws5["!cols"] = [{ wch: 28 }, { wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 16 }]

  // ── HOJA 6 — FACTURACIÓN Y RECAUDO ───────────────────────────────────────
  const H6 = ["Número Factura", "Fecha Factura", "Fecha Recaudo", "Destino",
    "Valor Cobrado", "Valor Recaudado", "Descuentos", "Neto", "Estado"]
  const ws6 = makeSheet(H6, facturas.map(f => ({
    "Número Factura":   s(f.numero_factura),
    "Fecha Factura":    d(f.fecha_remision),
    "Fecha Recaudo":    d(f.fecha_ingreso),
    "Destino":          s(f.destino),
    "Valor Cobrado":    n(f.valor_cobrado),
    "Valor Recaudado":  n(f.valor_ingresado),
    "Descuentos":       n(f.descuentos),
    "Neto":             Number(f.valor_cobrado ?? 0) - Number(f.descuentos ?? 0),
    "Estado":           s(f.estado),
  })))
  ws6["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }]

  // ── HOJA 7 — PAGOS A DERIVADOS ────────────────────────────────────────────
  const derivadoMap = new Map(derivados.map(d => [d.id, d.numero_contrato]))
  const H7 = ["Derivado", "N° Pago", "Fecha Pago", "Factura Asociada", "Orden Pago",
    "Valor Bruto", "Descuentos", "Valor Neto", "Observaciones"]
  const ws7 = makeSheet(H7, pagos.map(pg => ({
    "Derivado":          s(derivadoMap.get(pg.contrato_id)),
    "N° Pago":           n(pg.numero_pago),
    "Fecha Pago":        d(pg.fecha_pago),
    "Factura Asociada":  s(pg.numero_factura_contratista),
    "Orden Pago":        s(pg.numero_orden_pago),
    "Valor Bruto":       n(pg.valor_pagado),
    "Descuentos":        n(pg.descuentos),
    "Valor Neto":        n(pg.valor_neto_girado),
    "Observaciones":     s(pg.observaciones),
  })))
  ws7["!cols"] = [{ wch: 18 }, { wch: 8 }, { wch: 13 }, { wch: 22 }, { wch: 18 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 30 }]

  // ── HOJA 8 — RENDIMIENTOS FINANCIEROS ────────────────────────────────────
  const H8 = ["Periodo", "Año", "Mes", "Fecha Registro", "Valor Rendimiento", "Estado Reintegro", "Observaciones"]
  const ws8 = makeSheet(H8, returns_.map(r => ({
    "Periodo":           `${r.return_year}-${String(r.return_month).padStart(2, "0")}`,
    "Año":               r.return_year,
    "Mes":               r.return_month,
    "Fecha Registro":    d(r.return_date),
    "Valor Rendimiento": n(r.gross_return_value),
    "Estado Reintegro":  s(r.repayment_status),
    "Observaciones":     s(r.observations),
  })))
  ws8["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 30 }]

  // ── HOJA 9 — DISTRIBUCIÓN DE RENDIMIENTOS ────────────────────────────────
  const H9 = ["Periodo", "Fuente", "Participación %", "Valor Distribuido"]
  const returnMap = new Map(returns_.map(r => [r.id, `${r.return_year}-${String(r.return_month).padStart(2, "0")}`]))
  const ws9 = makeSheet(H9, returnDist.map(rd => ({
    "Periodo":           s(returnMap.get((rd as unknown as Record<string, unknown>).financial_return_id as number)),
    "Fuente":            s(rd.source_name),
    "Participación %":   n(rd.participation_percentage),
    "Valor Distribuido": n(rd.distributed_value),
  })))
  ws9["!cols"] = [{ wch: 12 }, { wch: 32 }, { wch: 16 }, { wch: 20 }]

  // ── HOJA 10 — SEGUIMIENTO (tareas pendientes / en proceso) ───────────────
  const tareasPendientes = tareas.filter(t => t.status !== "COMPLETADA")
  const H10 = ["Fecha Creación", "Tarea", "Descripción", "Responsable", "Prioridad", "Fecha Límite", "Estado", "Días Restantes"]
  const ws10 = makeSheet(H10, tareasPendientes.map(t => {
    const dias = diffDays(t.fecha_compromiso)
    return {
      "Fecha Creación":  d(t.created_at),
      "Tarea":           s(t.nombre),
      "Descripción":     s(t.descripcion),
      "Responsable":     s(t.responsable),
      "Prioridad":       s(t.prioridad),
      "Fecha Límite":    d(t.fecha_compromiso),
      "Estado":          s(t.status),
      "Días Restantes":  dias,
    }
  }))
  ws10["!cols"] = [{ wch: 14 }, { wch: 35 }, { wch: 40 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

  // ── HOJA 11 — TAREAS COMPLETADAS ─────────────────────────────────────────
  const tareasCompletadas = tareas.filter(t => t.status === "COMPLETADA")
  const H11 = ["Fecha Creación", "Fecha Cierre", "Tarea", "Responsable", "Prioridad", "Evidencia", "Comentario Cierre"]
  const ws11 = makeSheet(H11, tareasCompletadas.map(t => ({
    "Fecha Creación":   d(t.created_at),
    "Fecha Cierre":     d(t.fecha_completada),
    "Tarea":            s(t.nombre),
    "Responsable":      s(t.responsable),
    "Prioridad":        s(t.prioridad),
    "Evidencia":        s(t.enlace_evidencia_cierre),
    "Comentario Cierre":s(t.comentario_cierre),
  })))
  ws11["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 22 }, { wch: 12 }, { wch: 40 }, { wch: 35 }]

  // ── HOJA 12 — ALERTAS ────────────────────────────────────────────────────
  const alertRows: Row[] = []

  // Tareas vencidas
  for (const t of tareas) {
    if (t.status === "COMPLETADA") continue
    const dias = diffDays(t.fecha_compromiso)
    if (dias < 0) {
      alertRows.push({
        "Tipo Alerta":      "TAREA VENCIDA",
        "Descripción":      `Tarea: ${t.nombre} — Responsable: ${t.responsable}`,
        "Fecha Generación": d(t.fecha_compromiso),
        "Días":             dias,
      })
    } else if (dias <= 3) {
      alertRows.push({
        "Tipo Alerta":      "TAREA PRÓXIMA A VENCER",
        "Descripción":      `Tarea: ${t.nombre} — Responsable: ${t.responsable}`,
        "Fecha Generación": d(t.fecha_compromiso),
        "Días":             dias,
      })
    }
  }

  // Contrato próximo a vencer
  if (terminacionVigente && diasRestantes != null) {
    if (diasRestantes < 0) {
      alertRows.push({ "Tipo Alerta": "CONTRATO VENCIDO", "Descripción": `Fecha terminación: ${d(terminacionVigente)}`, "Fecha Generación": d(terminacionVigente), "Días": diasRestantes })
    } else if (diasRestantes <= 30) {
      alertRows.push({ "Tipo Alerta": "CONTRATO PRÓXIMO A VENCER", "Descripción": `Quedan ${diasRestantes} días. Terminación: ${d(terminacionVigente)}`, "Fecha Generación": d(terminacionVigente), "Días": diasRestantes })
    }
  }

  // Facturas pendientes
  for (const f of facturas) {
    if (f.estado === "FACTURADO") {
      alertRows.push({ "Tipo Alerta": "FACTURA PENDIENTE DE RECAUDO", "Descripción": `Factura ${f.numero_factura} — ${d(f.fecha_remision)}`, "Fecha Generación": d(f.fecha_remision), "Días": "" })
    }
  }

  const H12 = ["Tipo Alerta", "Descripción", "Fecha Generación", "Días"]
  const ws12 = makeSheet(H12, alertRows)
  ws12["!cols"] = [{ wch: 30 }, { wch: 55 }, { wch: 18 }, { wch: 8 }]

  // ── HOJA 13 — AUDITORÍA ───────────────────────────────────────────────────
  const H13 = ["Fecha", "Usuario", "Acción", "Campo / Entidad", "Valor Anterior", "Valor Nuevo"]
  const ws13 = makeSheet(H13, audit.map(a => ({
    "Fecha":             dt(a.created_at as string),
    "Usuario":           s(a.user_email as string),
    "Acción":            s(a.action as string),
    "Campo / Entidad":   s((a.field_name ?? a.id_contrato ?? "") as string),
    "Valor Anterior":    s(a.old_value as string),
    "Valor Nuevo":       s(a.new_value as string),
  })))
  ws13["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 20 }, { wch: 35 }, { wch: 35 }]

  // ── Construir workbook ────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1,  "01_Resumen Ejecutivo")
  XLSX.utils.book_append_sheet(wb, ws2,  "02_Resumen Financiero")
  XLSX.utils.book_append_sheet(wb, ws3,  "03_Contratos Derivados")
  XLSX.utils.book_append_sheet(wb, ws4,  "04_Modificaciones")
  XLSX.utils.book_append_sheet(wb, ws5,  "05_Fuentes Financiacion")
  XLSX.utils.book_append_sheet(wb, ws6,  "06_Facturacion Recaudo")
  XLSX.utils.book_append_sheet(wb, ws7,  "07_Pagos Derivados")
  XLSX.utils.book_append_sheet(wb, ws8,  "08_Rendimientos")
  XLSX.utils.book_append_sheet(wb, ws9,  "09_Distribucion Rendimientos")
  XLSX.utils.book_append_sheet(wb, ws10, "10_Seguimiento")
  XLSX.utils.book_append_sheet(wb, ws11, "11_Tareas Completadas")
  XLSX.utils.book_append_sheet(wb, ws12, "12_Alertas")
  XLSX.utils.book_append_sheet(wb, ws13, "13_Auditoria")

  // ── Serializar y devolver ─────────────────────────────────────────────────
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  const filename = `REPORTE_${p.id_contrato.replace(/[/\\?%*:|"<>]/g, "-")}_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
