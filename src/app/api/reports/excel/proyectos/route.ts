import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import type { Interadministrativo, Contrato } from "@/types/database"
import type { Adicion, Prorroga, Suspension, Reinicio, Aclaratorio } from "@/types/modificaciones"
import type { Factura } from "@/types/facturas"
import type { FinancialReturn } from "@/types/financial-returns"
import type { Tarea } from "@/types/seguimiento"
import { calcInteradminFinancials } from "@/modules/projects/lib/interadmin-financials"

const REPORT_ROLES = new Set(["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"])

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(v: number | null | undefined): number | string { return v ?? "" }
function s(v: string | null | undefined): string           { return v ?? "" }

function d(v: string | null | undefined): string {
  if (!v) return ""
  try {
    return new Date(v.slice(0, 10) + "T00:00:00").toLocaleDateString("es-CO", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  } catch { return v }
}

function daysDiff(dateStr: string | null | undefined): number | "" {
  if (!dateStr) return ""
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.floor((new Date(dateStr.slice(0, 10) + "T00:00:00").getTime() - today.getTime()) / 86400000)
}

type AnyRecord = Record<string, unknown>

function groupById<T extends { interadministrativo_id: number }>(arr: T[]): Map<number, T[]> {
  const m = new Map<number, T[]>()
  for (const item of arr) {
    const list = m.get(item.interadministrativo_id) ?? []
    list.push(item)
    m.set(item.interadministrativo_id, list)
  }
  return m
}

// ── GET /api/reports/excel/proyectos?ids=1,2,3 ────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const profile  = await getCurrentUserProfile().catch(() => null)
  if (!profile || !REPORT_ROLES.has(profile.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  // Parse IDs
  const idsParam = req.nextUrl.searchParams.get("ids")
  const numericIds: number[] = idsParam
    ? idsParam.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : []

  // Fetch interadministrativos
  let iaQ = supabase.from("interadministrativos").select("*").order("id_contrato")
  if (numericIds.length > 0) iaQ = iaQ.in("id", numericIds)
  const { data: iaData } = await iaQ
  const ias = (iaData ?? []) as Interadministrativo[]

  if (ias.length === 0) {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), "Contratos Interadministrativos")
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"EPUXUA_Interadministrativos.xlsx\"",
      },
    })
  }

  const ids         = ias.map((p) => p.id)
  const idContrados = ias.map((p) => p.id_contrato)

  // ── Parallel batch queries ────────────────────────────────────────────────
  const [adRes, prRes, suRes, reRes, acRes, fRes, fgRes, fsRes, retRes, taskRes, auditRes, contRes] =
    await Promise.all([
      supabase.from("interadmin_adiciones"      as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_prorrogas"       as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_suspensiones"    as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_reinicios"       as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_aclaratorios"    as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_facturas"        as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_funding_groups"  as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_funding_sources" as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_financial_returns" as never).select("*").in("interadministrativo_id", ids),
      supabase.from("interadmin_tasks"           as never).select("*").in("interadministrativo_id", ids).is("deleted_at", null),
      supabase.from("interadmin_audit_log"       as never)
        .select("interadmin_id, user_email, created_at")
        .in("interadmin_id", ids)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase.from("contratos")
        .select("id, id_interadministrativo, estado, valor_inicial, adicion, valor_final, valor_pagado, valor_pendiente, fecha_terminacion")
        .in("id_interadministrativo", idContrados)
        .eq("tipo_contrato", "DERIVADO"),
    ])

  const adiciones    = (adRes.data   ?? []) as Adicion[]
  const prorrogas    = (prRes.data   ?? []) as Prorroga[]
  const suspensiones = (suRes.data   ?? []) as Suspension[]
  const reinicios    = (reRes.data   ?? []) as Reinicio[]
  const aclaratorios = (acRes.data   ?? []) as Aclaratorio[]
  const facturas     = (fRes.data    ?? []) as Factura[]
  const fGroups      = (fgRes.data   ?? []) as AnyRecord[]
  const fSources     = (fsRes.data   ?? []) as AnyRecord[]
  const returns_     = (retRes.data  ?? []) as FinancialReturn[]
  const tasks        = (taskRes.data ?? []) as Tarea[]
  const auditLog     = (auditRes.data ?? []) as { interadmin_id: number; user_email: string | null; created_at: string }[]
  const derivados    = (contRes.data ?? []) as Contrato[]

  // ── Build Maps ────────────────────────────────────────────────────────────

  const adMap   = groupById(adiciones)
  const prMap   = groupById(prorrogas)
  const suMap   = groupById(suspensiones)
  const reMap   = groupById(reinicios)
  const acMap   = groupById(aclaratorios)
  const fMap    = groupById(facturas)
  const retMap  = groupById(returns_)
  const taskMap = groupById(tasks)

  // Funding groups by interadministrativo_id
  const fgMap = new Map<number, AnyRecord[]>()
  for (const g of fGroups) {
    const pid = g.interadministrativo_id as number
    const list = fgMap.get(pid) ?? []
    list.push(g)
    fgMap.set(pid, list)
  }

  // Funding sources by interadministrativo_id
  const fsMap = new Map<number, AnyRecord[]>()
  for (const fs of fSources) {
    const pid = fs.interadministrativo_id as number
    const list = fsMap.get(pid) ?? []
    list.push(fs)
    fsMap.set(pid, list)
  }

  // Derivados by id_interadministrativo (string key)
  const derivMap = new Map<string, Contrato[]>()
  for (const c of derivados) {
    if (c.id_interadministrativo) {
      const list = derivMap.get(c.id_interadministrativo) ?? []
      list.push(c)
      derivMap.set(c.id_interadministrativo, list)
    }
  }

  // Last audit user per contract (audit_log is already ordered DESC)
  const lastAuditUser = new Map<number, string>()
  for (const entry of auditLog) {
    if (!lastAuditUser.has(entry.interadmin_id) && entry.user_email) {
      lastAuditUser.set(entry.interadmin_id, entry.user_email)
    }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const PROX_TAREAS_DIAS   = 15
  const PROX_CONTRATO_DIAS = 60
  const PROX_DERIV_DIAS    = 30

  const ESTADOS_ACTIVOS    = new Set(["EN EJECUCIÓN"])
  const ESTADOS_TERMINADOS = new Set([
    "TERMINADO", "LIQUIDADO", "CIERRE CONTRACTUAL",
    "TERMINADO ANTICIPADAMENTE", "TERMINADO ANORMALMENTE", "DECLARADO FALLIDO",
  ])

  // ── Build one row per contrato ────────────────────────────────────────────

  const rows = ias.map((p) => {
    const pid = p.id

    const ads  = adMap.get(pid)   ?? []
    const prs  = prMap.get(pid)   ?? []
    const sus  = suMap.get(pid)   ?? []
    const res  = reMap.get(pid)   ?? []
    const acs  = acMap.get(pid)   ?? []
    const fcts = fMap.get(pid)    ?? []
    const rets = retMap.get(pid)  ?? []
    const tks  = taskMap.get(pid) ?? []
    const fss  = fsMap.get(pid)   ?? []
    const devs = derivMap.get(p.id_contrato) ?? []

    // ── Fechas vigentes ────────────────────────────────────────────────────
    const lastProrroga = prs.sort((a, b) => b.numero_prorroga - a.numero_prorroga)[0]
    const fechaTermVigente = lastProrroga?.nueva_fecha_terminacion ?? p.fecha_terminacion
    const diasRestantes = daysDiff(fechaTermVigente)

    // Plazo vigente en días (desde fecha_inicio a fecha_terminacion_vigente)
    let plazoVigenteDias: number | string = ""
    if (p.fecha_inicio_ejecucion && fechaTermVigente) {
      plazoVigenteDias = Math.floor(
        (new Date(fechaTermVigente.slice(0, 10) + "T00:00:00").getTime() -
         new Date(p.fecha_inicio_ejecucion.slice(0, 10) + "T00:00:00").getTime()) / 86400000
      )
    }

    // ── Modificaciones ─────────────────────────────────────────────────────
    const valorAds = ads.reduce((sum, a) => sum + Number(a.valor_total ?? 0), 0)
    const fin = calcInteradminFinancials({
      valor_inicial: p.valor_inicial,
      cuota_admin_inicial: p.cuota_admin_inicial,
      total_contrato: p.total_contrato,
      adicion_legacy: p.adicion,
      adiciones: ads,
    })

    // ── Facturación y recaudo ──────────────────────────────────────────────
    const factsBS     = fcts.filter((f) => f.destino === "BIENES_SERVICIOS")
    const factsCG     = fcts.filter((f) => f.destino === "CUOTA_GERENCIA")
    const facturadoBS   = factsBS.reduce((s, f) => s + Number(f.valor_cobrado ?? 0), 0)
    const facturadoCG   = factsCG.reduce((s, f) => s + Number(f.valor_cobrado ?? 0), 0)
    const facturadoTotal = facturadoBS + facturadoCG
    const recaudadoBS   = factsBS.reduce((s, f) => s + Number(f.valor_ingresado ?? 0), 0)
    const recaudadoCG   = factsCG.reduce((s, f) => s + Number(f.valor_ingresado ?? 0), 0)
    const recaudadoTotal = recaudadoBS + recaudadoCG
    const pendienteRecaudo = Math.max(0, facturadoTotal - recaudadoTotal)

    // ── Fuentes de financiación ────────────────────────────────────────────
    const totalBolsa = fss.reduce((s, fs) => s + Number(fs.valor_bolsa ?? 0), 0)
    const sortedFss  = [...fss].sort((a, b) => Number(b.participation_percentage ?? 0) - Number(a.participation_percentage ?? 0))
    const principal  = sortedFss[0]

    // ── Rendimientos ───────────────────────────────────────────────────────
    const rendAcum  = rets.reduce((s, r) => s + Number(r.gross_return_value ?? 0), 0)
    const lastRet   = [...rets].sort((a, b) => new Date(b.return_date).getTime() - new Date(a.return_date).getTime())[0]

    // ── Derivados ──────────────────────────────────────────────────────────
    const devsActivos    = devs.filter((c) => ESTADOS_ACTIVOS.has(c.estado ?? ""))
    const devsTerminados = devs.filter((c) => ESTADOS_TERMINADOS.has(c.estado ?? ""))
    const valorTotalDevs  = devs.reduce((s, c) => s + Number(c.valor_final ?? c.valor_inicial ?? 0), 0)
    const valorPagadoDevs = devs.reduce((s, c) => s + Number(c.valor_pagado ?? 0), 0)
    const saldoDevs       = devs.reduce((s, c) => s + Number(c.valor_pendiente ?? 0), 0)

    const devsProxVencer = devsActivos.filter((c) => {
      const dd = daysDiff(c.fecha_terminacion)
      return typeof dd === "number" && dd >= 0 && dd <= PROX_DERIV_DIAS
    }).length

    // ── Alertas tareas ─────────────────────────────────────────────────────
    const pendingTks   = tks.filter((t) => t.status !== "COMPLETADA")
    const tareasVenc   = pendingTks.filter((t) => {
      const dd = daysDiff(t.fecha_compromiso)
      return typeof dd === "number" && dd < 0
    }).length
    const tareasProx   = pendingTks.filter((t) => {
      const dd = daysDiff(t.fecha_compromiso)
      return typeof dd === "number" && dd >= 0 && dd <= PROX_TAREAS_DIAS
    }).length

    const contratoProxFin = (() => {
      const dd = typeof diasRestantes === "number" ? diasRestantes : Infinity
      return dd >= 0 && dd <= PROX_CONTRATO_DIAS ? "Sí" : "No"
    })()

    const tieneAlertas = tareasVenc > 0 || tareasProx > 0 || devsProxVencer > 0 || contratoProxFin === "Sí" ? "Sí" : "No"

    return {
      // ── INFORMACIÓN GENERAL
      "N° Contrato":                    p.id_contrato,
      "Objeto":                         s(p.objeto_contrato),
      "Secretaría":                     s(p.secretaria),
      "Categoría":                      s(p.categoria),
      "Estado":                         p.estado,
      "Supervisor / Gerente Proyecto":  s(p.supervision),
      "Fecha Suscripción":              d(p.fecha_suscripcion),
      "Fecha Inicio":                   d(p.fecha_inicio_ejecucion),
      "Fecha Terminación Inicial":      d(p.fecha_terminacion),
      "Fecha Terminación Vigente":      d(fechaTermVigente),
      "Plazo Inicial":                  s(p.plazo_ejecucion_inicial),
      "Plazo Vigente (días)":           plazoVigenteDias,
      "Avance Físico %":                n(p.avance_fisico_pct),
      "Días Restantes":                 diasRestantes,
      "Enlace Secop II":                s(p.link_secop),

      // ── INFORMACIÓN FINANCIERA
      "Valor Inicial Contrato":         n(p.valor_inicial),
      "Valor Inicial Bienes y Servicios": n(p.bolsa_gerencia_inicial),
      "Valor Inicial Cuota Gerencia":   n(p.cuota_admin_inicial),
      "Valor Total Adiciones":          n(fin.totalAdiciones),
      "Valor Actual Contrato":          n(fin.valorTotalActual),
      "Valor Actual Bienes y Servicios": n(fin.bienesServiciosVigente),
      "Valor Actual Cuota Gerencia":    n(fin.cuotaGerenciaVigente),

      // ── CONTRATOS DERIVADOS
      "Cantidad Derivados":             n(devs.length),
      "Cantidad Derivados Activos":     n(devsActivos.length),
      "Cantidad Derivados Terminados":  n(devsTerminados.length),
      "Valor Total Derivados":          n(valorTotalDevs),
      "Valor Pagado Derivados":         n(valorPagadoDevs),
      "Saldo Pendiente Derivados":      n(saldoDevs),

      // ── MODIFICACIONES CONTRACTUALES
      "Cantidad Adiciones":             n(ads.length),
      "Valor Acumulado Adiciones":      n(valorAds),
      "Cantidad Prórrogas":             n(prs.length),
      "Cantidad Suspensiones":          n(sus.length),
      "Cantidad Reinicios":             n(res.length),
      "Cantidad Aclaratorios":          n(acs.length),

      // ── FACTURACIÓN Y RECAUDO
      "Facturado Bienes y Servicios":   n(facturadoBS),
      "Facturado Cuota Gerencia":       n(facturadoCG),
      "Facturado Total":                n(facturadoTotal),
      "Recaudado Bienes y Servicios":   n(recaudadoBS),
      "Recaudado Cuota Gerencia":       n(recaudadoCG),
      "Recaudado Total":                n(recaudadoTotal),
      "Pendiente Recaudo":              n(pendienteRecaudo),

      // ── FUENTES DE FINANCIACIÓN
      "Cantidad Fuentes Financiación":  n(fss.length),
      "Valor Total Fuentes":            n(totalBolsa) || n(p.valor_inicial),
      "Fuente Principal":               s(principal?.source_name as string | undefined),
      "Participación Fuente Principal %": principal ? Number(Number(principal.participation_percentage ?? 0).toFixed(2)) : "",

      // ── RENDIMIENTOS FINANCIEROS
      "Rendimientos Acumulados":        n(rendAcum),
      "Último Rendimiento Registrado":  n(lastRet?.gross_return_value),
      "Fecha Último Rendimiento":       d(lastRet?.return_date),
      "Cantidad Registros Rendimientos": n(rets.length),

      // ── ALERTAS
      "Tareas Vencidas":               n(tareasVenc),
      "Tareas Próximas a Vencer":      n(tareasProx),
      "Derivados Próximos a Vencer":   n(devsProxVencer),
      "Contrato Próximo a Finalizar":  contratoProxFin,
      "Tiene Alertas":                 tieneAlertas,

      // ── AUDITORÍA
      "Fecha Creación":                d(p.created_at),
      "Última Actualización":          d(p.updated_at),
      "Último Usuario Modificador":    s(lastAuditUser.get(pid)),
    }
  })

  // ── Sheet ──────────────────────────────────────────────────────────────────

  const ws = XLSX.utils.json_to_sheet(rows)
  ws["!cols"] = [
    { wch: 18 }, // N° Contrato
    { wch: 55 }, // Objeto
    { wch: 28 }, // Secretaría
    { wch: 20 }, // Categoría
    { wch: 22 }, // Estado
    { wch: 30 }, // Supervisor / Gerente Proyecto
    { wch: 16 }, // Fecha Suscripción
    { wch: 14 }, // Fecha Inicio
    { wch: 22 }, // Fecha Term. Inicial
    { wch: 22 }, // Fecha Term. Vigente
    { wch: 16 }, // Plazo Inicial
    { wch: 18 }, // Plazo Vigente (días)
    { wch: 14 }, // Avance Físico %
    { wch: 14 }, // Días Restantes
    { wch: 40 }, // Enlace Secop II
    { wch: 24 }, // Valor Inicial Contrato
    { wch: 28 }, // Valor Inicial B&S
    { wch: 28 }, // Valor Inicial Cuota
    { wch: 24 }, // Valor Total Adiciones
    { wch: 24 }, // Valor Actual Contrato
    { wch: 28 }, // Valor Actual B&S
    { wch: 28 }, // Valor Actual Cuota
    { wch: 20 }, // Cantidad Derivados
    { wch: 24 }, // Cantidad Activos
    { wch: 26 }, // Cantidad Terminados
    { wch: 22 }, // Valor Total Derivados
    { wch: 22 }, // Valor Pagado
    { wch: 24 }, // Saldo Pendiente
    { wch: 18 }, // Cant. Adiciones
    { wch: 24 }, // Valor Acum. Adiciones
    { wch: 18 }, // Cant. Prórrogas
    { wch: 20 }, // Cant. Suspensiones
    { wch: 18 }, // Cant. Reinicios
    { wch: 20 }, // Cant. Aclaratorios
    { wch: 26 }, // Facturado B&S
    { wch: 26 }, // Facturado CG
    { wch: 20 }, // Facturado Total
    { wch: 26 }, // Recaudado B&S
    { wch: 26 }, // Recaudado CG
    { wch: 20 }, // Recaudado Total
    { wch: 22 }, // Pendiente Recaudo
    { wch: 26 }, // Cant. Fuentes
    { wch: 24 }, // Valor Total Fuentes
    { wch: 34 }, // Fuente Principal
    { wch: 30 }, // Participación %
    { wch: 24 }, // Rendimientos Acum.
    { wch: 28 }, // Último Rendimiento
    { wch: 24 }, // Fecha Último Rend.
    { wch: 30 }, // Cant. Rendimientos
    { wch: 18 }, // Tareas Vencidas
    { wch: 26 }, // Tareas Próximas
    { wch: 26 }, // Derivados Próximos
    { wch: 28 }, // Contrato Próximo
    { wch: 14 }, // Tiene Alertas
    { wch: 16 }, // Fecha Creación
    { wch: 22 }, // Última Actualización
    { wch: 30 }, // Último Usuario
  ]

  const wb   = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Contratos Interadministrativos")
  const date = new Date().toISOString().slice(0, 10)
  const buf  = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="EPUXUA_Interadministrativos_${date}.xlsx"`,
    },
  })
}
