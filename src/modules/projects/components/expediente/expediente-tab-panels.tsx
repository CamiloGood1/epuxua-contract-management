"use client"

import Link from "next/link"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { ExternalLink, AlertTriangle, Clock, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP, formatDate, pct } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "../lifecycle-badge"
import { projectTypeLabel } from "../../lib/project-type"
import { projectEntityLabel } from "../../lib/project-utils"
import { ExpandableContractTree } from "./expandable-contract-tree"
import {
  lifecycleTimeline,
  groupDocuments,
  paymentsByMonth,
  recentAlerts,
  recentFollowups,
  recentPayments,
  upcomingDeadlines,
  alertSeverityOrder,
} from "../../lib/expediente-utils"
import type { ProjectExpedienteData } from "@/types/project-expediente"
import type { ExpedienteTabId } from "@/types/project-expediente"

interface ExpedienteTabPanelsProps {
  data: ProjectExpedienteData
  tab: ExpedienteTabId
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value ?? "—"}</p>
    </div>
  )
}

const SEVERITY_LABELS: Record<string, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
  info: "Informativa",
}

const SEVERITY_BORDER: Record<string, string> = {
  critica: "border-l-red-500",
  alta: "border-l-orange-500",
  media: "border-l-amber-500",
  baja: "border-l-blue-400",
  info: "border-l-slate-300",
}

export function ExpedienteTabPanels({ data, tab }: ExpedienteTabPanelsProps) {
  const {
    project,
    primary_contract,
    contract_tree,
    followups,
    documents,
    indicators,
    alerts,
    financial,
    payments,
    movements,
    computed,
  } = data

  const fin = financial ?? project
  const entity = projectEntityLabel(project)
  const docGroups = groupDocuments(documents, contract_tree)
  const monthlyPayments = paymentsByMonth(payments)
  const deadlines = upcomingDeadlines(contract_tree)
  const timeline = lifecycleTimeline(project.lifecycle_status)

  if (tab === "resumen") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="epuxua-card p-5 space-y-4">
            <h3 className="text-sm font-bold">Información general</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Código" value={project.project_code} />
              <Field label="Año" value={project.year} />
              <Field label="Tipo" value={projectTypeLabel(project.project_type)} />
              <Field label="Entidad" value={entity} />
              <Field label="Estado" value={<LifecycleBadge status={project.lifecycle_status} size="sm" />} />
              <Field label="Gerente" value={project.manager_name} />
              <Field label="Supervisor" value={primary_contract?.supervisor_name} />
              <Field label="Derivados" value={computed.derived_count} />
            </div>
            {project.observations && <Field label="Observaciones" value={project.observations} />}
          </div>

          <div className="epuxua-card p-5 space-y-4">
            <h3 className="text-sm font-bold">Estado actual</h3>
            <div className="space-y-2">
              {timeline.map((step) => (
                <div key={step.status} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      step.current && "bg-[var(--corporate-blue)] ring-4 ring-[var(--corporate-blue)]/20",
                      step.done && !step.current && "bg-emerald-500",
                      !step.done && !step.current && "bg-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      step.current && "font-bold text-[var(--corporate-blue)]",
                      step.done && !step.current && "text-muted-foreground",
                      !step.done && !step.current && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <MiniList
            title="Últimos pagos"
            empty="Sin pagos."
            items={recentPayments(payments).map((p) => (
              <li key={p.id} className="flex justify-between gap-2 text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{formatDate(p.payment_date)}</span>
                <span className="font-semibold tabular-nums">{formatCOP(p.net_value)}</span>
              </li>
            ))}
          />

          <MiniList
            title="Últimos seguimientos"
            empty="Sin seguimientos."
            items={recentFollowups(followups).map((f) => (
              <li key={f.id} className="text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className="font-medium">{formatDate(f.followup_date)}</span>
                {f.observations && (
                  <p className="text-muted-foreground line-clamp-2 mt-0.5">{f.observations}</p>
                )}
              </li>
            ))}
          />

          <MiniList
            title="Últimas alertas"
            empty="Sin alertas activas."
            items={recentAlerts(alerts).map((a) => (
              <li key={a.id} className="text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className="font-medium">{a.title}</span>
                <span className="text-muted-foreground ml-1">({SEVERITY_LABELS[a.severity]})</span>
              </li>
            ))}
          />
        </div>

        {deadlines.length > 0 && (
          <div className="epuxua-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold">Próximos vencimientos</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deadlines.map((d) => (
                <Link
                  key={d.contract_id}
                  href={`/proyectos/${project.id}/contratos/${d.contract_id}`}
                  className="flex justify-between items-center p-3 rounded-lg border border-border hover:border-amber-300/50 text-sm transition-colors"
                >
                  <span className="font-mono font-semibold text-[var(--corporate-blue)]">
                    {d.contract_number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {d.days_remaining} días · {formatDate(d.end_date)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {indicators.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {indicators.slice(0, 4).map((ind) => (
              <div key={ind.id} className="epuxua-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold truncate">
                  {ind.indicator_name}
                </p>
                <p className="text-lg font-bold mt-1 tabular-nums">
                  {ind.indicator_value ?? "—"}
                  {ind.unit && <span className="text-xs font-normal ml-0.5">{ind.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (tab === "estructura") {
    return (
      <ExpandableContractTree
        projectId={project.id}
        projectCode={project.project_code}
        nodes={contract_tree}
      />
    )
  }

  if (tab === "financiero") {
    const executionChart = [
      { name: "Total", value: fin.total_value },
      { name: "Ejecutado", value: fin.executed_value },
      { name: "Pagado", value: fin.paid_value },
      { name: "Disponible", value: fin.available_balance },
    ]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Valor total", fin.total_value],
            ["B/S", fin.goods_services_value],
            ["Cuota ger.", fin.management_fee_amount],
            ["Contratado", computed.contracted_value],
            ["Ejecutado", fin.executed_value],
            ["Pagado", fin.paid_value],
            ["Disponible", fin.available_balance],
            ["% Ejec.", `${pct(fin.execution_pct).toFixed(1)}%`],
          ].map(([label, val]) => (
            <div key={String(label)} className="epuxua-card p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
              <p className="text-sm font-bold mt-1 tabular-nums">
                {typeof val === "number" ? formatCOP(val) : val}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="epuxua-card p-5">
            <h3 className="text-sm font-bold mb-4">Ejecución financiera</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={executionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v) => formatCOP(Number(v))} />
                <Bar dataKey="value" fill="#345bab" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {monthlyPayments.length > 0 && (
            <div className="epuxua-card p-5">
              <h3 className="text-sm font-bold mb-4">Pagos mensuales</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyPayments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v) => formatCOP(Number(v))} />
                  <Line type="monotone" dataKey="total" stroke="#345bab" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <DataTable
          title="Pagos del proyecto"
          headers={["Fecha", "Contrato", "Descripción", "Neto"]}
          rows={payments.map((p) => [
            formatDate(p.payment_date),
            p.contract_number ?? "—",
            p.description ?? "—",
            formatCOP(p.net_value),
          ])}
          empty="Sin pagos registrados."
        />

        <DataTable
          title="Movimientos presupuestales (CDP/CRP)"
          headers={["Fecha", "Tipo", "Número", "Contrato", "Valor"]}
          rows={movements.map((m) => [
            m.date ? formatDate(m.date) : "—",
            m.commitment_type,
            m.number,
            m.contract_number ?? "—",
            formatCOP(m.value),
          ])}
          empty="Sin movimientos presupuestales."
        />
      </div>
    )
  }

  if (tab === "seguimiento") {
    return (
      <div className="space-y-4">
        {followups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Sin registros de seguimiento.</p>
        ) : (
          followups.map((f, i) => (
            <div key={f.id} className="epuxua-card p-4 sm:p-5 relative pl-8">
              <div className="absolute left-4 top-5 bottom-0 w-px bg-border" aria-hidden />
              <div className="absolute left-2.5 top-5 w-3 h-3 rounded-full bg-[var(--corporate-blue)] ring-4 ring-[var(--corporate-blue)]/15" />
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Activity size={14} className="text-[var(--corporate-blue)]" />
                <span className="text-sm font-bold">{formatDate(f.followup_date)}</span>
                {f.period_label && (
                  <span className="text-xs text-muted-foreground">{f.period_label}</span>
                )}
                {f.alert_level && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      f.alert_level === "VERDE" && "bg-emerald-50 text-emerald-700",
                      f.alert_level === "AMARILLO" && "bg-amber-50 text-amber-700",
                      f.alert_level === "ROJO" && "bg-red-50 text-red-700"
                    )}
                  >
                    {f.alert_level}
                  </span>
                )}
              </div>
              {f.observations && <p className="text-sm mb-2">{f.observations}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {f.physical_progress != null && (
                  <p><span className="text-muted-foreground">Avance físico:</span> {f.physical_progress}%</p>
                )}
                {f.financial_progress != null && (
                  <p><span className="text-muted-foreground">Avance financiero:</span> {f.financial_progress}%</p>
                )}
                {f.risks && (
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Riesgos:</span> {f.risks}</p>
                )}
                {f.corrective_actions && (
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Compromisos:</span> {f.corrective_actions}</p>
                )}
                {f.next_actions && (
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Próximas acciones:</span> {f.next_actions}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (tab === "documentos") {
    const groups = docGroups
    if (Object.keys(groups).length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-12">
          Sin documentos vinculados. Los archivos se gestionan en SharePoint y SECOP.
        </p>
      )
    }
    return (
      <div className="space-y-6">
        {Object.entries(groups).map(([group, docs]) => (
          <div key={group}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{group}</h3>
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li key={doc.id} className="epuxua-card p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    {doc.document_type && (
                      <p className="text-[10px] text-muted-foreground">{doc.document_type}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {doc.sharepoint_url && (
                      <a
                        href={doc.sharepoint_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--corporate-blue)] hover:underline"
                      >
                        SharePoint <ExternalLink size={12} />
                      </a>
                    )}
                    {doc.secop_document_url && (
                      <a
                        href={doc.secop_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:underline"
                      >
                        SECOP <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  if (tab === "indicadores") {
    const calculated = [
      { name: "Ejecución financiera", value: `${pct(fin.execution_pct).toFixed(1)}%`, unit: "" },
      { name: "Contratos activos", value: String(computed.active_contracts), unit: "" },
      { name: "Contratos vencidos", value: String(computed.expired_contracts), unit: "" },
      { name: "Por vencer (30 días)", value: String(computed.expiring_contracts), unit: "" },
      { name: "Alertas abiertas", value: String(computed.open_alerts), unit: "" },
      { name: "Alertas cerradas", value: String(computed.closed_alerts), unit: "" },
      { name: "Contratos derivados", value: String(computed.derived_count), unit: "" },
      { name: "Valor contratado", value: formatCOP(computed.contracted_value), unit: "" },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Indicadores calculados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {calculated.map((c) => (
              <div key={c.name} className="epuxua-card p-4">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-tight">{c.name}</p>
                <p className="text-xl font-bold mt-2 tabular-nums">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
        {indicators.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Indicadores registrados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {indicators.map((ind) => (
                <div key={ind.id} className="epuxua-card p-4">
                  <p className="text-xs font-bold text-[var(--corporate-blue)]">{ind.indicator_name}</p>
                  <p className="text-2xl font-bold mt-2 tabular-nums">
                    {ind.indicator_value ?? "—"}
                    {ind.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{ind.unit}</span>}
                  </p>
                  {ind.target_value != null && (
                    <p className="text-xs text-muted-foreground mt-1">Meta: {ind.target_value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (tab === "alertas") {
    const active = [...alerts]
      .filter((a) => a.is_active)
      .sort((a, b) => alertSeverityOrder(a.severity) - alertSeverityOrder(b.severity))
    const historical = alerts.filter((a) => !a.is_active)

    const bySeverity = (list: typeof alerts) => ({
      critica: list.filter((a) => a.severity === "critica"),
      alta: list.filter((a) => a.severity === "alta"),
      media: list.filter((a) => a.severity === "media"),
      baja: list.filter((a) => a.severity === "baja"),
    })

    const activeBySev = bySeverity(active)

    return (
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="text-sm font-bold">Alertas activas ({active.length})</h3>
          </div>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay alertas activas.</p>
          ) : (
            <div className="space-y-4">
              {(["critica", "alta", "media", "baja"] as const).map((sev) =>
                activeBySev[sev].length > 0 ? (
                  <div key={sev}>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
                      {SEVERITY_LABELS[sev]} ({activeBySev[sev].length})
                    </p>
                    <ul className="space-y-2">
                      {activeBySev[sev].map((a) => (
                        <li
                          key={a.id}
                          className={cn("epuxua-card p-4 border-l-4", SEVERITY_BORDER[a.severity])}
                        >
                          <p className="text-sm font-semibold">{a.title}</p>
                          {a.description && (
                            <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {formatDate(a.created_at)} · {a.alert_type}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          )}
        </section>

        {historical.length > 0 && (
          <section>
            <h3 className="text-sm font-bold mb-3 text-muted-foreground">
              Histórico ({historical.length})
            </h3>
            <ul className="space-y-2 opacity-80">
              {historical.map((a) => (
                <li key={a.id} className="epuxua-card p-3 border-l-4 border-l-slate-200">
                  <p className="text-sm">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(a.created_at)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  }

  return null
}

function MiniList({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: React.ReactNode[]
}) {
  return (
    <div className="epuxua-card p-4">
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul>{items}</ul>
      )}
    </div>
  )
}

function DataTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string
  headers: string[]
  rows: string[][]
  empty: string
}) {
  return (
    <div className="epuxua-card overflow-hidden">
      <h3 className="text-sm font-bold px-5 pt-5 pb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-muted/40 text-left">
              {headers.map((h) => (
                <th key={h} className="px-4 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-border/60">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-4 py-2 text-xs",
                        j === row.length - 1 && "text-right font-medium tabular-nums"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
