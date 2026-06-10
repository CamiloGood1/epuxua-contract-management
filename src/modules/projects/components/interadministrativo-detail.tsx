"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_CONFIG } from "../lib/lifecycle"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { Interadministrativo, Contrato, EstadoInteradministrativo } from "@/types/database"
import { User, Building2, Calendar, Clock, AlertTriangle, TrendingUp } from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined) { return v ?? "—" }
function fmtMoney(v: number | null | undefined) { return v == null ? "—" : formatCOP(v) }

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-5 pb-2 border-b border-border">
      <div className="w-1 h-4 rounded-full bg-[var(--corporate-blue)] shrink-0" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm break-words", value === "—" ? "text-muted-foreground" : "text-foreground", mono && "font-mono")}>
        {value}
      </p>
    </div>
  )
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-x-6 gap-y-4">{children}</div>
}

// ── Estado badge ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoInteradministrativo }) {
  const cfg = ESTADO_CONFIG[estado]
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", cfg.bgClass, cfg.textClass, cfg.borderClass)}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dotClass)} />
      {cfg.label}
    </span>
  )
}

// ── Contrato estado badge ─────────────────────────────────────────────────────

const CONTRATO_ESTADO_COLORS: Record<string, { cls: string; dot: string }> = {
  "EN EJECUCIÓN":              { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "CIERRE CONTRACTUAL":        { cls: "bg-amber-50  text-amber-700  border-amber-200",    dot: "bg-amber-500"  },
  "TERMINADO":                 { cls: "bg-slate-50  text-slate-600  border-slate-200",    dot: "bg-slate-400"  },
  "LIQUIDADO":                 { cls: "bg-blue-50   text-blue-700   border-blue-200",     dot: "bg-blue-500"   },
  "TERMINADO ANTICIPADAMENTE": { cls: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
  "SUSPENDIDO":                { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500" },
  "DECLARADO FALLIDO":         { cls: "bg-red-50    text-red-700    border-red-200",      dot: "bg-red-500"    },
  "NO SUSCRITO":               { cls: "bg-gray-50   text-gray-500   border-gray-200",     dot: "bg-gray-400"   },
  "TERMINADO ANORMALMENTE":    { cls: "bg-rose-50   text-rose-700   border-rose-200",     dot: "bg-rose-500"   },
}

function ContratoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-muted-foreground text-xs">Sin estado</span>
  const cfg = CONTRATO_ESTADO_COLORS[estado] ?? { cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" }
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap", cfg.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {estado}
    </span>
  )
}

// ── Circular progress ─────────────────────────────────────────────────────────

function CircularProgress({ pct, size = 100, stroke = 8, color = "#345bab" }: {
  pct: number; size?: number; stroke?: number; color?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct, 100) / 100
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F0F0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Sidebar: Actores Clave + Fechas ───────────────────────────────────────────

function ActoresSidebar({ p }: { p: Interadministrativo }) {
  const days = daysUntil(p.fecha_terminacion)
  const daysInt = days ?? 0
  const isExpired = daysInt < 0
  const isCritical = !isExpired && daysInt <= 30

  return (
    <div className="space-y-4">

      {/* Actores Clave */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <User size={11} /> Actores Clave
        </p>
        {p.supervision && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--corporate-blue)]/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-[var(--corporate-blue)]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{p.supervision}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Supervisión del contrato</p>
            </div>
          </div>
        )}
        {p.secretaria && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{p.secretaria}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Secretaría contratante</p>
            </div>
          </div>
        )}
        {p.area_responsable && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{p.area_responsable}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Área responsable</p>
            </div>
          </div>
        )}
      </div>

      {/* Fechas y Plazos */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Calendar size={11} /> Fechas y Plazos
        </p>
        {[
          { label: "Suscripción",        value: p.fecha_suscripcion },
          { label: "Inicio de Ejecución", value: p.fecha_inicio_ejecucion },
          { label: "Terminación",         value: p.fecha_terminacion },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="text-xs font-semibold tabular-nums">{value ?? "—"}</span>
          </div>
        ))}
        {p.prorroga && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Prórroga</span>
            <span className="text-xs font-semibold text-amber-600">{p.prorroga}</span>
          </div>
        )}

        {/* Días restantes */}
        {days !== null && (
          <div className={cn(
            "mt-2 rounded-xl p-3 text-center",
            isExpired ? "bg-red-50 border border-red-200" : isCritical ? "bg-amber-50 border border-amber-200" : "bg-[var(--corporate-blue)]/5 border border-[var(--corporate-blue)]/20"
          )}>
            {isExpired
              ? <AlertTriangle size={16} className="text-red-500 mx-auto mb-1" />
              : <Clock size={16} className={cn("mx-auto mb-1", isCritical ? "text-amber-500" : "text-[var(--corporate-blue)]")} />
            }
            <p className={cn("text-2xl font-bold tabular-nums", isExpired ? "text-red-600" : isCritical ? "text-amber-600" : "text-[var(--corporate-blue)]")}>
              {Math.abs(daysInt)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isExpired ? "días vencido" : "días restantes"}
            </p>
            {p.plazo_ejecucion_inicial && (
              <p className="text-[9px] text-muted-foreground mt-1">Plazo inicial: {p.plazo_ejecucion_inicial}</p>
            )}
          </div>
        )}
      </div>

      {/* Financiero rápido */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
          <TrendingUp size={11} /> Resumen Financiero
        </p>
        {(() => {
          const total = p.total_contrato ?? 0
          const cuota = p.total_cuota_admin ?? 0
          const pendiente = p.valor_pendiente_cobrar ?? cuota
          const pct = cuota > 0 ? Math.round((cuota - pendiente) / cuota * 100) : 0
          return (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <CircularProgress pct={pct} size={72} stroke={7} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">{pct}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: "Total contrato", val: fmtMoney(total) },
                  { label: "Cuota admin", val: fmtMoney(cuota) },
                  { label: "Pendiente", val: fmtMoney(pendiente), accent: "text-amber-600" },
                ].map(({ label, val, accent }) => (
                  <div key={label}>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className={cn("text-xs font-bold tabular-nums", accent)}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Link SECOP si existe */}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  project: Interadministrativo
  contratos: Contrato[]
  canEdit: boolean
  contratosError?: string
}

type TabId = "resumen" | "contratos"

export function InteradministrativoDetail({ project: p, contratos, contratosError }: Props) {
  const [tab, setTab] = useState<TabId>("resumen")
  const [selected, setSelected] = useState<Contrato | null>(null)

  const derivados      = useMemo(() => contratos.filter((c) => c.tipo_contrato === "DERIVADO"), [contratos])
  const enEjecucion    = useMemo(() => derivados.filter((c) => c.estado === "EN EJECUCIÓN").length, [derivados])
  const valorDerivados = useMemo(() => derivados.reduce((s, c) => s + (c.valor_final ?? c.valor_inicial ?? 0), 0), [derivados])

  const tabCls = (t: TabId) => cn(
    "px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors",
    tab === t ? "bg-[var(--corporate-blue)] text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
  )

  return (
    <div className="px-6 py-5 max-w-screen-xl mx-auto space-y-5">

      {/* ── Header card ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="font-mono text-xl font-bold text-[var(--corporate-blue)]">{p.id_contrato}</span>
          <EstadoBadge estado={p.estado} />
          {p.clase_contrato && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p.clase_contrato}</span>
          )}
        </div>
        {p.objeto_contrato && (
          <p className="text-base text-foreground leading-relaxed border-l-2 border-[var(--corporate-blue)]/30 pl-3">
            {p.objeto_contrato}
          </p>
        )}
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total contrato",      value: fmtMoney(p.total_contrato) },
          { label: "Cuota admin total",   value: fmtMoney(p.total_cuota_admin) },
          { label: "Pendiente cobrar",    value: fmtMoney(p.valor_pendiente_cobrar ?? p.total_cuota_admin) },
          { label: "Contratos derivados", value: String(derivados.length) },
          { label: "En ejecución",        value: String(enEjecucion) },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#EAEAEA] rounded-2xl p-4 text-center shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 leading-tight">{k.label}</p>
            <p className="text-sm font-bold text-foreground tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        <button type="button" className={tabCls("resumen")} onClick={() => setTab("resumen")}>
          Información general
        </button>
        <button type="button" className={tabCls("contratos")} onClick={() => setTab("contratos")}>
          Contratos derivados
          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{derivados.length}</span>
        </button>
      </div>

      {/* ── Tab: Resumen + Sidebar ── */}
      {tab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* Contenido principal */}
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm space-y-1">

            <Section title="Identificación" />
            <div className="pt-4 space-y-4">
              <Row2>
                <Field label="N° Contrato" value={fmt(p.id_contrato)} mono />
                <Field label="Modalidad de selección" value={fmt(p.modalidad_seleccion)} />
              </Row2>
              <Row2>
                <Field label="Clase de contrato" value={fmt(p.clase_contrato)} />
                <Field label="Secretaría" value={fmt(p.secretaria)} />
              </Row2>
              <Row2>
                <Field label="Área responsable" value={fmt(p.area_responsable)} />
                <Field label="Supervisión" value={fmt(p.supervision)} />
              </Row2>
            </div>

            <Section title="Fechas y Plazos" />
            <div className="pt-4 space-y-4">
              <Row3>
                <Field label="Fecha suscripción" value={fmt(p.fecha_suscripcion)} />
                <Field label="Fecha inicio ejecución" value={fmt(p.fecha_inicio_ejecucion)} />
                <Field label="Plazo ejecución inicial" value={fmt(p.plazo_ejecucion_inicial)} />
              </Row3>
              <Row3>
                <Field label="Prórroga" value={fmt(p.prorroga)} />
                <Field label="Suspensión" value={fmt(p.suspension)} />
                <Field label="Reinicio" value={fmt(p.reinicio)} />
              </Row3>
              <Row2>
                <Field label="Fecha terminación" value={fmt(p.fecha_terminacion)} />
              </Row2>
            </div>

            <Section title="Información Financiera" />
            <div className="pt-4 space-y-4">
              <Row3>
                <Field label="Valor inicial" value={fmtMoney(p.valor_inicial)} />
                <Field label="Adición" value={fmtMoney(p.adicion)} />
                <Field label="Total contrato" value={fmtMoney(p.total_contrato)} />
              </Row3>
              <Row3>
                <Field label="Cuota admin inicial" value={fmtMoney(p.cuota_admin_inicial)} />
                <Field label="Adición cuota admin" value={fmtMoney(p.adicion_cuota_admin)} />
                <Field label="Total cuota admin" value={fmtMoney(p.total_cuota_admin)} />
              </Row3>
              <Row3>
                <Field label="Bolsa gerencia inicial" value={fmtMoney(p.bolsa_gerencia_inicial)} />
                <Field label="Adición bolsa mandato" value={fmtMoney(p.adicion_bolsa_mandato)} />
                <Field label="Total bolsa mandato" value={fmtMoney(p.total_bolsa_mandato)} />
              </Row3>
              <Row2>
                <Field label="Pendiente por cobrar" value={fmtMoney(p.valor_pendiente_cobrar ?? p.total_cuota_admin)} />
                <Field label="Vigencias futuras" value={fmtMoney(p.vigencias_futuras)} />
              </Row2>
            </div>

            {p.observaciones && (
              <>
                <Section title="Observaciones" />
                <div className="pt-3">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.observaciones}</p>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <ActoresSidebar p={p} />
        </div>
      )}

      {/* ── Tab: Contratos derivados ── */}
      {tab === "contratos" && (
        <div className="bg-white border border-[#EAEAEA] rounded-2xl shadow-sm overflow-hidden">
          {contratosError ? (
            <div className="p-6 text-sm text-destructive">{contratosError}</div>
          ) : derivados.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No hay contratos derivados registrados para este convenio.
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-border bg-[#F8FAFC] flex flex-wrap gap-6 text-xs">
                <span><strong>{derivados.length}</strong> contratos derivados</span>
                <span><strong className="text-emerald-600">{enEjecucion}</strong> en ejecución</span>
                <span>Valor total: <strong>{fmtMoney(valorDerivados)}</strong></span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-[#F8FAFC] text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap">N° Contrato</th>
                      <th className="px-4 py-2.5 font-semibold min-w-[180px]">Objeto</th>
                      <th className="px-4 py-2.5 font-semibold min-w-[130px]">Contratista</th>
                      <th className="px-4 py-2.5 font-semibold">Estado</th>
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Supervisor</th>
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap text-right">Valor final</th>
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap text-right">Pendiente</th>
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap">F. terminación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derivados.map((c) => (
                      <tr key={c.id} onClick={() => setSelected(c)}
                        className="border-b border-border/60 last:border-0 hover:bg-[var(--corporate-blue)]/5 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-xs font-mono text-[var(--corporate-blue)]">{c.numero_contrato ?? "—"}</span>
                        </td>
                        <td className="px-4 py-2.5 max-w-xs">
                          <span className="text-xs line-clamp-2">{c.objeto_contrato ?? "—"}</span>
                        </td>
                        <td className="px-4 py-2.5 max-w-[140px]">
                          <span className="text-xs truncate block">{c.contratista ?? "—"}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <ContratoBadge estado={c.estado} />
                        </td>
                        <td className="px-4 py-2.5 text-xs max-w-[110px] truncate">{c.supervisor ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-xs whitespace-nowrap">
                          {c.valor_final != null ? fmtMoney(c.valor_final) : fmtMoney(c.valor_inicial)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-xs whitespace-nowrap text-amber-700">
                          {c.valor_pendiente != null ? fmtMoney(c.valor_pendiente) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{c.fecha_terminacion ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <ContractDetailDrawer contract={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
