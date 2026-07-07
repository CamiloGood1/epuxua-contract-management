import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { canManageUsers } from "@/modules/projects/lib/access"
import { auditContract } from "@/modules/admin/audit/financial-audit"
import type { Interadministrativo } from "@/types/database"
import type { Adicion, Prorroga } from "@/types/modificaciones"
import type { PaymentMilestone } from "@/types/forma-pago"

function groupById<T extends { interadministrativo_id: number }>(arr: T[]): Map<number, T[]> {
  const m = new Map<number, T[]>()
  for (const item of arr) {
    const list = m.get(item.interadministrativo_id) ?? []
    list.push(item)
    m.set(item.interadministrativo_id, list)
  }
  return m
}

export async function GET() {
  const profile = await getCurrentUserProfile().catch(() => null)
  if (!profile || !canManageUsers(profile.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const supabase = await createSupabaseServerClient()

  const [iaRes, adRes, prRes, hiRes] = await Promise.all([
    supabase.from("interadministrativos").select("*").order("id_contrato").limit(5000),
    supabase.from("interadmin_adiciones").select("*").limit(20000),
    supabase.from("interadmin_prorrogas").select("*").limit(20000),
    supabase.from("contract_payment_schedule").select("*").limit(20000),
  ])

  const contracts = (iaRes.data ?? []) as Interadministrativo[]
  const adiciones = (adRes.data ?? []) as Adicion[]
  const prorrogas = (prRes.data ?? []) as Prorroga[]
  const hitos     = (hiRes.data ?? []) as PaymentMilestone[]

  const adicionesMap = groupById(adiciones)
  const prorrogasMap = groupById(prorrogas)
  const hitosMap     = groupById(hitos)

  const results = contracts.map((c) =>
    auditContract({
      contract:  c,
      adiciones: adicionesMap.get(c.id) ?? [],
      prorrogas: prorrogasMap.get(c.id) ?? [],
      hitos:     hitosMap.get(c.id)     ?? [],
    })
  )

  const runAt = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })

  // Sheet 1: Summary
  const totalOk       = results.filter((r) => r.status === "ok").length
  const totalWarnings = results.filter((r) => r.status === "warning").length
  const totalErrors   = results.filter((r) => r.status === "error").length
  const totalFindings = results.reduce((s, r) => s + r.findings.length, 0)

  const summaryData = [
    { Métrica: "Fecha del análisis",       Valor: runAt },
    { Métrica: "Contratos analizados",     Valor: results.length },
    { Métrica: "Sin hallazgos",            Valor: totalOk },
    { Métrica: "Con advertencias",         Valor: totalWarnings },
    { Métrica: "Con errores críticos",     Valor: totalErrors },
    { Métrica: "Total de hallazgos",       Valor: totalFindings },
    { Métrica: "Módulo auditado",          Valor: "Consistencia Financiera (13 reglas)" },
  ]

  // Sheet 2: All findings
  const findingsData: Record<string, string>[] = []
  for (const result of results) {
    if (result.findings.length === 0) {
      findingsData.push({
        Contrato: result.contractNumber,
        Objeto: result.contractName ?? "",
        Estado: "Sin hallazgos",
        Severidad: "",
        "ID Regla": "",
        "Nombre Regla": "",
        Módulo: "",
        Campo: "",
        "Descripción": "",
        "Valor Esperado": "",
        "Valor Encontrado": "",
      })
    } else {
      for (const f of result.findings) {
        findingsData.push({
          Contrato: result.contractNumber,
          Objeto: result.contractName ?? "",
          Estado: result.status === "error" ? "Error crítico" : "Advertencia",
          Severidad: f.severity === "error" ? "Error" : "Advertencia",
          "ID Regla": f.ruleId,
          "Nombre Regla": f.ruleName,
          Módulo: f.module,
          Campo: f.field,
          "Descripción": f.message,
          "Valor Esperado": f.expected ?? "",
          "Valor Encontrado": f.found ?? "",
        })
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData),   "01_Resumen")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(findingsData),  "02_Hallazgos")

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="EPUXUA_Integridad_${dateStr}.xlsx"`,
    },
  })
}
