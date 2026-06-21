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
  BorderStyle,
  PageBreak,
} from "docx"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import type { Interadministrativo, Contrato } from "@/types/database"
import type { Adicion, Prorroga, Suspension, Reinicio } from "@/types/modificaciones"
import type { Factura } from "@/types/facturas"
import type { FundingGroup, FundingSource } from "@/types/funding"
import type { FinancialReturn } from "@/types/financial-returns"
import type { Tarea } from "@/types/seguimiento"

// ── Roles con permiso de descarga ─────────────────────────────────────────────
const REPORT_ROLES = new Set(["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"])

// ── Formato ───────────────────────────────────────────────────────────────────

function cop(v: number | null | undefined): string {
  if (v == null) return "—"
  const d = v % 1 !== 0 ? 2 : 0
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: d, maximumFractionDigits: d,
  }).format(v)
}

function dt(s: string | null | undefined): string {
  if (!s) return "—"
  try {
    return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
  } catch { return s }
}

function str(v: string | number | null | undefined): string {
  return v == null || v === "" ? "—" : String(v)
}

// ── Helpers de construcción DOCX ──────────────────────────────────────────────

const BLUE  = "002869"
const GOLD  = "D9A520"
const LIGHT = "F0F3FF"
const GRAY  = "747783"
const WHITE = "FFFFFF"

function h1(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: BLUE })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
  })
}

function h2(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: BLUE })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  })
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

function note(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: GRAY, italics: true })],
    spacing: { after: 80 },
  })
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] })
}

function tRow(cells: string[], isHeader = false, altRow = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((text, i) => {
      const fill = isHeader ? BLUE : altRow ? LIGHT : WHITE
      const textColor = isHeader ? WHITE : "000000"
      return new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: isHeader, size: isHeader ? 18 : 20, color: textColor })],
            alignment: i > 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
          }),
        ],
        shading: { type: ShadingType.SOLID, color: fill },
        width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
      })
    }),
  })
}

function table(headers: string[], rows: string[][], emptyMsg = "Sin información registrada.") {
  if (rows.length === 0) {
    return [note(emptyMsg)]
  }
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tRow(headers, true),
        ...rows.map((r, i) => tRow(r, false, i % 2 === 1)),
      ],
    }),
    new Paragraph({ spacing: { after: 80 } }),
  ]
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ interadminId: string }> },
) {
  const { interadminId } = await params
  const numericId = parseInt(interadminId, 10)
  if (isNaN(numericId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const profile  = await getCurrentUserProfile().catch(() => null)

  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (!REPORT_ROLES.has(profile.role)) {
    return NextResponse.json({ error: "Sin permisos para generar informes" }, { status: 403 })
  }

  // ── 1. Cargar el interadministrativo ─────────────────────────────────────
  const { data: project } = await supabase
    .from("interadministrativos")
    .select("*")
    .eq("id", numericId)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 })
  }

  const p = project as Interadministrativo

  // ── 2. Cargar el resto en paralelo ────────────────────────────────────────
  const [
    { data: contratosRaw },
    { data: adicionesRaw },
    { data: prorrogasRaw },
    { data: suspensionesRaw },
    { data: reiniciosRaw },
    { data: facturasRaw },
    { data: tareasRaw },
    { data: fundingGroupsRaw },
    { data: fundingSourcesRaw },
    { data: returnsRaw },
  ] = await Promise.all([
    supabase.from("contratos").select("*").eq("id_interadministrativo", p.id_contrato).order("numero_contrato"),
    supabase.from("interadmin_adiciones"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_adicion"),
    supabase.from("interadmin_prorrogas"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_prorroga"),
    supabase.from("interadmin_suspensiones" as never).select("*").eq("interadministrativo_id", numericId).order("numero_suspension"),
    supabase.from("interadmin_reinicios"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_reinicio"),
    supabase.from("interadmin_facturas"     as never).select("*").eq("interadministrativo_id", numericId).order("fecha_remision", { ascending: false }),
    supabase.from("interadmin_tasks"        as never).select("*").eq("interadministrativo_id", numericId).is("deleted_at", null),
    supabase.from("interadmin_funding_groups"  as never).select("*").eq("interadministrativo_id", numericId).order("id"),
    supabase.from("interadmin_funding_sources" as never).select("*").eq("interadministrativo_id", numericId).order("source_name"),
    supabase.from("interadmin_financial_returns" as never).select("*").eq("interadministrativo_id", numericId).order("return_year", { ascending: false }).order("return_month", { ascending: false }),
  ])
  const contratos  = (contratosRaw  ?? []) as Contrato[]
  const adiciones  = (adicionesRaw  ?? []) as Adicion[]
  const prorrogas  = (prorrogasRaw  ?? []) as Prorroga[]
  const suspensiones = (suspensionesRaw ?? []) as Suspension[]
  const reinicios  = (reiniciosRaw  ?? []) as Reinicio[]
  const facturas   = (facturasRaw   ?? []) as Factura[]
  const tareas     = (tareasRaw     ?? []) as Tarea[]
  const fGroups    = (fundingGroupsRaw  ?? []) as FundingGroup[]
  const fSources   = (fundingSourcesRaw ?? []) as FundingSource[]
  const returns_   = (returnsRaw    ?? []) as FinancialReturn[]

  const derivados = contratos.filter((c) => c.tipo_contrato === "DERIVADO")

  // ── KPIs facturación ──────────────────────────────────────────────────────
  const facturadoTotal   = facturas.reduce((s, f) => s + Number(f.valor_cobrado ?? 0), 0)
  const ingresadoTotal   = facturas.reduce((s, f) => s + Number(f.valor_ingresado ?? 0), 0)
  const pendienteTotal   = Math.max(0, facturadoTotal - ingresadoTotal)
  const facturasPend     = facturas.filter((f) => f.estado === "FACTURADO").length

  // ── KPIs tareas ──────────────────────────────────────────────────────────
  const tareasCompletadas = tareas.filter((t) => t.status === "COMPLETADA").length
  const tareasPendientes  = tareas.filter((t) => t.status !== "COMPLETADA").length
  const tareasVencidas    = tareas.filter((t) => {
    if (t.status === "COMPLETADA") return false
    return new Date(t.fecha_compromiso + "T00:00:00") < new Date()
  })

  // ── KPIs rendimientos ────────────────────────────────────────────────────
  const rendimientosTotal = returns_.reduce((s, r) => s + Number(r.gross_return_value ?? 0), 0)

  // ── Alertas automáticas ───────────────────────────────────────────────────
  const alertas: string[] = []
  if (p.fecha_terminacion) {
    const dias = Math.ceil((new Date(p.fecha_terminacion).getTime() - Date.now()) / 86400000)
    if (dias >= 0 && dias <= 30) alertas.push(`⚠ Contrato vence en ${dias} días (${dt(p.fecha_terminacion)})`)
    if (dias < 0) alertas.push(`🔴 Contrato VENCIDO hace ${Math.abs(dias)} días (${dt(p.fecha_terminacion)})`)
  }
  if (facturasPend > 0) alertas.push(`⚠ ${facturasPend} factura(s) pendiente(s) de cobro`)
  if (tareasVencidas.length > 0) alertas.push(`⚠ ${tareasVencidas.length} tarea(s) vencida(s) sin completar`)
  const derivadosSinFecha = derivados.filter((d) => !d.fecha_terminacion)
  if (derivadosSinFecha.length > 0) alertas.push(`ℹ ${derivadosSinFecha.length} contrato(s) derivado(s) sin fecha de terminación`)

  // ── Nombre del mes ──────────────────────────────────────────────────────
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  // ── Documento ─────────────────────────────────────────────────────────────
  const generatedAt = dt(new Date().toISOString())

  const doc = new Document({
    creator: profile.full_name ?? profile.email ?? "EPUXUA",
    title: `Informe Contrato ${p.id_contrato}`,
    description: "Informe ejecutivo generado automáticamente por EPUXUA",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
          },
        },
        children: [

          // ── PORTADA ──────────────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: "EPUXUA E.I.C.E.", bold: true, size: 56, color: BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "INFORME EJECUTIVO — CONTRATO INTERADMINISTRATIVO", bold: true, size: 32, color: GOLD })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Contrato N° ${p.id_contrato}`, bold: true, size: 40, color: BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: p.objeto_contrato ?? "Sin objeto registrado", size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Estado: ${p.estado}`, bold: true, size: 24, color: GOLD })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Fecha de generación: ${generatedAt}`, size: 20, color: GRAY })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generado por: ${profile.full_name ?? profile.email ?? "Usuario"}`, size: 20, color: GRAY })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          pageBreak(),

          // ── 1. INFORMACIÓN GENERAL ────────────────────────────────────────
          h1("1. Información General"),
          kv("Número de contrato",   str(p.id_contrato)),
          kv("Objeto",               str(p.objeto_contrato)),
          kv("Secretaría / Entidad", str(p.secretaria)),
          kv("Categoría",            str(p.categoria)),
          kv("Clase de contrato",    str(p.clase_contrato)),
          kv("Modalidad selección",  str(p.modalidad_seleccion)),
          kv("Área responsable",     str(p.area_responsable)),
          kv("Estado",               str(p.estado)),
          kv("Supervisión",          str(p.supervision)),
          kv("Fecha suscripción",    dt(p.fecha_suscripcion)),
          kv("Fecha inicio ejecución", dt(p.fecha_inicio_ejecucion)),
          kv("Fecha terminación",    dt(p.fecha_terminacion)),
          kv("Plazo ejecución inicial", str(p.plazo_ejecucion_inicial)),
          kv("Avance físico",        p.avance_fisico_pct != null ? `${p.avance_fisico_pct}%` : "—"),
          kv("Observaciones",        str(p.observaciones)),

          pageBreak(),

          // ── 2. RESUMEN FINANCIERO ─────────────────────────────────────────
          h1("2. Resumen Financiero"),
          ...table(
            ["Concepto", "Valor"],
            [
              ["Valor inicial del contrato",      cop(p.valor_inicial)],
              ["Adiciones",                        cop(p.adicion)],
              ["Total contrato",                   cop(p.total_contrato)],
              ["Cuota administración inicial",     cop(p.cuota_admin_inicial)],
              ["Adición cuota administración",     cop(p.adicion_cuota_admin)],
              ["Total cuota administración",       cop(p.total_cuota_admin)],
              ["Bolsa gerencia inicial",           cop(p.bolsa_gerencia_inicial)],
              ["Adición bolsa mandato",            cop(p.adicion_bolsa_mandato)],
              ["Total bolsa mandato",              cop(p.total_bolsa_mandato)],
              ["Valor pendiente de cobrar",        cop(p.valor_pendiente_cobrar)],
              ["Vigencias futuras",                cop(p.vigencias_futuras)],
              ["% Cuota gerencia",                 p.pct_cuota_gerencia != null ? `${p.pct_cuota_gerencia}%` : "—"],
            ],
          ),

          pageBreak(),

          // ── 3. MODIFICACIONES CONTRACTUALES ──────────────────────────────
          h1("3. Modificaciones Contractuales"),

          h2("3.1 Adiciones"),
          ...table(
            ["N°", "Fecha", "Valor Total", "Cuota Gerencia", "Bienes y Servicios", "Número RP", "Motivo"],
            adiciones.map((a) => [
              str(a.numero_adicion),
              dt(a.fecha_adicion),
              cop(a.valor_total),
              cop(a.valor_cuota_gerencia),
              cop(a.valor_bienes_servicios),
              str(a.numero_rp),
              str(a.motivo),
            ]),
            "Sin adiciones registradas.",
          ),

          h2("3.2 Prórrogas"),
          ...table(
            ["N°", "Fecha Suscripción", "Nueva Fecha Terminación", "Plazo", "Justificación"],
            prorrogas.map((pr) => [
              str(pr.numero_prorroga),
              dt(pr.fecha_suscripcion),
              dt(pr.nueva_fecha_terminacion),
              str(pr.plazo_prorroga),
              str(pr.justificacion),
            ]),
            "Sin prórrogas registradas.",
          ),

          h2("3.3 Suspensiones"),
          ...table(
            ["N°", "Inicio", "Fin", "Plazo", "Motivo"],
            suspensiones.map((s) => [
              str(s.numero_suspension),
              dt(s.inicio_suspension),
              dt(s.fin_suspension),
              str(s.plazo_suspension),
              str(s.motivo),
            ]),
            "Sin suspensiones registradas.",
          ),

          h2("3.4 Reinicios"),
          ...table(
            ["N°", "Fecha Reinicio", "Fecha Suscripción", "Motivo"],
            reinicios.map((r) => [
              str(r.numero_reinicio),
              dt(r.fecha_reinicio),
              dt(r.fecha_suscripcion),
              str(r.motivo),
            ]),
            "Sin reinicios registrados.",
          ),

          pageBreak(),

          // ── 4. FUENTES DE FINANCIACIÓN ────────────────────────────────────
          h1("4. Fuentes de Financiación"),
          ...(fGroups.length === 0
            ? [note("Sin información registrada.")]
            : fGroups.flatMap((g) => {
                const sources = fSources.filter((s) => s.funding_group_id === g.id)
                return [
                  h2(`Grupo: ${g.group_name} — Total: ${cop(g.total_value)}`),
                  ...table(
                    ["Fuente", "Valor Aportado", "Participación %"],
                    sources.map((s) => [
                      str(s.source_name),
                      cop(s.source_value),
                      `${Number(s.participation_percentage ?? 0).toFixed(2)}%`,
                    ]),
                    "Sin fuentes registradas para este grupo.",
                  ),
                ]
              })),

          pageBreak(),

          // ── 5. CONTRATOS DERIVADOS ────────────────────────────────────────
          h1("5. Contratos Derivados"),
          kv("Total derivados",      String(derivados.length)),
          kv("En ejecución",         String(derivados.filter((d) => d.estado === "EN EJECUCIÓN").length)),
          kv("Terminados",           String(derivados.filter((d) => d.estado === "TERMINADO" || d.estado === "LIQUIDADO").length)),
          kv("Valor total derivados", cop(derivados.reduce((s, d) => s + Number(d.valor_final ?? d.valor_inicial ?? 0), 0))),
          new Paragraph({ spacing: { after: 120 } }),
          ...table(
            ["N° Contrato", "Objeto", "Contratista", "Estado", "Valor Final", "Inicio", "Terminación"],
            derivados.map((d) => [
              str(d.numero_contrato),
              (d.objeto_contrato ?? "—").slice(0, 60) + ((d.objeto_contrato?.length ?? 0) > 60 ? "…" : ""),
              str(d.contratista),
              str(d.estado),
              cop(d.valor_final ?? d.valor_inicial),
              dt(d.fecha_inicio),
              dt(d.fecha_terminacion),
            ]),
            "Sin contratos derivados registrados.",
          ),

          pageBreak(),

          // ── 6. FACTURACIÓN Y RECAUDO ──────────────────────────────────────
          h1("6. Facturación y Recaudo"),
          kv("Total facturado",          cop(facturadoTotal)),
          kv("Total recaudado",          cop(ingresadoTotal)),
          kv("Pendiente de recaudo",     cop(pendienteTotal)),
          kv("Facturas pendientes",      String(facturasPend)),
          new Paragraph({ spacing: { after: 120 } }),
          ...table(
            ["N° Factura", "Fecha Remisión", "Destino", "Valor Cobrado", "Valor Ingresado", "Estado"],
            facturas.map((f) => [
              str(f.numero_factura),
              dt(f.fecha_remision),
              f.destino === "BIENES_SERVICIOS" ? "Bienes y Servicios" : "Cuota Gerencia",
              cop(f.valor_cobrado),
              cop(f.valor_ingresado),
              str(f.estado),
            ]),
            "Sin facturas registradas.",
          ),

          pageBreak(),

          // ── 7. RENDIMIENTOS FINANCIEROS ───────────────────────────────────
          h1("7. Rendimientos Financieros"),
          kv("Total acumulado", cop(rendimientosTotal)),
          kv("Registros",       String(returns_.length)),
          new Paragraph({ spacing: { after: 120 } }),
          ...table(
            ["Mes", "Año", "Origen (grupo)", "Valor Rendimiento", "Estado Devolución"],
            returns_.map((r) => {
              const grupo = fGroups.find((g) => g.id === r.funding_group_id)
              return [
                MESES[r.return_month - 1] ?? str(r.return_month),
                str(r.return_year),
                str(grupo?.group_name),
                cop(r.gross_return_value),
                str(r.repayment_status),
              ]
            }),
            "Sin rendimientos financieros registrados.",
          ),

          pageBreak(),

          // ── 8. SEGUIMIENTO ────────────────────────────────────────────────
          h1("8. Seguimiento"),
          kv("Tareas totales",     String(tareas.length)),
          kv("Tareas completadas", String(tareasCompletadas)),
          kv("Tareas pendientes",  String(tareasPendientes)),
          kv("Tareas vencidas",    String(tareasVencidas.length)),
          new Paragraph({ spacing: { after: 120 } }),
          ...table(
            ["Tarea", "Estado", "Fecha Compromiso", "Prioridad", "Responsable"],
            tareas.map((t) => [
              str(t.nombre),
              str(t.status),
              dt(t.fecha_compromiso),
              str(t.prioridad),
              str(t.responsable),
            ]),
            "Sin tareas registradas.",
          ),

          pageBreak(),

          // ── 9. ALERTAS AUTOMÁTICAS ────────────────────────────────────────
          h1("9. Alertas Automáticas"),
          ...(alertas.length > 0
            ? alertas.map((a) =>
                new Paragraph({
                  children: [new TextRun({ text: a, size: 22, bold: a.startsWith("🔴") })],
                  spacing: { after: 100 },
                })
              )
            : [note("Sin alertas detectadas.")]),

          pageBreak(),

          // ── 10. ENLACES ───────────────────────────────────────────────────
          h1("10. Documentación y Enlac es"),
          kv("Enlace SECOP II",      str(p.link_secop)),
          kv("Enlace Documentación", str(p.link_documentacion)),

          // ── PIE ───────────────────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({
              text: `Documento generado automáticamente por EPUXUA E.I.C.E. — ${generatedAt} — Usuario: ${profile.full_name ?? profile.email}`,
              size: 18, color: GRAY, italics: true,
            })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const filename = `INFORME_CONTRATO_${p.id_contrato.replace(/[/\\?%*:|"<>]/g, "-")}.docx`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
