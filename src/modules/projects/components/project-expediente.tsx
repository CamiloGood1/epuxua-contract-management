"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { ExpedienteHeader } from "./expediente/expediente-header"
import { ExpedienteKpis } from "./expediente/expediente-kpis"
import { ExpedienteTabs } from "./expediente/expediente-tabs"
import { ExpedienteTabPanels } from "./expediente/expediente-tab-panels"
import { ExpedienteSidebar } from "./expediente/expediente-sidebar"
import { projectDateRange, upcomingDeadlines } from "../lib/expediente-utils"
import type { ProjectExpedienteData } from "@/types/project-expediente"
import type { ExpedienteTabId } from "@/types/project-expediente"

const VALID_TABS = new Set<ExpedienteTabId>([
  "resumen",
  "estructura",
  "financiero",
  "seguimiento",
  "documentos",
  "indicadores",
  "alertas",
])

interface ProjectExpedienteProps {
  data: ProjectExpedienteData
  initialTab?: string
  canEdit?: boolean
}

export function ProjectExpediente({
  data,
  initialTab,
  canEdit = false,
}: ProjectExpedienteProps) {
  const defaultTab: ExpedienteTabId =
    initialTab && VALID_TABS.has(initialTab as ExpedienteTabId)
      ? (initialTab as ExpedienteTabId)
      : "resumen"

  const [tab, setTab] = useState<ExpedienteTabId>(defaultTab)

  const { project, primary_contract, contract_tree, assignments, alerts } = data
  const dateRange = projectDateRange(primary_contract, contract_tree)
  const deadlines = upcomingDeadlines(contract_tree)
  const supervisorName =
    primary_contract?.supervisor_name ??
    contract_tree.find((n) => n.contract_role === "PRINCIPAL")?.supervisor_name ??
    contract_tree[0]?.supervisor_name ??
    null

  return (
    <div className="max-w-screen-2xl mx-auto pb-8 space-y-5">
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Volver a proyectos
      </Link>

      {data.load_warnings && data.load_warnings.length > 0 && (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-medium">Algunas secciones no pudieron cargarse</p>
            <p className="mt-1 text-amber-800/90">
              El expediente se muestra con datos parciales. Secciones afectadas:{" "}
              {data.load_warnings.join(", ")}.
            </p>
          </div>
        </div>
      )}

      <ExpedienteHeader
        project={project}
        primaryContract={primary_contract}
        dateRange={dateRange}
        supervisorName={supervisorName}
      />

      <ExpedienteKpis
        project={project}
        financial={data.financial}
        computed={data.computed}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
        <main className="space-y-4 min-w-0">
          <ExpedienteTabs
            active={tab}
            onChange={setTab}
            alertCount={data.computed.open_alerts}
          />
          <div className="min-h-[360px]">
            <ExpedienteTabPanels data={data} tab={tab} />
          </div>
        </main>

        <ExpedienteSidebar
          projectId={project.id}
          assignments={assignments}
          supervisorName={supervisorName}
          deadlines={deadlines}
          alerts={alerts}
          updatedAt={project.updated_at}
        />
      </div>

      {!canEdit && (
        <p className="text-xs text-muted-foreground text-center">
          Modo solo lectura — su rol no permite editar proyectos.
        </p>
      )}
    </div>
  )
}
