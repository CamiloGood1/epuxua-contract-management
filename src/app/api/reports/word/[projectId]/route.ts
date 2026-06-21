import { NextRequest, NextResponse } from "next/server"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
} from "docx"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function formatCOP(value: number | null | undefined): string {
  if (!value && value !== 0) return "—"
  const d = value % 1 !== 0 ? 2 : 0
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: d, maximumFractionDigits: d }).format(value)
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
}

function pct(v: number | null | undefined): string {
  return `${Number(v ?? 0).toFixed(1)}%`
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } })
}

function para(text: string) {
  return new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 100 } })
}

function kv(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
    spacing: { after: 80 },
  })
}

function tableRow(cells: string[], header = false) {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: header, size: 20, color: header ? "FFFFFF" : "000000" })] })],
          shading: header ? { type: ShadingType.SOLID, color: "002869" } : undefined,
          width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        })
    ),
  })
}

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

  // 1. Cargar el proyecto primero
  const { data: project } = await supabase
    .from("v_project_detail")
    .select("*")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
  }

  // 2. Cargar contratos y seguimientos en paralelo
  const [{ data: contractsData }, { data: followups }] = await Promise.all([
    supabase
      .from("v_contract_detail")
      .select("*")
      .or(
        project.primary_contract_id
          ? `id.eq.${project.primary_contract_id},parent_contract_id.eq.${project.primary_contract_id}`
          : `project_id.eq.${projectId}`
      )
      .order("contract_number", { ascending: true })
      .limit(100),
    supabase
      .from("project_followups")
      .select("*")
      .eq("project_id", projectId)
      .order("followup_date", { ascending: false })
      .limit(10),
  ])

  const allContracts = contractsData ?? []
  const principal = allContracts.find((c) => c.id === project.primary_contract_id)
  const derivados = allContracts.filter((c) => c.id !== project.primary_contract_id)

  const doc = new Document({
    creator: "EPUXUA Gestión Pública",
    title: `Informe — ${project.project_code}`,
    description: "Informe ejecutivo generado automáticamente",
    sections: [
      {
        children: [
          // Portada
          new Paragraph({
            children: [new TextRun({ text: "EPUXUA E.I.C.E.", bold: true, size: 48, color: "002869" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "INFORME EJECUTIVO DE PROYECTO", bold: true, size: 36, color: "D9A520" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: project.project_code, bold: true, size: 32, color: "002869" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: project.name, size: 26 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generado: ${formatDate(new Date().toISOString())}`, size: 20, color: "666666" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // 1. Información General
          heading("1. Información General"),
          kv("Código proyecto", project.project_code),
          kv("Nombre", project.name),
          kv("Tipo", project.project_type ?? "—"),
          kv("Año", String(project.year)),
          kv("Estado", project.lifecycle_status ?? "—"),
          kv("Secretaría / Entidad", project.secretaria ?? project.area_name ?? "—"),
          kv("Gerente asignado", project.manager_name ?? "No asignado"),

          // 2. Estado
          heading("2. Estado del Proyecto"),
          kv("Ciclo de vida", project.lifecycle_status ?? "—"),
          kv("Ejecución", pct(project.execution_pct)),
          kv("Alertas activas", String(project.active_alerts_count ?? 0)),
          ...(project.observations ? [kv("Observaciones", project.observations)] : []),

          // 3. Financiero
          heading("3. Información Financiera"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              tableRow(["Concepto", "Valor"], true),
              tableRow(["Valor total del proyecto", formatCOP(project.total_value)]),
              tableRow(["Bienes y servicios", formatCOP(project.goods_services_value)]),
              tableRow(["Cuota de gerencia", formatCOP(project.management_fee_amount)]),
              tableRow(["Valor ejecutado", formatCOP(project.executed_value)]),
              tableRow(["Valor pagado", formatCOP(project.paid_value)]),
              tableRow(["Saldo disponible", formatCOP(project.available_balance)]),
              tableRow(["% Ejecución", pct(project.execution_pct)]),
            ],
          }),

          // 4. Contrato Principal
          heading("4. Contrato Principal"),
          ...(principal
            ? [
                kv("N° contrato", principal.contract_number),
                kv("Tipo", principal.contract_type),
                kv("Estado", principal.status),
                kv("Objeto", principal.object ?? "—"),
                kv("Contratista", principal.contractor_name),
                kv("Supervisor", principal.supervisor_name ?? "—"),
                kv("Valor inicial", formatCOP(principal.initial_value)),
                kv("Valor total", formatCOP(principal.final_value ?? principal.initial_value)),
                kv("Valor pagado", formatCOP(principal.paid_value)),
                kv("Inicio", formatDate(principal.start_date)),
                kv("Terminación", formatDate(principal.end_date)),
              ]
            : [para("No se encontró contrato principal asociado.")]),

          // 5. Contratos Derivados
          heading("5. Contratos Derivados"),
          para(`Total derivados: ${derivados.length}`),
          ...(derivados.length > 0
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    tableRow(["N° Contrato", "Contratista", "Estado", "Valor Total", "Pagado"], true),
                    ...derivados.map((d) =>
                      tableRow([
                        d.contract_number,
                        d.contractor_name,
                        d.status ?? "—",
                        formatCOP(d.final_value ?? d.initial_value),
                        formatCOP(d.paid_value),
                      ])
                    ),
                  ],
                }),
              ]
            : [para("Sin contratos derivados registrados.")]),

          // 6. Seguimientos
          heading("6. Seguimientos"),
          ...((followups ?? []).length > 0
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    tableRow(["Fecha", "Período", "% Físico", "% Financiero", "Alerta"], true),
                    ...(followups ?? []).map((f) =>
                      tableRow([
                        formatDate(f.followup_date),
                        f.period_label ?? "—",
                        pct(f.physical_progress),
                        pct(f.financial_progress),
                        f.alert_level ?? "—",
                      ])
                    ),
                  ],
                }),
              ]
            : [para("Sin registros de seguimiento.")]),

          // 7. Indicadores
          heading("7. Indicadores"),
          kv("% Ejecución financiera", pct(project.execution_pct)),
          kv("Contratos derivados activos", String(derivados.filter((d) => d.status === "EN_EJECUCION").length)),
          kv("Total contratos", String(allContracts.length)),
          kv("Alertas activas", String(project.active_alerts_count ?? 0)),

          // Pie
          new Paragraph({
            children: [new TextRun({ text: "Documento generado automáticamente por EPUXUA — Sistema de Gestión Pública.", size: 18, color: "999999", italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${project.project_code}-informe.docx"`,
    },
  })
}
