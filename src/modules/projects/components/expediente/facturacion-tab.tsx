"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Pencil, Trash2, AlertTriangle, Receipt, TrendingUp, Clock } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { createFactura, updateFactura, deleteFactura } from "@/services/facturas.actions"
import { calcFacturacionKPIs, computeFactura } from "@/types/facturas"
import type { Factura, DestinoFactura, EstadoFactura } from "@/types/facturas"
import type { CreateFacturaInput } from "@/services/facturas.actions"
import { formatDateShort } from "@/lib/date-format"

export type { Factura }

// ── Helpers ───────────────────────────────────────────────────────────────────

const DESTINO_LABEL: Record<DestinoFactura, string> = {
  BIENES_SERVICIOS: "Bienes y Servicios",
  CUOTA_GERENCIA:   "Cuota de Gerencia",
}

const ESTADO_CFG: Record<EstadoFactura, { label: string; bg: string; text: string; dot: string }> = {
  FACTURADO: { label: "Facturado",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  COBRADO:   { label: "Cobrado",     bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  INGRESADO: { label: "Ingresado",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
}

function EstadoBadge({ estado }: { estado: EstadoFactura }) {
  const c = ESTADO_CFG[estado]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

function fmt(v: number) { return formatCOP(v) }

function fmtDate(d: string | null | undefined) {
  return formatDateShort(d)
}

function daysSince(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  const n = new Date(); n.setHours(0,0,0,0)
  return Math.floor((n.getTime() - d.getTime()) / 86400000)
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent = "text-[#D9A520]",
  icon,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#747783] leading-tight">{label}</p>
        {icon && <div className="text-[#747783]">{icon}</div>}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#747783] mt-1">{sub}</p>}
    </div>
  )
}

// ── Modal de factura ──────────────────────────────────────────────────────────

interface ModalProps {
  interadministrativoId: number
  factura?: Factura | null
  onClose: () => void
}

const EMPTY_FORM = {
  numero_factura:  "",
  fecha_remision:  "",
  fecha_ingreso:   "",
  destino:         "BIENES_SERVICIOS" as DestinoFactura,
  valor_cobrado:   "",
  valor_ingresado: "0",
  descuentos:      "0",
  estado:          "FACTURADO" as EstadoFactura,
}

function FacturaModal({ interadministrativoId, factura, onClose }: ModalProps) {
  const router = useRouter()
  const [form, setForm] = useState(() =>
    factura
      ? {
          numero_factura:  factura.numero_factura,
          fecha_remision:  factura.fecha_remision,
          fecha_ingreso:   factura.fecha_ingreso ?? "",
          destino:         factura.destino,
          valor_cobrado:   String(factura.valor_cobrado),
          valor_ingresado: String(factura.valor_ingresado ?? 0),
          descuentos:      String(factura.descuentos ?? 0),
          estado:          factura.estado,
        }
      : EMPTY_FORM
  )
  const [error, setError]   = useState<string | null>(null)
  const [isPending, start]  = useTransition()

  const isEditing = !!factura

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cobrado   = parseFloat(form.valor_cobrado)
    const ingresado = parseFloat(form.valor_ingresado)
    const desc      = parseFloat(form.descuentos)
    if (!form.numero_factura.trim()) { setError("El número de factura es obligatorio."); return }
    if (!form.fecha_remision)        { setError("La fecha de remisión es obligatoria."); return }
    if (isNaN(cobrado) || cobrado <= 0) { setError("El valor cobrado debe ser mayor a 0."); return }
    if (isNaN(ingresado) || ingresado < 0) { setError("El valor ingresado no puede ser negativo."); return }
    if (isNaN(desc) || desc < 0)           { setError("Los descuentos no pueden ser negativos."); return }

    const input: CreateFacturaInput = {
      interadministrativo_id: interadministrativoId,
      numero_factura:  form.numero_factura.trim(),
      fecha_remision:  form.fecha_remision,
      fecha_ingreso:   form.fecha_ingreso || null,
      destino:         form.destino,
      valor_cobrado:   cobrado,
      valor_ingresado: ingresado,
      descuentos:      desc,
      estado:          form.estado,
    }

    start(async () => {
      const res = isEditing
        ? await updateFactura(factura!.id, interadministrativoId, input)
        : await createFactura(input)
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  const inputCls = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">
            {isEditing ? "Editar Factura" : "Registrar Nueva Factura"}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>N° Factura <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.numero_factura}
                onChange={(e) => set("numero_factura", e.target.value)}
                className={inputCls}
                placeholder="Ej. FAC-2024-001"
              />
            </div>
            <div>
              <label className={labelCls}>Destino <span className="text-red-500">*</span></label>
              <select value={form.destino} onChange={(e) => set("destino", e.target.value as DestinoFactura)} className={inputCls + " appearance-none"}>
                <option value="BIENES_SERVICIOS">Bienes y Servicios</option>
                <option value="CUOTA_GERENCIA">Cuota de Gerencia</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fecha de Remisión <span className="text-red-500">*</span></label>
              <input type="date" value={form.fecha_remision} onChange={(e) => set("fecha_remision", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha de Ingreso</label>
              <input type="date" value={form.fecha_ingreso} onChange={(e) => set("fecha_ingreso", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Valor Cobrado <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.valor_cobrado}
                onChange={(e) => set("valor_cobrado", e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Descuentos</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.descuentos}
                onChange={(e) => set("descuentos", e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Valor Ingresado</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.valor_ingresado}
                onChange={(e) => set("valor_ingresado", e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>

          {/* Preview neto */}
          {form.valor_cobrado && (
            <div className="bg-[#f9f9ff] rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[9px] font-bold uppercase text-[#747783]">Valor Neto</p>
                <p className="text-sm font-bold text-[#151c27]">{fmt(Math.max(0, parseFloat(form.valor_cobrado||"0") - parseFloat(form.descuentos||"0")))}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-[#747783]">Saldo Pdte.</p>
                <p className="text-sm font-bold text-amber-600">{fmt(Math.max(0, parseFloat(form.valor_cobrado||"0") - parseFloat(form.descuentos||"0") - parseFloat(form.valor_ingresado||"0")))}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-[#747783]">% Recaudado</p>
                <p className="text-sm font-bold text-emerald-600">
                  {(() => { const neto = parseFloat(form.valor_cobrado||"0") - parseFloat(form.descuentos||"0"); return neto > 0 ? `${Math.round(parseFloat(form.valor_ingresado||"0") / neto * 100)}%` : "0%" })()}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Estado <span className="text-red-500">*</span></label>
            <select value={form.estado} onChange={(e) => set("estado", e.target.value as EstadoFactura)} className={inputCls + " appearance-none"}>
              <option value="FACTURADO">Facturado</option>
              <option value="COBRADO">Cobrado</option>
              <option value="INGRESADO">Ingresado</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] disabled:opacity-60"
            >
              {isPending ? "Guardando…" : isEditing ? "Actualizar" : "Registrar Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  interadministrativoId: number
  facturas: Factura[]
  canEdit: boolean
  canDelete: boolean
}

export function FacturacionTab({ interadministrativoId, facturas, canEdit, canDelete }: Props) {
  const router = useRouter()
  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Factura | null>(null)
  const [filterDestino, setFilterDestino] = useState<"all" | DestinoFactura>("all")
  const [filterEstado,  setFilterEstado]  = useState<"all" | EstadoFactura>("all")
  const [search, setSearch]             = useState("")
  const [deleting, startDelete]         = useTransition()

  const kpis = useMemo(() => calcFacturacionKPIs(facturas), [facturas])

  const filtered = useMemo(() => {
    return facturas.filter((f) => {
      if (filterDestino !== "all" && f.destino !== filterDestino) return false
      if (filterEstado  !== "all" && f.estado  !== filterEstado)  return false
      if (search && !f.numero_factura.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [facturas, filterDestino, filterEstado, search])

  // Alerts
  const alertas = useMemo(() => {
    const vencidas = facturas.filter(
      (f) => f.estado !== "INGRESADO" && daysSince(f.fecha_remision) > 30
    )
    const parciales = facturas.filter(
      (f) => f.estado !== "INGRESADO" && Number(f.valor_ingresado) > 0 && Number(f.valor_ingresado) < Number(f.valor_cobrado) - Number(f.descuentos ?? 0)
    )
    const pendientes = facturas.filter((f) => f.estado === "FACTURADO")
    return { vencidas, parciales, pendientes }
  }, [facturas])

  async function handleDelete(f: Factura) {
    if (!confirm(`¿Eliminar la factura ${f.numero_factura}? Esta acción no se puede deshacer.`)) return
    startDelete(async () => {
      const res = await deleteFactura(f.id, interadministrativoId)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  const pctRecaudo = kpis.facturadoTotal > 0
    ? Math.round(kpis.ingresadoTotal / kpis.facturadoTotal * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Facturado Total"
          value={fmt(kpis.facturadoTotal)}
          sub={`${kpis.totalFacturas} facturas`}
          accent="text-[#0B3D91]"
          icon={<Receipt size={14} />}
        />
        <KpiCard
          label="Ingresado Total"
          value={fmt(kpis.ingresadoTotal)}
          sub={`${pctRecaudo}% del total facturado`}
          accent="text-emerald-600"
          icon={<TrendingUp size={14} />}
        />
        <KpiCard
          label="Pendiente Recaudo"
          value={fmt(kpis.pendienteTotal)}
          sub={`${kpis.facturasPendientes + kpis.facturasCobradas} sin cerrar`}
          accent={kpis.pendienteTotal > 0 ? "text-amber-600" : "text-[#747783]"}
          icon={<Clock size={14} />}
        />
        <KpiCard
          label="Bienes y Servicios"
          value={fmt(kpis.facturadoBienes)}
          sub={`Ingresado: ${fmt(kpis.ingresadoBienes)}`}
          accent="text-[#0B3D91]"
        />
        <KpiCard
          label="Cuota de Gerencia"
          value={fmt(kpis.facturadoCuota)}
          sub={`Ingresado: ${fmt(kpis.ingresadoCuota)}`}
          accent="text-violet-600"
        />
        <KpiCard
          label="Último Pago"
          value={fmtDate(kpis.ultimoPago)}
          sub={kpis.ultimoPago ? `hace ${daysSince(kpis.ultimoPago)} días` : "Sin pagos registrados"}
          accent="text-[#151c27]"
        />
      </div>

      {/* ── Barra de progreso de recaudo ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#151c27]">Progreso de Recaudo</p>
          <span className="text-sm font-bold text-emerald-600">{pctRecaudo}%</span>
        </div>
        <div className="h-3 bg-[#f0f3ff] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pctRecaudo}%`,
              background: pctRecaudo >= 80 ? "#10B981" : pctRecaudo >= 50 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#747783]">
          <span>Ingresado: {fmt(kpis.ingresadoTotal)}</span>
          <span>Facturado: {fmt(kpis.facturadoTotal)}</span>
        </div>
      </div>

      {/* ── Alertas ── */}
      {(alertas.vencidas.length > 0 || alertas.parciales.length > 0 || alertas.pendientes.length > 0) && (
        <div className="space-y-3">
          {alertas.vencidas.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {alertas.vencidas.length} factura{alertas.vencidas.length > 1 ? "s" : ""} con más de 30 días sin recaudo
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {alertas.vencidas.map((f) => `${f.numero_factura} (${daysSince(f.fecha_remision)}d)`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {alertas.parciales.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  {alertas.parciales.length} factura{alertas.parciales.length > 1 ? "s" : ""} parcialmente ingresadas
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {alertas.parciales.map((f) => `${f.numero_factura} (${computeFactura(f).pctRecaudado}% cobrado)`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {alertas.pendientes.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Clock size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  {alertas.pendientes.length} factura{alertas.pendientes.length > 1 ? "s" : ""} pendientes de ingreso
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {alertas.pendientes.map((f) => f.numero_factura).join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabla histórico ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[#EAEAEA]">
          <h3 className="text-sm font-bold text-[#002869] mr-auto">Historial de Facturación</h3>

          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar N° factura…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-44 rounded-lg border border-[#EAEAEA] pl-3 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
            />
          </div>

          {/* Filtro destino */}
          <select
            value={filterDestino}
            onChange={(e) => setFilterDestino(e.target.value as "all" | DestinoFactura)}
            className="h-9 rounded-lg border border-[#EAEAEA] pl-3 pr-6 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
          >
            <option value="all">Todos los destinos</option>
            <option value="BIENES_SERVICIOS">Bienes y Servicios</option>
            <option value="CUOTA_GERENCIA">Cuota de Gerencia</option>
          </select>

          {/* Filtro estado */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as "all" | EstadoFactura)}
            className="h-9 rounded-lg border border-[#EAEAEA] pl-3 pr-6 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
          >
            <option value="all">Todos los estados</option>
            <option value="FACTURADO">Facturado</option>
            <option value="COBRADO">Cobrado</option>
            <option value="INGRESADO">Ingresado</option>
          </select>

          {canEdit && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true) }}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#002869] transition-colors"
            >
              <Plus size={13} />
              Nueva Factura
            </button>
          )}
        </div>

        {/* Table */}
        {facturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt size={36} className="text-[#EAEAEA] mb-3" />
            <p className="text-sm font-semibold text-[#151c27]">Sin facturas registradas</p>
            <p className="text-xs text-[#747783] mt-1">
              {canEdit ? "Usa el botón Nueva Factura para registrar la primera." : "No hay facturas registradas para este contrato."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#747783]">Sin resultados para los filtros actuales.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9f9ff] border-b border-[#EAEAEA]">
                <tr>
                  {["N° Factura","F. Remisión","F. Ingreso","Destino","Cobrado","Descuentos","Neto","Ingresado","Saldo","% Recaudo","Estado",""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filtered.map((f) => {
                  const { valorNeto, saldoPendiente, pctRecaudado } = computeFactura(f)
                  return (
                    <tr key={f.id} className="hover:bg-[#f9f9ff] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0B3D91] whitespace-nowrap">{f.numero_factura}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#434652]">{fmtDate(f.fecha_remision)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#434652]">{fmtDate(f.fecha_ingreso)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${f.destino === "BIENES_SERVICIOS" ? "bg-[#0B3D91]/10 text-[#0B3D91]" : "bg-violet-50 text-violet-700"}`}>
                          {DESTINO_LABEL[f.destino]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">{fmt(Number(f.valor_cobrado))}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#747783] whitespace-nowrap">{fmt(Number(f.descuentos ?? 0))}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap">{fmt(valorNeto)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium whitespace-nowrap">{fmt(Number(f.valor_ingresado ?? 0))}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${saldoPendiente > 0 ? "text-amber-600" : "text-[#747783]"}`}>
                        {fmt(saldoPendiente)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-1.5 min-w-[80px]">
                          <div className="flex-1 h-1.5 bg-[#f0f3ff] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pctRecaudado}%`,
                                background: pctRecaudado >= 100 ? "#10B981" : pctRecaudado >= 50 ? "#F59E0B" : "#EF4444",
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-[#434652] w-8 text-right tabular-nums">{pctRecaudado}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><EstadoBadge estado={f.estado} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => { setEditTarget(f); setShowModal(true) }}
                              className="p-1.5 rounded hover:bg-[#f0f3ff] text-[#747783] hover:text-[#0B3D91] transition-colors"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(f)}
                              disabled={deleting}
                              className="p-1.5 rounded hover:bg-red-50 text-[#747783] hover:text-red-600 transition-colors disabled:opacity-40"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {filtered.length > 1 && (
                <tfoot className="bg-[#f9f9ff] border-t border-[#EAEAEA]">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-[11px] font-bold text-[#747783] uppercase tracking-wide">
                      Totales ({filtered.length})
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-[#151c27]">
                      {fmt(filtered.reduce((s,f) => s + Number(f.valor_cobrado), 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm text-[#747783]">
                      {fmt(filtered.reduce((s,f) => s + Number(f.descuentos??0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-[#151c27]">
                      {fmt(filtered.reduce((s,f) => s + computeFactura(f).valorNeto, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-emerald-600">
                      {fmt(filtered.reduce((s,f) => s + Number(f.valor_ingresado??0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-amber-600">
                      {fmt(filtered.reduce((s,f) => s + computeFactura(f).saldoPendiente, 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FacturaModal
          interadministrativoId={interadministrativoId}
          factura={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
