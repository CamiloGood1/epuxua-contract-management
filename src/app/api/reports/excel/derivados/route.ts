import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import type { Contrato } from "@/types/database"
import type {
  ContractAdicion,
  ContractProrroga,
  ContractSuspension,
  ContractReinicio,
  ContractAclaratorio,
  ContractPago,
} from "@/types/contract-derivado"

// ── Auth ──────────────────────────────────────────────────────────────────────

const REPORT_ROLES = new Set(["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"])

// ── Formateo ──────────────────────────────────────────────────────────────────

function s(v: string | null | undefined): string {
  return v ?? ""
}

function n(v: number | null | undefined): number {
  return v ?? 0
}

function d(v: string | null | undefined): string {
  if (!v) return ""
  try {
    return new Date(v).toLocaleDateString("es-CO", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  } catch { return v }
}

import {
  calcDerivedContractFinancials,
  groupByContratoId,
} from "@/modules/contracts/lib/derived-contract-financials"

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const profile  = await getCurrentUserProfile().catch(() => null)

  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (!REPORT_ROLES.has(profile.role)) {
    return NextResponse.json({ error: "Sin permisos para generar reportes" }, { status: 403 })
  }

  // ── 1. Todos los contratos (sin filtro por tipo) ─────────────────────────

  const { data: contractsRaw, error: cErr } = await supabase
    .from("contratos")
    .select("*")
    .order("tipo_contrato")
    .order("id")

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  const contracts = (contractsRaw ?? []) as Contrato[]
  const contractIds = contracts.map(c => c.id)

  // Si no hay contratos, devolver Excel vacío
  if (contractIds.length === 0) {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), "Contratos")
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="EPUXUA_Contratos_vacio.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  }

  // ── 2. IDs de interadministrativos padres ─────────────────────────────────

  const parentIds = [
    ...new Set(contracts.map(c => c.id_interadministrativo).filter(Boolean)),
  ] as string[]

  // ── 3. Consultas en paralelo ──────────────────────────────────────────────

  const [
    { data: parentsRaw },
    { data: adicionesRaw },
    { data: prorrogasRaw },
    { data: suspensionesRaw },
    { data: reiniciosRaw },
    { data: aclaratioriosRaw },
    { data: pagosRaw },
    { data: changeLogRaw },
  ] = await Promise.all([
    parentIds.length > 0
      ? supabase
          .from("interadministrativos")
          .select("id_contrato, objeto_contrato, secretaria, categoria, supervision")
          .in("id_contrato", parentIds)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase.from("contract_adiciones"    as never).select("*").in("contrato_id", contractIds),
    supabase.from("contract_prorrogas"    as never).select("*").in("contrato_id", contractIds),
    supabase.from("contract_suspensiones" as never).select("*").in("contrato_id", contractIds),
    supabase.from("contract_reinicios"    as never).select("*").in("contrato_id", contractIds),
    supabase.from("contract_aclaratorios" as never).select("*").in("contrato_id", contractIds),
    supabase.from("contract_pagos"        as never).select("*").in("contrato_id", contractIds).order("numero_pago"),
    supabase
      .from("contract_derivado_change_log" as never)
      .select("contrato_id, changed_by, changed_at")
      .in("contrato_id", contractIds)
      .order("changed_at"),
  ])

  // ── 4. Mapas de lookups ───────────────────────────────────────────────────

  interface ParentInfo {
    id_contrato: string
    objeto_contrato: string | null
    secretaria: string | null
    categoria: string | null
    supervision: string | null
  }

  const parentMap = new Map<string, ParentInfo>()
  for (const p of (parentsRaw ?? [])) {
    const pr = p as unknown as ParentInfo
    parentMap.set(pr.id_contrato, pr)
  }

  const adicionesMap    = groupByContratoId((adicionesRaw    ?? []) as ContractAdicion[])
  const prorrogasMap    = groupByContratoId((prorrogasRaw    ?? []) as ContractProrroga[])
  const suspensionesMap = groupByContratoId((suspensionesRaw ?? []) as ContractSuspension[])
  const reiniciosMap    = groupByContratoId((reiniciosRaw    ?? []) as ContractReinicio[])
  const aclaratioriosMap = groupByContratoId((aclaratioriosRaw ?? []) as ContractAclaratorio[])
  const pagosMap        = groupByContratoId((pagosRaw        ?? []) as ContractPago[])

  interface LogEntry { contrato_id: number; changed_by: string | null; changed_at: string }
  const changeLogMap = new Map<number, LogEntry[]>()
  for (const entry of ((changeLogRaw ?? []) as unknown as LogEntry[])) {
    const list = changeLogMap.get(entry.contrato_id) ?? []
    list.push(entry)
    changeLogMap.set(entry.contrato_id, list)
  }

  // ── 5. Construir filas ────────────────────────────────────────────────────

  const rows = contracts.map(c => {
    const parent       = c.id_interadministrativo ? (parentMap.get(c.id_interadministrativo) ?? null) : null
    const adiciones    = adicionesMap.get(c.id)    ?? []
    const prorrogas    = prorrogasMap.get(c.id)    ?? []
    const suspensiones = suspensionesMap.get(c.id) ?? []
    const reinicios    = reiniciosMap.get(c.id)    ?? []
    const aclaratorios = aclaratioriosMap.get(c.id) ?? []
    const pagos        = pagosMap.get(c.id)        ?? []
    const changeLogs   = changeLogMap.get(c.id)    ?? []

    const valorAdiciones  = adiciones.reduce((sum, a) => sum + n(a.valor_adicion), 0)
    const fin = calcDerivedContractFinancials({
      valorInicial: c.valor_inicial,
      adiciones,
      pagos,
    })
    const totalPagado     = fin.valorPagado
    const totalDescuentos = pagos.reduce((sum, p) => sum + n(p.descuentos), 0)
    // pagos ya ordenados por numero_pago — el último es el más reciente
    const lastPago  = pagos.length > 0 ? pagos[pagos.length - 1] : null
    // change log ordenado por changed_at asc
    const firstLog  = changeLogs.length > 0 ? changeLogs[0] : null
    const lastLog   = changeLogs.length > 0 ? changeLogs[changeLogs.length - 1] : null

    return {
      // ── Tipo ────────────────────────────────────────────────────────
      "Tipo Contrato":             s(c.tipo_contrato),
      // ── Información General ─────────────────────────────────────────
      "ID Contrato":               c.id,
      "Número Contrato":           s(c.numero_contrato),
      "Estado":                    s(c.estado),
      "Objeto":                    s(c.objeto_contrato),
      "Contratista":               s(c.contratista),
      "Tipo Contratista":          s(c.persona_natural_juridica),
      "NIT / Identificación":      s(c.nit_identificacion),
      "N° Proceso de Selección":   s(c.numero_proceso_seleccion ?? c.numero_proceso),
      "Supervisor":                s(c.supervisor),
      "Fecha Suscripción":         d(c.fecha_suscripcion),
      "Fecha Inicio":              d(c.fecha_inicio),
      "Fecha Terminación":         d(c.fecha_terminacion),
      "Plazo":                     s(c.plazo_ejecucion),
      "Enlace Secop":              s(c.link_ficha),
      "Enlace Carpeta Documental": s(c.link_carpeta_documental),
      // ── Relación Contractual ────────────────────────────────────────
      "N° Contrato Interadministrativo": s(c.id_interadministrativo),
      "Nombre Proyecto":           s(parent?.objeto_contrato),
      "Secretaría":                s(parent?.secretaria),
      "Categoría":                 s(parent?.categoria),
      "Gerente Proyecto":          s(parent?.supervision),
      // ── Información Financiera ──────────────────────────────────────
      "Valor Inicial":             n(c.valor_inicial),
      "Valor Actual":              fin.valorActual,
      "Valor Pagado":              fin.valorPagado,
      "Saldo Pendiente":           fin.saldoPendiente,
      "% Ejecutado":               fin.pctEjecutado ?? "",
      // ── Soporte Presupuestal ────────────────────────────────────────
      "Número RP":                 s(c.crp),
      "Fecha RP":                  d(c.fecha_crp),
      "Número CDP":                s(c.cdp),
      "Fecha CDP":                 d(c.fecha_cdp),
      // ── Modificaciones Contractuales ────────────────────────────────
      "Cantidad Adiciones":        adiciones.length,
      "Valor Total Adiciones":     valorAdiciones,
      "Cantidad Prórrogas":        prorrogas.length,
      "Cantidad Suspensiones":     suspensiones.length,
      "Cantidad Reinicios":        reinicios.length,
      "Cantidad Aclaratorios":     aclaratorios.length,
      // ── Facturación y Pagos ─────────────────────────────────────────
      "Cantidad Pagos Realizados": pagos.length,
      "Valor Total Pagado (Pagos)": totalPagado,
      "Última Fecha Pago":         lastPago ? d(lastPago.fecha_pago) : "",
      "Última Factura Asociada":   lastPago ? s(lastPago.numero_factura_contratista) : "",
      "Última Orden de Pago":      lastPago ? s(lastPago.numero_orden_pago) : "",
      "Valor Total Descuentos":    totalDescuentos,
      // ── Auditoría ───────────────────────────────────────────────────
      "Fecha Creación":            d(c.created_at),
      "Creado Por":                s(firstLog?.changed_by),
      "Última Actualización":      d(c.updated_at),
      "Último Usuario Modificador": s(lastLog?.changed_by),
    }
  })

  // ── 6. Generar Excel ──────────────────────────────────────────────────────

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  ws["!cols"] = [
    // Tipo (1 col)
    { wch: 18 },  // Tipo Contrato
    // Información General (14 cols)
    { wch: 10 },  // ID
    { wch: 20 },  // N° Contrato
    { wch: 22 },  // Estado
    { wch: 55 },  // Objeto
    { wch: 30 },  // Contratista
    { wch: 14 },  // Tipo Contratista
    { wch: 18 },  // NIT
    { wch: 22 },  // N° Proceso de Selección
    { wch: 25 },  // Supervisor
    { wch: 14 },  // F. Suscripción
    { wch: 14 },  // F. Inicio
    { wch: 14 },  // F. Terminación
    { wch: 15 },  // Plazo
    { wch: 40 },  // Enlace Secop
    { wch: 40 },  // Enlace Carpeta
    // Relación Contractual (5 cols)
    { wch: 26 },  // N° Interadmin
    { wch: 55 },  // Nombre Proyecto
    { wch: 22 },  // Secretaría
    { wch: 20 },  // Categoría
    { wch: 25 },  // Gerente Proyecto
    // Financiero (4 cols)
    { wch: 18 },  // Valor Inicial
    { wch: 18 },  // Valor Actual
    { wch: 18 },  // Valor Pagado
    { wch: 18 },  // Saldo Pendiente
    // Soporte Presupuestal (4 cols)
    { wch: 16 },  // N° RP
    { wch: 14 },  // Fecha RP
    { wch: 16 },  // N° CDP
    { wch: 14 },  // Fecha CDP
    // Modificaciones (6 cols)
    { wch: 16 },  // Cant Adiciones
    { wch: 20 },  // Valor Adiciones
    { wch: 16 },  // Cant Prórrogas
    { wch: 18 },  // Cant Suspensiones
    { wch: 16 },  // Cant Reinicios
    { wch: 18 },  // Cant Aclaratorios
    // Pagos (6 cols)
    { wch: 18 },  // Cant Pagos
    { wch: 22 },  // Valor Total Pagado
    { wch: 16 },  // Última Fecha Pago
    { wch: 25 },  // Última Factura
    { wch: 22 },  // Última Orden Pago
    { wch: 20 },  // Valor Descuentos
    // Auditoría (4 cols)
    { wch: 14 },  // Fecha Creación
    { wch: 25 },  // Creado Por
    { wch: 16 },  // Última Actualización
    { wch: 25 },  // Último Modificador
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Contratos")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const date   = new Date().toISOString().slice(0, 10)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="EPUXUA_Contratos_${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  })
}
