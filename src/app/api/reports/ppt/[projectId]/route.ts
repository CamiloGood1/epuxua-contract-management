import { NextRequest, NextResponse } from "next/server"
import PptxGenJS from "pptxgenjs"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function formatCOP(value: number | null | undefined): string {
  if (!value && value !== 0) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

function pct(v: number | null | undefined): string {
  return `${Number(v ?? 0).toFixed(1)}%`
}

const BLUE = "002869"
const GOLD = "D9A520"
const WHITE = "FFFFFF"
const LIGHT_GRAY = "F6F8FC"
const DARK_TEXT = "151C27"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { data: project } = await supabase
    .from("v_project_detail")
    .select("*")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
  }

  const { data: contractsData } = await supabase
    .from("v_contract_detail")
    .select("*")
    .or(
      project.primary_contract_id
        ? `id.eq.${project.primary_contract_id},parent_contract_id.eq.${project.primary_contract_id}`
        : `project_id.eq.${projectId}`
    )
    .order("contract_number", { ascending: true })
    .limit(100)

  const { data: followups } = await supabase
    .from("project_followups")
    .select("*")
    .eq("project_id", projectId)
    .order("followup_date", { ascending: false })
    .limit(5)

  const allContracts = contractsData ?? []
  const principal = allContracts.find((c) => c.id === project.primary_contract_id)
  const derivados = allContracts.filter((c) => c.id !== project.primary_contract_id)

  const prs = new PptxGenJS()
  prs.layout = "LAYOUT_16x9"
  prs.author = "EPUXUA"
  prs.title = `Presentación — ${project.project_code}`

  const slideOpts = {
    background: { color: WHITE },
  }

  // ── DIAPOSITIVA 1: PORTADA ────────────────────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: BLUE }

    slide.addText("EPUXUA E.I.C.E.", {
      x: 0.5, y: 1.0, w: 9.0, h: 0.8,
      fontSize: 40, bold: true, color: GOLD,
      align: "center",
    })
    slide.addText("INFORME EJECUTIVO", {
      x: 0.5, y: 1.9, w: 9.0, h: 0.5,
      fontSize: 22, bold: true, color: WHITE,
      align: "center",
    })
    slide.addText(project.project_code, {
      x: 0.5, y: 2.6, w: 9.0, h: 0.6,
      fontSize: 32, bold: true, color: GOLD,
      align: "center",
    })
    slide.addText(project.name, {
      x: 0.5, y: 3.3, w: 9.0, h: 1.2,
      fontSize: 18, color: WHITE,
      align: "center",
      wrap: true,
    })
    slide.addText(`${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}`, {
      x: 0.5, y: 4.9, w: 9.0, h: 0.4,
      fontSize: 14, color: "ADBDCC",
      align: "center",
    })
  }

  // ── DIAPOSITIVA 2: RESUMEN EJECUTIVO ─────────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: LIGHT_GRAY }

    slide.addText("Resumen Ejecutivo", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.6,
      fontSize: 24, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.0, w: 9.0, h: 0, line: { color: GOLD, width: 2 },
    })

    const items = [
      ["Código proyecto", project.project_code],
      ["Tipo", project.project_type],
      ["Estado ciclo vida", project.lifecycle_status],
      ["Entidad", project.secretaria ?? project.area_name ?? "—"],
      ["Año", String(project.year)],
      ["Ejecución", pct(project.execution_pct)],
    ]

    items.forEach(([label, value], i) => {
      const col = i % 2 === 0 ? 0.5 : 5.0
      const row = 1.2 + Math.floor(i / 2) * 0.9
      slide.addText(`${label}:`, { x: col, y: row, w: 2.0, h: 0.4, fontSize: 12, bold: true, color: DARK_TEXT })
      slide.addText(value ?? "—", { x: col + 2.0, y: row, w: 2.5, h: 0.4, fontSize: 12, color: BLUE })
    })
  }

  // ── DIAPOSITIVA 3: INFORMACIÓN GENERAL ───────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: WHITE }

    slide.addText("Información General", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.6,
      fontSize: 24, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.0, w: 9.0, h: 0, line: { color: GOLD, width: 2 },
    })

    if (principal) {
      slide.addText(`Contrato Principal: ${principal.contract_number}`, {
        x: 0.5, y: 1.2, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: BLUE,
      })
      slide.addText(principal.object ?? "—", {
        x: 0.5, y: 1.8, w: 9.0, h: 1.0, fontSize: 13, color: DARK_TEXT, wrap: true,
      })

      const info = [
        ["Contratista", principal.contractor_name],
        ["Supervisor", principal.supervisor_name ?? "—"],
        ["Inicio", principal.start_date ? new Date(principal.start_date).toLocaleDateString("es-CO") : "—"],
        ["Terminación", principal.end_date ? new Date(principal.end_date).toLocaleDateString("es-CO") : "—"],
      ]

      info.forEach(([label, value], i) => {
        const col = i % 2 === 0 ? 0.5 : 5.0
        const row = 3.1 + Math.floor(i / 2) * 0.7
        slide.addText(`${label}: `, { x: col, y: row, w: 1.8, h: 0.4, fontSize: 12, bold: true, color: DARK_TEXT })
        slide.addText(value, { x: col + 1.8, y: row, w: 2.5, h: 0.4, fontSize: 12, color: BLUE })
      })
    } else {
      slide.addText("Sin contrato principal registrado", {
        x: 0.5, y: 2.0, w: 9.0, h: 0.5, fontSize: 16, color: "999999",
      })
    }
  }

  // ── DIAPOSITIVA 4: INDICADORES FINANCIEROS ────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: LIGHT_GRAY }

    slide.addText("Estado Financiero", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.6,
      fontSize: 24, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.0, w: 9.0, h: 0, line: { color: GOLD, width: 2 },
    })

    const kpis = [
      { label: "Valor Total", value: formatCOP(project.total_value), color: BLUE },
      { label: "Bienes y Servicios", value: formatCOP(project.goods_services_value), color: "345BAB" },
      { label: "Cuota Gerencia", value: formatCOP(project.management_fee_amount), color: GOLD },
      { label: "Ejecutado", value: formatCOP(project.executed_value), color: "10B981" },
      { label: "Pagado", value: formatCOP(project.paid_value), color: "0E9F6E" },
      { label: "Saldo Disponible", value: formatCOP(project.available_balance), color: "8B5CF6" },
    ]

    kpis.forEach((kpi, i) => {
      const col = 0.5 + (i % 3) * 3.1
      const row = 1.3 + Math.floor(i / 3) * 1.8
      slide.addShape(prs.ShapeType.roundRect, {
        x: col, y: row, w: 2.9, h: 1.5,
        fill: { color: WHITE },
        line: { color: kpi.color, width: 2 },
      })
      slide.addText(kpi.label, {
        x: col + 0.1, y: row + 0.1, w: 2.7, h: 0.4,
        fontSize: 11, bold: true, color: "555555",
      })
      slide.addText(kpi.value, {
        x: col + 0.1, y: row + 0.6, w: 2.7, h: 0.7,
        fontSize: 13, bold: true, color: kpi.color,
      })
    })

    // Barra de progreso
    const execPct = Math.min(100, Math.max(0, Number(project.execution_pct ?? 0)))
    slide.addText(`Ejecución: ${pct(project.execution_pct)}`, {
      x: 0.5, y: 4.8, w: 9.0, h: 0.4, fontSize: 14, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.rect, { x: 0.5, y: 5.2, w: 9.0, h: 0.3, fill: { color: "E2E8F0" } })
    if (execPct > 0) {
      slide.addShape(prs.ShapeType.rect, {
        x: 0.5, y: 5.2, w: 9.0 * (execPct / 100), h: 0.3,
        fill: { color: execPct > 80 ? "10B981" : execPct > 50 ? GOLD : "EF4444" },
      })
    }
  }

  // ── DIAPOSITIVA 5: CONTRATOS DERIVADOS ───────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: WHITE }

    slide.addText("Contratos Derivados", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.6,
      fontSize: 24, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.0, w: 9.0, h: 0, line: { color: GOLD, width: 2 },
    })
    slide.addText(`Total: ${derivados.length} contratos derivados`, {
      x: 0.5, y: 1.1, w: 9.0, h: 0.4, fontSize: 13, color: "666666",
    })

    if (derivados.length > 0) {
      const headers = ["N° Contrato", "Contratista", "Estado", "Valor Total"]
      const rows = [
        headers.map((h) => ({ text: h, options: { bold: true, color: WHITE } })),
        ...derivados.slice(0, 8).map((d) => [
          { text: d.contract_number, options: {} },
          { text: (d.contractor_name ?? "—").substring(0, 20), options: {} },
          { text: d.status ?? "—", options: {} },
          { text: formatCOP(d.final_value ?? d.initial_value), options: {} },
        ]),
      ]

      slide.addTable(rows, {
        x: 0.5, y: 1.6, w: 9.0,
        colW: [2.2, 3.0, 1.8, 2.0],
        rowH: 0.4,
        fill: { color: WHITE },
        border: { type: "solid", pt: 1, color: "E2E8F0" },
        fontFace: "Arial",
        fontSize: 11,
        color: DARK_TEXT,
        autoPage: true,
      })
    } else {
      slide.addText("Sin contratos derivados registrados", {
        x: 0.5, y: 2.5, w: 9.0, h: 0.5, fontSize: 16, color: "999999",
      })
    }
  }

  // ── DIAPOSITIVA 6: SEGUIMIENTO ────────────────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: LIGHT_GRAY }

    slide.addText("Seguimiento", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.6,
      fontSize: 24, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.0, w: 9.0, h: 0, line: { color: GOLD, width: 2 },
    })

    if ((followups ?? []).length > 0) {
      const frows = [
        [
          { text: "Fecha", options: { bold: true, color: WHITE } },
          { text: "Período", options: { bold: true, color: WHITE } },
          { text: "Físico", options: { bold: true, color: WHITE } },
          { text: "Financiero", options: { bold: true, color: WHITE } },
          { text: "Alerta", options: { bold: true, color: WHITE } },
        ],
        ...(followups ?? []).map((f) => [
          { text: f.followup_date ? new Date(f.followup_date).toLocaleDateString("es-CO") : "—", options: {} },
          { text: f.period_label ?? "—", options: {} },
          { text: pct(f.physical_progress), options: {} },
          { text: pct(f.financial_progress), options: {} },
          { text: f.alert_level ?? "—", options: {} },
        ]),
      ]

      slide.addTable(frows, {
        x: 0.5, y: 1.2, w: 9.0,
        colW: [1.8, 2.4, 1.5, 1.8, 1.5],
        rowH: 0.45,
        fill: { color: WHITE },
        border: { type: "solid", pt: 1, color: "E2E8F0" },
        fontFace: "Arial",
        fontSize: 11,
        color: DARK_TEXT,
      })
    } else {
      slide.addText("Sin registros de seguimiento", {
        x: 0.5, y: 2.5, w: 9.0, h: 0.5, fontSize: 16, color: "999999",
      })
    }
  }

  // ── DIAPOSITIVA 7: ALERTAS ────────────────────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: WHITE }

    slide.addText("Alertas", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.6,
      fontSize: 24, bold: true, color: BLUE,
    })
    slide.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.0, w: 9.0, h: 0, line: { color: GOLD, width: 2 },
    })

    const alertCount = project.active_alerts_count ?? 0
    const alertColor = alertCount > 5 ? "EF4444" : alertCount > 0 ? GOLD : "10B981"
    slide.addShape(prs.ShapeType.roundRect, {
      x: 3.5, y: 1.5, w: 3.0, h: 1.5,
      fill: { color: alertColor },
    })
    slide.addText(String(alertCount), {
      x: 3.5, y: 1.6, w: 3.0, h: 0.8,
      fontSize: 48, bold: true, color: WHITE, align: "center",
    })
    slide.addText("Alertas activas", {
      x: 3.5, y: 2.5, w: 3.0, h: 0.4,
      fontSize: 13, color: WHITE, align: "center",
    })
    slide.addText(
      alertCount === 0
        ? "El proyecto no presenta alertas activas."
        : "Revisar el expediente del proyecto para detalle de alertas.",
      {
        x: 0.5, y: 3.5, w: 9.0, h: 0.5,
        fontSize: 14, color: "555555", align: "center",
      }
    )
  }

  // ── DIAPOSITIVA 8: CONCLUSIONES ───────────────────────────────────────────
  {
    const slide = prs.addSlide()
    slide.background = { color: BLUE }

    slide.addText("Conclusiones", {
      x: 0.5, y: 0.5, w: 9.0, h: 0.7,
      fontSize: 28, bold: true, color: GOLD,
    })

    const bullets = [
      `Ejecución financiera: ${pct(project.execution_pct)}`,
      `Valor total del proyecto: ${formatCOP(project.total_value)}`,
      `Contratos derivados activos: ${derivados.filter((d) => d.status === "EN_EJECUCION").length} de ${derivados.length}`,
      `Estado del ciclo de vida: ${project.lifecycle_status}`,
      `Alertas activas: ${project.active_alerts_count ?? 0}`,
    ]

    bullets.forEach((b, i) => {
      slide.addText(`• ${b}`, {
        x: 0.8, y: 1.5 + i * 0.7, w: 8.5, h: 0.6,
        fontSize: 16, color: WHITE,
      })
    })

    slide.addText("EPUXUA — Sistema de Gestión Pública", {
      x: 0.5, y: 5.2, w: 9.0, h: 0.4,
      fontSize: 12, color: "ADBDCC", align: "center",
    })
  }

  const buffer = await prs.write({ outputType: "nodebuffer" }) as Buffer

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${project.project_code}-presentacion.pptx"`,
    },
  })
}
