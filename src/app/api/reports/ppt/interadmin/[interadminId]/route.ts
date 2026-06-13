import { NextRequest, NextResponse } from "next/server"
import PptxGenJS from "pptxgenjs"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import type { Interadministrativo, Contrato } from "@/types/database"
import type { Adicion, Prorroga, Suspension, Reinicio } from "@/types/modificaciones"
import type { Factura } from "@/types/facturas"
import type { FundingGroup, FundingSource } from "@/types/funding"
import type { FinancialReturn } from "@/types/financial-returns"
import type { Tarea } from "@/types/seguimiento"

// ── Permisos ──────────────────────────────────────────────────────────────────
const REPORT_ROLES = new Set(["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"])

// ── Paleta corporativa ────────────────────────────────────────────────────────
const BLUE      = "002869"
const GOLD      = "D9A520"
const WHITE     = "FFFFFF"
const LIGHT_BG  = "F0F3FF"
const DARK_TEXT = "151C27"
const GRAY_TEXT = "747783"
const GREEN     = "10B981"
const RED       = "EF4444"
const AMBER     = "D97706"

// ── Formateo ──────────────────────────────────────────────────────────────────
function cop(v: number | null | undefined): string {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(v)
}
function pct(v: number | null | undefined): string {
  return `${Number(v ?? 0).toFixed(1)}%`
}
function dt(s: string | null | undefined): string {
  if (!s) return "—"
  try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return s }
}
function str(v: string | number | null | undefined): string {
  return v == null || v === "" ? "—" : String(v)
}
function short(s: string | null | undefined, n = 40): string {
  if (!s) return "—"
  return s.length > n ? s.slice(0, n) + "…" : s
}

// ── Helpers de diapositiva ────────────────────────────────────────────────────

function slideHeader(prs: PptxGenJS, slide: ReturnType<PptxGenJS["addSlide"]>, title: string, num: number) {
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.9, fill: { color: BLUE },
  })
  slide.addText(title, {
    x: 0.4, y: 0.12, w: 8.4, h: 0.66,
    fontSize: 22, bold: true, color: WHITE,
  })
  slide.addText(String(num), {
    x: 9.0, y: 0.12, w: 0.7, h: 0.66,
    fontSize: 14, color: GOLD, align: "right", bold: true,
  })
  // gold accent line
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0.9, w: 10, h: 0.06, fill: { color: GOLD },
  })
}

type TableCell = { text: string; options?: Record<string, unknown> }

function addStyledTable(
  slide: ReturnType<PptxGenJS["addSlide"]>,
  headers: string[],
  rows: string[][],
  x: number, y: number, w: number,
  colW?: number[],
  emptyMsg = "Sin información registrada.",
) {
  if (rows.length === 0) {
    slide.addText(emptyMsg, {
      x, y, w, h: 0.45,
      fontSize: 11, color: GRAY_TEXT, italic: true,
    })
    return
  }
  const headerRow: TableCell[] = headers.map((h) => ({
    text: h,
    options: { bold: true, color: WHITE, fill: { color: BLUE }, align: "center" },
  }))
  const dataRows: TableCell[][] = rows.map((row, ri) =>
    row.map((cell) => ({
      text: cell,
      options: { fill: { color: ri % 2 === 0 ? WHITE : LIGHT_BG }, color: DARK_TEXT, align: "center" },
    }))
  )
  slide.addTable([headerRow, ...dataRows], {
    x, y, w,
    colW: colW,
    rowH: 0.36,
    border: { type: "solid", pt: 0.5, color: "DDEEFF" },
    fontFace: "Calibri",
    fontSize: 10,
    color: DARK_TEXT,
    autoPage: false,
  })
}

function kpiCard(
  prs: PptxGenJS,
  slide: ReturnType<PptxGenJS["addSlide"]>,
  label: string, value: string,
  x: number, y: number, w = 2.2, h = 1.1,
  accent = BLUE,
) {
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: WHITE },
    line: { color: accent, width: 2 },
    rectRadius: 0.08,
  })
  slide.addText(label, {
    x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.32,
    fontSize: 9, bold: true, color: GRAY_TEXT,
  })
  slide.addText(value, {
    x: x + 0.1, y: y + 0.42, w: w - 0.2, h: 0.56,
    fontSize: 11, bold: true, color: accent, wrap: true,
  })
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
  if (!REPORT_ROLES.has(profile.role)) {
    return NextResponse.json({ error: "Sin permisos para generar presentaciones" }, { status: 403 })
  }

  // ── 1. Cargar interadministrativo ─────────────────────────────────────────
  const { data: project } = await supabase
    .from("interadministrativos").select("*").eq("id", numericId).maybeSingle()

  if (!project) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 })
  const p = project as Interadministrativo

  // ── 2. Cargar resto en paralelo ───────────────────────────────────────────
  const [
    { data: contratosRaw },
    { data: adicionesRaw },
    { data: prorrogasRaw },
    { data: suspensionesRaw },
    { data: reiniciosRaw },
    { data: facturasRaw },
    { data: tareasRaw },
    { data: fGroupsRaw },
    { data: fSourcesRaw },
    { data: returnsRaw },
  ] = await Promise.all([
    supabase.from("contratos").select("*").eq("id_interadministrativo", p.id_contrato).order("numero_contrato"),
    supabase.from("interadmin_adiciones"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_adicion"),
    supabase.from("interadmin_prorrogas"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_prorroga"),
    supabase.from("interadmin_suspensiones" as never).select("*").eq("interadministrativo_id", numericId).order("numero_suspension"),
    supabase.from("interadmin_reinicios"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_reinicio"),
    supabase.from("interadmin_facturas"     as never).select("*").eq("interadministrativo_id", numericId).order("fecha_remision", { ascending: false }),
    supabase.from("interadmin_tasks"        as never).select("*").eq("interadministrativo_id", numericId),
    supabase.from("interadmin_funding_groups"  as never).select("*").eq("interadministrativo_id", numericId).order("id"),
    supabase.from("interadmin_funding_sources" as never).select("*").eq("interadministrativo_id", numericId).order("source_name"),
    supabase.from("interadmin_financial_returns" as never).select("*").eq("interadministrativo_id", numericId).order("return_year", { ascending: false }).order("return_month", { ascending: false }),
  ])

  const contratos   = (contratosRaw   ?? []) as Contrato[]
  const adiciones   = (adicionesRaw   ?? []) as Adicion[]
  const prorrogas   = (prorrogasRaw   ?? []) as Prorroga[]
  const suspensiones = (suspensionesRaw ?? []) as Suspension[]
  const reinicios   = (reiniciosRaw   ?? []) as Reinicio[]
  const facturas    = (facturasRaw    ?? []) as Factura[]
  const tareas      = (tareasRaw      ?? []) as Tarea[]
  const fGroups     = (fGroupsRaw     ?? []) as FundingGroup[]
  const fSources    = (fSourcesRaw    ?? []) as FundingSource[]
  const returns_    = (returnsRaw     ?? []) as FinancialReturn[]

  const derivados = contratos.filter((c) => c.tipo_contrato === "DERIVADO")

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const facturadoTotal = facturas.reduce((s, f) => s + Number(f.valor_cobrado ?? 0), 0)
  const ingresadoTotal = facturas.reduce((s, f) => s + Number(f.valor_ingresado ?? 0), 0)
  const pendienteTotal = Math.max(0, facturadoTotal - ingresadoTotal)
  const rendTotal      = returns_.reduce((s, r) => s + Number(r.gross_return_value ?? 0), 0)
  const tareasComp     = tareas.filter((t) => t.status === "COMPLETADA").length
  const tareasPend     = tareas.filter((t) => t.status === "PENDIENTE").length
  const tareasProc     = tareas.filter((t) => t.status === "EN_PROCESO").length
  const tareasVenc     = tareas.filter(
    (t) => t.status !== "COMPLETADA" && new Date(t.fecha_compromiso + "T00:00:00") < new Date(),
  ).length

  // días restantes
  let diasRestantes = "—"
  if (p.fecha_terminacion) {
    const d = Math.ceil((new Date(p.fecha_terminacion).getTime() - Date.now()) / 86400000)
    diasRestantes = d < 0 ? `Vencido (${Math.abs(d)}d)` : `${d} días`
  }

  // Alertas automáticas
  const alertas: Array<{ text: string; level: "danger" | "warning" | "info" }> = []
  if (p.fecha_terminacion) {
    const d = Math.ceil((new Date(p.fecha_terminacion).getTime() - Date.now()) / 86400000)
    if (d < 0) alertas.push({ text: `Contrato VENCIDO hace ${Math.abs(d)} días (${dt(p.fecha_terminacion)})`, level: "danger" })
    else if (d <= 30) alertas.push({ text: `Contrato vence en ${d} días (${dt(p.fecha_terminacion)})`, level: "warning" })
  }
  const factPend = facturas.filter((f) => f.estado === "FACTURADO").length
  if (factPend > 0) alertas.push({ text: `${factPend} factura(s) pendiente(s) de cobro`, level: "warning" })
  if (tareasVenc > 0) alertas.push({ text: `${tareasVenc} tarea(s) vencida(s) sin completar`, level: "danger" })
  const derivSinFecha = derivados.filter((d) => !d.fecha_terminacion).length
  if (derivSinFecha > 0) alertas.push({ text: `${derivSinFecha} derivado(s) sin fecha de terminación`, level: "info" })
  if (alertas.length === 0) alertas.push({ text: "Sin alertas detectadas. Contrato en estado normal.", level: "info" })

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  const generatedAt = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })

  // ── Presentación ──────────────────────────────────────────────────────────
  const prs = new PptxGenJS()
  prs.layout = "LAYOUT_16x9"
  prs.author = profile.full_name ?? "EPUXUA"
  prs.title  = `Presentación Contrato ${p.id_contrato}`
  prs.company = "EPUXUA E.I.C.E."

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 1 — PORTADA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: BLUE }

    // Franja gold inferior
    s.addShape(prs.ShapeType.rect, { x: 0, y: 5.2, w: 10, h: 0.43, fill: { color: GOLD } })

    s.addText("EPUXUA E.I.C.E.", {
      x: 0.5, y: 0.7, w: 9, h: 0.7, fontSize: 36, bold: true, color: GOLD, align: "center",
    })
    s.addText("PRESENTACIÓN EJECUTIVA", {
      x: 0.5, y: 1.5, w: 9, h: 0.4, fontSize: 16, bold: true, color: "ADBDCC", align: "center", charSpacing: 4,
    })
    s.addText(`CONTRATO N° ${p.id_contrato}`, {
      x: 0.5, y: 2.1, w: 9, h: 0.7, fontSize: 28, bold: true, color: WHITE, align: "center",
    })
    s.addText(short(p.objeto_contrato, 100), {
      x: 0.8, y: 2.9, w: 8.4, h: 1.0, fontSize: 14, color: "CCDAEE", align: "center", wrap: true,
    })
    s.addText(`Estado: ${p.estado}`, {
      x: 0.5, y: 4.05, w: 9, h: 0.4, fontSize: 13, bold: true, color: GOLD, align: "center",
    })
    s.addText(`${generatedAt}  ·  ${profile.full_name ?? profile.email ?? "Usuario"}`, {
      x: 0.5, y: 5.25, w: 9, h: 0.33, fontSize: 11, color: BLUE, align: "center", bold: true,
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 2 — RESUMEN EJECUTIVO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: LIGHT_BG }
    slideHeader(prs, s, "Resumen Ejecutivo", 2)

    const kpiData = [
      { label: "Estado",             value: p.estado,               accent: BLUE  },
      { label: "Valor Total",        value: cop(p.total_contrato),   accent: BLUE  },
      { label: "Bienes y Servicios", value: cop(p.bolsa_gerencia_inicial), accent: "345BAB" },
      { label: "Cuota Gerencia",     value: cop(p.total_cuota_admin), accent: GOLD  },
      { label: "Avance Físico",      value: p.avance_fisico_pct != null ? `${p.avance_fisico_pct}%` : "—", accent: GREEN },
      { label: "Días Restantes",     value: diasRestantes,           accent: diasRestantes.includes("Venc") ? RED : AMBER },
    ]

    const cols = 3
    kpiData.forEach(({ label, value, accent }, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      kpiCard(prs, s, label, str(value), 0.45 + col * 3.1, 1.1 + row * 1.35, 2.9, 1.2, accent)
    })

    // Barra avance físico
    const avPct = Math.min(100, Math.max(0, Number(p.avance_fisico_pct ?? 0)))
    s.addText(`Avance físico: ${avPct}%`, {
      x: 0.45, y: 3.85, w: 9.1, h: 0.35, fontSize: 11, bold: true, color: DARK_TEXT,
    })
    s.addShape(prs.ShapeType.rect, { x: 0.45, y: 4.22, w: 9.1, h: 0.3, fill: { color: "D1DAE8" } })
    if (avPct > 0) {
      s.addShape(prs.ShapeType.rect, {
        x: 0.45, y: 4.22, w: 9.1 * (avPct / 100), h: 0.3,
        fill: { color: avPct >= 80 ? GREEN : avPct >= 50 ? GOLD : RED },
      })
    }
    s.addText(`Secretaría: ${str(p.secretaria)}  ·  Supervisión: ${str(p.supervision)}`, {
      x: 0.45, y: 4.7, w: 9.1, h: 0.4, fontSize: 10, color: GRAY_TEXT,
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 3 — INFORMACIÓN CONTRACTUAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: WHITE }
    slideHeader(prs, s, "Información Contractual", 3)

    // Objeto (full width)
    s.addShape(prs.ShapeType.roundRect, { x: 0.4, y: 1.05, w: 9.2, h: 1.0, fill: { color: LIGHT_BG }, line: { color: BLUE, width: 1 }, rectRadius: 0.05 })
    s.addText("OBJETO DEL CONTRATO", { x: 0.55, y: 1.1, w: 9, h: 0.28, fontSize: 8, bold: true, color: GRAY_TEXT, charSpacing: 2 })
    s.addText(short(p.objeto_contrato, 200), { x: 0.55, y: 1.4, w: 9, h: 0.6, fontSize: 11, color: DARK_TEXT, wrap: true })

    const fields = [
      ["Secretaría / Entidad",  str(p.secretaria)],
      ["Categoría",             str(p.categoria)],
      ["Clase de contrato",     str(p.clase_contrato)],
      ["Modalidad selección",   str(p.modalidad_seleccion)],
      ["Área responsable",      str(p.area_responsable)],
      ["Supervisión",           str(p.supervision)],
      ["Fecha suscripción",     dt(p.fecha_suscripcion)],
      ["Fecha inicio ejecución",dt(p.fecha_inicio_ejecucion)],
      ["Fecha terminación",     dt(p.fecha_terminacion)],
      ["Plazo inicial",         str(p.plazo_ejecucion_inicial)],
    ]

    fields.forEach(([label, value], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x   = 0.4 + col * 4.75
      const y   = 2.2 + row * 0.65
      s.addText(`${label}:`, { x, y, w: 1.9, h: 0.35, fontSize: 9, bold: true, color: GRAY_TEXT })
      s.addText(value, { x: x + 1.95, y, w: 2.55, h: 0.35, fontSize: 10, color: DARK_TEXT })
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 4 — ESTADO FINANCIERO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: LIGHT_BG }
    slideHeader(prs, s, "Estado Financiero", 4)

    const fin = [
      { label: "Valor Inicial",        value: cop(p.valor_inicial),          accent: BLUE  },
      { label: "Adiciones",            value: cop(p.adicion),                accent: "5B8DD9" },
      { label: "Total Contrato",       value: cop(p.total_contrato),         accent: BLUE  },
      { label: "Total Cuota Admin",    value: cop(p.total_cuota_admin),      accent: GOLD  },
      { label: "Total Bolsa Mandato",  value: cop(p.total_bolsa_mandato),    accent: GOLD  },
      { label: "Pend. de Cobrar",      value: cop(p.valor_pendiente_cobrar), accent: RED   },
      { label: "Facturado",            value: cop(facturadoTotal),            accent: "5B8DD9" },
      { label: "Recaudado",            value: cop(ingresadoTotal),            accent: GREEN },
      { label: "Pendiente Recaudo",    value: cop(pendienteTotal),            accent: pendienteTotal > 0 ? RED : GREEN },
    ]

    fin.forEach(({ label, value, accent }, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      kpiCard(prs, s, label, value, 0.3 + col * 3.15, 1.05 + row * 1.3, 3.0, 1.2, accent)
    })

    s.addText(`% Cuota gerencia: ${p.pct_cuota_gerencia != null ? `${p.pct_cuota_gerencia}%` : "—"}  ·  Vigencias futuras: ${cop(p.vigencias_futuras)}`, {
      x: 0.3, y: 5.0, w: 9.4, h: 0.38, fontSize: 10, color: GRAY_TEXT, italic: true,
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 5 — FUENTES DE FINANCIACIÓN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: WHITE }
    slideHeader(prs, s, "Fuentes de Financiación", 5)

    if (fSources.length === 0) {
      s.addText("Sin fuentes de financiación registradas.", {
        x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 14, color: GRAY_TEXT, italic: true, align: "center",
      })
    } else {
      // Tabla
      const tableRows = fSources.slice(0, 12).map((src) => [
        short(src.source_name, 30),
        cop(src.source_value),
        `${Number(src.participation_percentage ?? 0).toFixed(2)}%`,
        str((fGroups.find((g) => g.id === src.funding_group_id))?.group_name),
      ])
      addStyledTable(s, ["Fuente", "Valor Aportado", "Participación %", "Grupo"], tableRows, 0.4, 1.05, 5.8, [2.0, 1.8, 1.2, 0.8])

      // Mini chart (participación — barras horizontales)
      const totalVal = fSources.reduce((a, b) => a + b.source_value, 0)
      const CHART_COLORS = [BLUE, GOLD, GREEN, "8B5CF6", RED, "F59E0B", "06B6D4"]
      const topSrc = fSources.slice(0, 6)
      topSrc.forEach((src, i) => {
        const barW = totalVal > 0 ? (src.source_value / totalVal) * 3.0 : 0
        const y    = 1.15 + i * 0.65
        s.addText(short(src.source_name, 20), {
          x: 6.3, y, w: 1.8, h: 0.38, fontSize: 9, color: DARK_TEXT, align: "right",
        })
        s.addShape(prs.ShapeType.rect, { x: 8.15, y: y + 0.05, w: 3.0, h: 0.28, fill: { color: "E2E8F0" } })
        if (barW > 0) {
          s.addShape(prs.ShapeType.rect, {
            x: 8.15, y: y + 0.05, w: Math.min(barW, 3.0), h: 0.28,
            fill: { color: CHART_COLORS[i % CHART_COLORS.length] },
          })
        }
        s.addText(`${Number(src.participation_percentage).toFixed(1)}%`, {
          x: 9.25, y, w: 0.7, h: 0.38, fontSize: 8, color: GRAY_TEXT,
        })
      })
      s.addText("Participación por fuente", {
        x: 6.3, y: 0.92, w: 3.5, h: 0.28, fontSize: 9, bold: true, color: BLUE,
      })
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 6 — CONTRATOS DERIVADOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: LIGHT_BG }
    slideHeader(prs, s, "Contratos Derivados", 6)

    const activos    = derivados.filter((d) => d.estado === "EN EJECUCIÓN").length
    const terminados = derivados.filter((d) => d.estado === "TERMINADO" || d.estado === "LIQUIDADO").length
    const valTotal   = derivados.reduce((a, d) => a + Number(d.valor_final ?? d.valor_inicial ?? 0), 0)

    const kd = [
      { label: "Total Derivados",    value: String(derivados.length), accent: BLUE  },
      { label: "En Ejecución",       value: String(activos),          accent: GREEN },
      { label: "Terminados",         value: String(terminados),       accent: GRAY_TEXT },
      { label: "Valor Contratado",   value: cop(valTotal),            accent: GOLD  },
    ]
    kd.forEach(({ label, value, accent }, i) => {
      kpiCard(prs, s, label, value, 0.35 + i * 2.35, 1.05, 2.2, 1.0, accent)
    })

    const tableRows = derivados.slice(0, 8).map((d) => [
      str(d.numero_contrato),
      short(d.objeto_contrato, 32),
      str(d.contratista).slice(0, 20),
      str(d.estado),
      cop(d.valor_final ?? d.valor_inicial),
      dt(d.fecha_terminacion),
    ])
    addStyledTable(s, ["N° Contrato", "Objeto", "Contratista", "Estado", "Valor", "Terminación"],
      tableRows, 0.35, 2.2, 9.3, [1.4, 2.5, 1.7, 1.3, 1.5, 0.9])

    if (derivados.length === 0) {
      s.addText("Sin contratos derivados registrados.", {
        x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, color: GRAY_TEXT, italic: true, align: "center",
      })
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 7 — MODIFICACIONES CONTRACTUALES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: WHITE }
    slideHeader(prs, s, "Modificaciones Contractuales", 7)

    const modKpis = [
      { label: "Adiciones",    value: String(adiciones.length),   accent: BLUE  },
      { label: "Prórrogas",    value: String(prorrogas.length),   accent: GOLD  },
      { label: "Suspensiones", value: String(suspensiones.length), accent: AMBER },
      { label: "Reinicios",    value: String(reinicios.length),   accent: GREEN },
    ]
    modKpis.forEach(({ label, value, accent }, i) => {
      kpiCard(prs, s, label, value, 0.35 + i * 2.35, 1.0, 2.2, 1.0, accent)
    })

    // Tabla cronológica de adiciones
    if (adiciones.length > 0) {
      s.addText("Adiciones", { x: 0.35, y: 2.15, w: 4.6, h: 0.3, fontSize: 11, bold: true, color: BLUE })
      addStyledTable(s, ["N°", "Fecha", "Valor Total", "Motivo"],
        adiciones.slice(0, 5).map((a) => [
          str(a.numero_adicion), dt(a.fecha_adicion), cop(a.valor_total), short(a.motivo, 22),
        ]),
        0.35, 2.48, 4.6, [0.4, 1.2, 1.5, 1.5])
    }
    // Prórrogas
    if (prorrogas.length > 0) {
      s.addText("Prórrogas", { x: 5.1, y: 2.15, w: 4.55, h: 0.3, fontSize: 11, bold: true, color: GOLD })
      addStyledTable(s, ["N°", "F. Suscripción", "Nueva Terminación", "Plazo"],
        prorrogas.slice(0, 5).map((pr) => [
          str(pr.numero_prorroga), dt(pr.fecha_suscripcion), dt(pr.nueva_fecha_terminacion), short(pr.plazo_prorroga, 14),
        ]),
        5.1, 2.48, 4.55, [0.4, 1.2, 1.6, 1.35])
    }
    if (adiciones.length === 0 && prorrogas.length === 0 && suspensiones.length === 0 && reinicios.length === 0) {
      s.addText("Sin modificaciones contractuales registradas.", {
        x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, color: GRAY_TEXT, italic: true, align: "center",
      })
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 8 — RENDIMIENTOS FINANCIEROS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: LIGHT_BG }
    slideHeader(prs, s, "Rendimientos Financieros", 8)

    const pendDevol = returns_.filter((r) => r.repayment_status === "PENDIENTE").length
    const parciales = returns_.filter((r) => r.repayment_status === "PARCIAL").length
    const devueltos = returns_.filter((r) => r.repayment_status === "DEVUELTO").length

    const rdKpis = [
      { label: "Acumulado Total",    value: cop(rendTotal),       accent: BLUE  },
      { label: "Pendientes devolución", value: String(pendDevol), accent: RED   },
      { label: "Parciales",          value: String(parciales),    accent: AMBER },
      { label: "Devueltos",          value: String(devueltos),    accent: GREEN },
    ]
    rdKpis.forEach(({ label, value, accent }, i) => {
      kpiCard(prs, s, label, value, 0.35 + i * 2.35, 1.0, 2.2, 1.0, accent)
    })

    addStyledTable(s, ["Mes", "Año", "Valor Rendimiento", "Estado Devolución"],
      returns_.slice(0, 8).map((r) => [
        MESES[r.return_month - 1] ?? str(r.return_month),
        str(r.return_year),
        cop(r.gross_return_value),
        str(r.repayment_status),
      ]),
      0.35, 2.2, 9.3, [1.2, 0.8, 3.0, 4.3],
      "Sin rendimientos financieros registrados.",
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 9 — SEGUIMIENTO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: WHITE }
    slideHeader(prs, s, "Seguimiento de Tareas", 9)

    const sgKpis = [
      { label: "Pendientes",  value: String(tareasPend), accent: AMBER },
      { label: "En Proceso",  value: String(tareasProc), accent: BLUE  },
      { label: "Completadas", value: String(tareasComp), accent: GREEN },
      { label: "Vencidas",    value: String(tareasVenc), accent: RED   },
    ]
    sgKpis.forEach(({ label, value, accent }, i) => {
      kpiCard(prs, s, label, value, 0.35 + i * 2.35, 1.0, 2.2, 1.0, accent)
    })

    const tareasDisplay = tareas
      .sort((a, b) => (a.status === "COMPLETADA" ? 1 : -1) - (b.status === "COMPLETADA" ? 1 : -1))
      .slice(0, 8)

    addStyledTable(s, ["Tarea", "Estado", "Prioridad", "Responsable", "Fecha Compromiso"],
      tareasDisplay.map((t) => [
        short(t.nombre, 30),
        str(t.status),
        str(t.prioridad),
        short(t.responsable, 18),
        dt(t.fecha_compromiso),
      ]),
      0.35, 2.2, 9.3, [2.8, 1.3, 1.1, 1.8, 2.3],
      "Sin tareas registradas.",
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 10 — ALERTAS Y RIESGOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: LIGHT_BG }
    slideHeader(prs, s, "Alertas y Riesgos", 10)

    alertas.forEach(({ text, level }, i) => {
      const color  = level === "danger" ? RED : level === "warning" ? AMBER : BLUE
      const bg     = level === "danger" ? "FFF0F0" : level === "warning" ? "FFFBEA" : "F0F3FF"
      const icon   = level === "danger" ? "🔴" : level === "warning" ? "⚠" : "ℹ"
      s.addShape(prs.ShapeType.roundRect, {
        x: 0.35, y: 1.1 + i * 0.82, w: 9.3, h: 0.68,
        fill: { color: bg },
        line: { color, width: 1.5 },
        rectRadius: 0.05,
      })
      s.addText(`${icon}  ${text}`, {
        x: 0.55, y: 1.17 + i * 0.82, w: 9.0, h: 0.5,
        fontSize: 12, color,
        bold: level === "danger",
      })
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 11 — ENLACES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: WHITE }
    slideHeader(prs, s, "Documentación y Enlac es", 11)

    const links: Array<{ label: string; value: string }> = [
      { label: "SECOP II",          value: str(p.link_secop) },
      { label: "Documentación",     value: str(p.link_documentacion) },
    ]

    links.forEach(({ label, value }, i) => {
      const y = 1.3 + i * 1.5
      s.addShape(prs.ShapeType.roundRect, {
        x: 0.5, y, w: 9.0, h: 1.2, fill: { color: LIGHT_BG }, line: { color: BLUE, width: 1 }, rectRadius: 0.06,
      })
      s.addText(label, { x: 0.7, y: y + 0.1, w: 8.6, h: 0.35, fontSize: 11, bold: true, color: BLUE })
      s.addText(value, {
        x: 0.7, y: y + 0.5, w: 8.6, h: 0.55,
        fontSize: 10, color: value === "—" ? GRAY_TEXT : "1155CC",
        hyperlink: value !== "—" ? { url: value.startsWith("http") ? value : `https://${value}` } : undefined,
        wrap: true,
      })
    })

    s.addText("Nota: Acceda a los enlaces desde el expediente digital del contrato en EPUXUA.", {
      x: 0.5, y: 4.5, w: 9.0, h: 0.4, fontSize: 10, color: GRAY_TEXT, italic: true,
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAPOSITIVA 12 — CIERRE EJECUTIVO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    const s = prs.addSlide()
    s.background = { color: BLUE }
    s.addShape(prs.ShapeType.rect, { x: 0, y: 5.2, w: 10, h: 0.43, fill: { color: GOLD } })

    s.addText("Resumen Ejecutivo del Contrato", {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6, fontSize: 22, bold: true, color: GOLD, align: "center",
    })
    s.addShape(prs.ShapeType.line, { x: 1.5, y: 1.1, w: 7.0, h: 0, line: { color: GOLD, width: 1.5 } })

    const bullets = [
      `Contrato N° ${p.id_contrato} · ${p.estado}`,
      `Valor total: ${cop(p.total_contrato ?? p.valor_inicial)}`,
      `Adiciones: ${adiciones.length}  ·  Prórrogas: ${prorrogas.length}  ·  Suspensiones: ${suspensiones.length}`,
      `Contratos derivados: ${derivados.length} (${derivados.filter((d) => d.estado === "EN EJECUCIÓN").length} activos)`,
      `Facturado: ${cop(facturadoTotal)}  ·  Recaudado: ${cop(ingresadoTotal)}  ·  Pendiente: ${cop(pendienteTotal)}`,
      `Rendimientos acumulados: ${cop(rendTotal)}`,
      `Seguimiento: ${tareasComp}/${tareas.length} tareas completadas · ${tareasVenc} vencidas`,
      `Avance físico: ${p.avance_fisico_pct != null ? `${p.avance_fisico_pct}%` : "—"}  ·  Días restantes: ${diasRestantes}`,
    ]

    bullets.forEach((text, i) => {
      s.addText(`• ${text}`, {
        x: 0.7, y: 1.25 + i * 0.47, w: 8.6, h: 0.43,
        fontSize: 12, color: i === 0 ? GOLD : WHITE,
        bold: i === 0,
      })
    })

    s.addText(`${generatedAt}  ·  EPUXUA E.I.C.E. — Sistema de Gestión Pública`, {
      x: 0.5, y: 5.23, w: 9.0, h: 0.33, fontSize: 10, color: BLUE, align: "center", bold: true,
    })
  }

  // ── Generar buffer ────────────────────────────────────────────────────────
  const buffer   = await prs.write({ outputType: "nodebuffer" }) as Buffer
  const filename = `PRESENTACION_CONTRATO_${p.id_contrato.replace(/[/\\?%*:|"<>]/g, "-")}.pptx`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
