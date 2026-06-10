"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_CONFIG } from "../lib/lifecycle"
import { ContractDetailDrawer } from "@/modules/contracts/components/contract-detail-drawer"
import type { Interadministrativo, Contrato, EstadoInteradministrativo } from "@/types/database"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined) {
  return v ?? "—"
}

function fmtMoney(v: number | null | undefined) {
  if (v == null) return "—"
  return formatCOP(v)
}

function Section({ title, color = "bg-[var(--corporate-blue)]" }: { title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-2 border-b border-border">
      <div className={cn("w-1 h-5 rounded-full shrink-0", color)} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm break-words", value === "—" ? "text-muted-foreground" : "text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  )
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-5">{children}</div>
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-x-8 gap-y-5">{children}</div>
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

// ── Estado badge para contrato ────────────────────────────────────────────────

const CONTRATO_ESTADO_COLORS: Record<string, { cls: string; dot: string }> = {
  "EN EJECUCIÓN":             { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "CIERRE CONTRACTUAL":       { cls: "bg-amber-50  text-amber-700  border-amber-200",    dot: "bg-amber-500"  },
  "TERMINADO":                { cls: "bg-slate-50  text-slate-600  border-slate-200",    dot: "bg-slate-400"  },
  "LIQUIDADO":                { cls: "bg-blue-50   text-blue-700   border-blue-200",     dot: "bg-blue-500"   },
  "TERMINADO ANTICIPADAMENTE":{ cls: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
  "SUSPENDIDO":               { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-500" },
  "DECLARADO FALLIDO":        { cls: "bg-red-50    text-red-700    border-red-200",      dot: "bg-red-500"    },
  "NO SUSCRITO":              { cls: "bg-gray-50   text-gray-500   border-gray-200",     dot: "bg-gray-400"   },
  "TERMINADO ANORMALMENTE":   { cls: "bg-rose-50   text-rose-700   border-rose-200",     dot: "bg-rose-500"   },
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

  const tabCls = (t: TabId) =>
    cn(
      "px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors",
      tab === t
        ? "bg-[var(--corporate-blue)] text-white shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    )

  return (
    <div className="px-6 py-5 space-y-6 max-w-screen-xl mx-auto">

      {/* Header card */}
      <div className="epuxua-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-bold text-[var(--corporate-blue)]">{p.id_contrato}</span>
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
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-1">
          {p.secretaria && <span><span className="text-[10px] font-semibold uppercase tracking-wide block">Secretaría</span>{p.secretaria}</span>}
          {p.area_responsable && <span><span className="text-[10px] font-semibold uppercase tracking-wide block">Área</span>{p.area_responsable}</span>}
          {p.supervision && <span><span className="text-[10px] font-semibold uppercase tracking-wide block">Supervisión</span>{p.supervision}</span>}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total contrato",      value: fmtMoney(p.total_contrato) },
          { label: "Cuota admin total",   value: fmtMoney(p.total_cuota_admin) },
          { label: "Bolsa mandato",       value: fmtMoney(p.total_bolsa_mandato) },
          { label: "Pendiente cobrar",    value: fmtMoney(p.valor_pendiente_cobrar ?? p.total_cuota_admin) },
          { label: "Contratos derivados", value: String(derivados.length) },
          { label: "En ejecución",        value: String(enEjecucion) },
        ].map((k) => (
          <div key={k.label} className="epuxua-card p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 leading-tight">{k.label}</p>
            <p className="text-sm font-bold text-foreground tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button type="button" className={tabCls("resumen")} onClick={() => setTab("resumen")}>
          Información general
        </button>
        <button type="button" className={tabCls("contratos")} onClick={() => setTab("contratos")}>
          Contratos derivados
          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{derivados.length}</span>
        </button>
      </div>

      {/* Tab: Resumen */}
      {tab === "resumen" && (
        <div className="epuxua-card p-6 space-y-1">

          <Section title="Identificación" />
          <div className="pt-4 space-y-5">
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

          <Section title="Fechas y plazos" />
          <div className="pt-4 space-y-5">
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

          <Section title="Información financiera" />
          <div className="pt-4 space-y-5">
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
      )}

      {/* Tab: Contratos derivados */}
      {tab === "contratos" && (
        <div className="epuxua-card overflow-hidden">
          {contratosError ? (
            <div className="p-6 text-sm text-destructive">{contratosError}</div>
          ) : derivados.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No hay contratos derivados registrados para este convenio.
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex flex-wrap gap-6 text-xs">
                <span><strong>{derivados.length}</strong> contratos derivados</span>
                <span><strong className="text-emerald-600">{enEjecucion}</strong> en ejecución</span>
                <span>Valor total: <strong>{fmtMoney(valorDerivados)}</strong></span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
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
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="border-b border-border/60 last:border-0 hover:bg-[var(--corporate-blue)]/5 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
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

      {/* Drawer de detalle de contrato */}
      <ContractDetailDrawer
        contract={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
