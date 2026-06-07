"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ExternalLink, Users, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP, formatDate, pct } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "./lifecycle-badge"
import { ContractTree } from "./contract-tree"
import { projectTypeLabel } from "../lib/project-type"
import type {
  ProjectDetail,
  ProjectContractTreeNode,
  ProjectFollowup,
  ProjectAssignment,
  ProjectDocument,
  ProjectIndicator,
  ProjectAlert,
  ProjectFinancialSummary,
  ProjectPayment,
} from "@/types/project"

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "estructura", label: "Estructura Contractual" },
  { id: "financiero", label: "Financiero" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "documentos", label: "Documentos" },
  { id: "indicadores", label: "Indicadores" },
  { id: "alertas", label: "Alertas" },
] as const

type TabId = (typeof TABS)[number]["id"]

interface ProjectExpedienteProps {
  project: ProjectDetail
  contractTree: ProjectContractTreeNode[]
  followups: ProjectFollowup[]
  assignments: ProjectAssignment[]
  documents: ProjectDocument[]
  indicators: ProjectIndicator[]
  alerts: ProjectAlert[]
  financial: ProjectFinancialSummary | null
  payments: ProjectPayment[]
  canEdit?: boolean
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground mt-0.5">{value ?? "—"}</p>
    </div>
  )
}

function managementFeeDisplay(project: ProjectDetail): string {
  if (!project.management_fee_type) return formatCOP(project.management_fee_amount)
  if (project.management_fee_type === "PORCENTAJE") {
    return `${project.management_fee_value ?? 0}% · ${formatCOP(project.management_fee_amount)}`
  }
  return `Valor fijo · ${formatCOP(project.management_fee_amount)}`
}

export function ProjectExpediente({
  project,
  contractTree,
  followups,
  assignments,
  documents,
  indicators,
  alerts,
  financial,
  payments,
  canEdit = false,
}: ProjectExpedienteProps) {
  const [tab, setTab] = useState<TabId>("resumen")

  const entity = project.secretaria ?? project.area_name ?? "—"
  const activeManagers = assignments.filter(
    (a) => a.active && a.assignment_role === "GERENTE_PROYECTO"
  )

  const financialChart = financial
    ? [
        { name: "Bienes/Serv.", value: financial.goods_services_value },
        { name: "Cuota ger.", value: financial.management_fee_amount },
        { name: "Ejecutado", value: financial.executed_value },
        { name: "Disponible", value: financial.available_balance },
      ]
    : []

  const docsByType = documents.reduce<Record<string, ProjectDocument[]>>((acc, doc) => {
    const type = doc.document_type ?? "Sin clasificar"
    if (!acc[type]) acc[type] = []
    acc[type].push(doc)
    return acc
  }, {})

  const activeAlerts = alerts.filter((a) => a.is_active)
  const historicalAlerts = alerts.filter((a) => !a.is_active)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-bold text-[var(--corporate-blue)]">
              {project.project_code}
            </span>
            <LifecycleBadge status={project.lifecycle_status} />
            <span className="text-xs text-muted-foreground">
              {projectTypeLabel(project.project_type)} · {project.year}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{entity}</p>
        </div>
        {project.primary_contract_number && (
          <Link
            href={`/contracts/${project.primary_contract_id}`}
            className="text-xs font-medium text-[var(--corporate-blue)] hover:underline"
          >
            Contrato principal: {project.primary_contract_number}
          </Link>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Valor total", value: formatCOP(project.total_value) },
          { label: "Ejecutado", value: formatCOP(project.executed_value) },
          { label: "% Ejecución", value: `${pct(project.execution_pct).toFixed(1)}%` },
          { label: "Alertas", value: String(project.active_alerts_count ?? 0) },
        ].map((kpi) => (
          <div key={kpi.label} className="epuxua-card p-4">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-lg font-bold mt-1 tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto scrollbar-thin">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
                tab === t.id
                  ? "border-[var(--corporate-blue)] text-[var(--corporate-blue)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.id === "alertas" && (project.active_alerts_count ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-100 text-red-700 text-[9px] font-bold">
                  {project.active_alerts_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[320px]">
        {tab === "resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="epuxua-card p-5 space-y-4">
              <h3 className="text-sm font-bold">Información general</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código" value={project.project_code} />
                <Field label="Año" value={project.year} />
                <Field label="Tipo" value={projectTypeLabel(project.project_type)} />
                <Field label="Entidad" value={entity} />
                <Field label="Cuota gerencia" value={managementFeeDisplay(project)} />
                <Field label="Bienes y servicios" value={formatCOP(project.goods_services_value)} />
                <Field label="Saldo disponible" value={formatCOP(project.available_balance)} />
                <Field
                  label="Contratos asociados"
                  value={contractTree.length || (project.derived_count ?? 0) + (project.primary_contract_id ? 1 : 0)}
                />
              </div>
              {project.observations && (
                <Field label="Observaciones" value={project.observations} />
              )}
            </div>
            <div className="epuxua-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--corporate-blue)]" />
                <h3 className="text-sm font-bold">Equipo del proyecto</h3>
              </div>
              {activeManagers.length === 0 && assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin asignaciones registradas.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(assignments.length ? assignments : []).map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{a.user_name ?? "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.assignment_role === "GERENTE_PROYECTO"
                            ? "Gerente de proyecto"
                            : "Consultor"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          a.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {a.active ? "Activo" : "Histórico"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "estructura" && <ContractTree nodes={contractTree} />}

        {tab === "financiero" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="epuxua-card p-5">
                <h3 className="text-sm font-bold mb-4">Resumen financiero</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Valor total" value={formatCOP(financial?.total_value ?? project.total_value)} />
                  <Field label="Ejecutado" value={formatCOP(financial?.executed_value ?? project.executed_value)} />
                  <Field label="Cuota gerencia" value={managementFeeDisplay(project)} />
                  <Field label="Disponible" value={formatCOP(financial?.available_balance ?? project.available_balance)} />
                </div>
              </div>
              {financialChart.length > 0 && (
                <div className="epuxua-card p-5">
                  <h3 className="text-sm font-bold mb-4">Composición</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={financialChart} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCOP(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip formatter={(v) => formatCOP(Number(v))} />
                      <Bar dataKey="value" fill="#345bab" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="epuxua-card overflow-hidden">
              <h3 className="text-sm font-bold px-5 pt-5 pb-3">Pagos del proyecto</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border bg-muted/40 text-left">
                      <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Fecha</th>
                      <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Contrato</th>
                      <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Descripción</th>
                      <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          Sin pagos registrados.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="border-b border-border/60">
                          <td className="px-4 py-2">{formatDate(p.payment_date)}</td>
                          <td className="px-4 py-2 text-xs">{p.contract_number ?? "—"}</td>
                          <td className="px-4 py-2 text-xs max-w-xs truncate">{p.description ?? "—"}</td>
                          <td className="px-4 py-2 text-right font-medium tabular-nums">
                            {formatCOP(p.net_value)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "seguimiento" && (
          <div className="space-y-3">
            {followups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Sin registros de seguimiento.
              </p>
            ) : (
              followups.map((f) => (
                <div key={f.id} className="epuxua-card p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{formatDate(f.followup_date)}</span>
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
                  {f.observations && <p className="text-sm">{f.observations}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {f.physical_progress != null && (
                      <span>Avance físico: {f.physical_progress}%</span>
                    )}
                    {f.financial_progress != null && (
                      <span>Avance financiero: {f.financial_progress}%</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "documentos" && (
          <div className="space-y-6">
            {Object.keys(docsByType).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Sin documentos vinculados. Los archivos se gestionan en SharePoint.
              </p>
            ) : (
              Object.entries(docsByType).map(([type, docs]) => (
                <div key={type}>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    {type}
                  </h3>
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li
                        key={doc.id}
                        className="epuxua-card p-3 flex items-center justify-between gap-3"
                      >
                        <span className="text-sm font-medium truncate">{doc.name}</span>
                        <div className="flex gap-2 shrink-0">
                          {doc.sharepoint_url && (
                            <a
                              href={doc.sharepoint_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--corporate-blue)] hover:underline"
                            >
                              SharePoint <ExternalLink size={12} />
                            </a>
                          )}
                          {doc.secop_document_url && (
                            <a
                              href={doc.secop_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
                            >
                              SECOP <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "indicadores" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground text-center py-12">
                Sin indicadores registrados para este proyecto.
              </p>
            ) : (
              indicators.map((ind) => (
                <div key={ind.id} className="epuxua-card p-4">
                  <p className="text-xs font-bold text-[var(--corporate-blue)]">
                    {ind.indicator_name}
                  </p>
                  <p className="text-2xl font-bold mt-2 tabular-nums">
                    {ind.indicator_value ?? "—"}
                    {ind.unit && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {ind.unit}
                      </span>
                    )}
                  </p>
                  {ind.target_value != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Meta: {ind.target_value} {ind.unit ?? ""}
                    </p>
                  )}
                </div>
              ))
            )}
            <div className="epuxua-card p-4 md:col-span-2 lg:col-span-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">Calculado</p>
              <p className="text-sm font-medium mt-2">Ejecución financiera</p>
              <p className="text-2xl font-bold tabular-nums">{pct(project.execution_pct).toFixed(1)}%</p>
            </div>
          </div>
        )}

        {tab === "alertas" && (
          <div className="space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-red-600" />
                <h3 className="text-sm font-bold">Alertas activas</h3>
              </div>
              {activeAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay alertas activas.</p>
              ) : (
                <ul className="space-y-2">
                  {activeAlerts.map((a) => (
                    <li key={a.id} className="epuxua-card p-4 border-l-4 border-red-400">
                      <p className="text-sm font-semibold">{a.title}</p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {historicalAlerts.length > 0 && (
              <section>
                <h3 className="text-sm font-bold mb-3 text-muted-foreground">Histórico</h3>
                <ul className="space-y-2 opacity-70">
                  {historicalAlerts.map((a) => (
                    <li key={a.id} className="epuxua-card p-3">
                      <p className="text-sm">{a.title}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {!canEdit && (
        <p className="text-xs text-muted-foreground text-center">
          Modo solo lectura — su rol no permite editar proyectos.
        </p>
      )}
    </div>
  )
}
