"use client"

import Link from "next/link"
import { Users, Clock, Bell, RefreshCw } from "lucide-react"
import { formatDate } from "@/modules/contracts/lib/status"
import { cn } from "@/lib/utils"
import type { ProjectAssignment, ProjectAlert } from "@/types/project"
import type { UpcomingDeadline } from "../../lib/expediente-utils"
import { alertSeverityOrder } from "../../lib/expediente-utils"

interface ExpedienteSidebarProps {
  projectId: string
  assignments: ProjectAssignment[]
  supervisorName?: string | null
  deadlines: UpcomingDeadline[]
  alerts: ProjectAlert[]
  updatedAt: string
}

const SEVERITY_STYLES: Record<string, string> = {
  critica: "bg-red-100 text-red-800 border-red-200",
  alta: "bg-orange-100 text-orange-800 border-orange-200",
  media: "bg-amber-100 text-amber-800 border-amber-200",
  baja: "bg-blue-50 text-blue-700 border-blue-200",
  info: "bg-muted text-muted-foreground border-border",
}

export function ExpedienteSidebar({
  projectId,
  assignments,
  supervisorName,
  deadlines,
  alerts,
  updatedAt,
}: ExpedienteSidebarProps) {
  const managers = assignments.filter((a) => a.assignment_role === "GERENTE_PROYECTO")
  const consultants = assignments.filter((a) => a.assignment_role === "CONSULTOR_PROYECTO")
  const openAlerts = [...alerts]
    .filter((a) => a.is_active)
    .sort((a, b) => alertSeverityOrder(a.severity) - alertSeverityOrder(b.severity))
    .slice(0, 5)

  return (
    <aside className="space-y-4 xl:sticky xl:top-4">
      <div className="epuxua-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[var(--corporate-blue)]" />
          <h3 className="text-sm font-bold">Equipo del proyecto</h3>
        </div>

        {managers.length === 0 && consultants.length === 0 && !supervisorName ? (
          <p className="text-xs text-muted-foreground">Sin asignaciones registradas.</p>
        ) : (
          <div className="space-y-3">
            {supervisorName && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                  Supervisor principal
                </p>
                <TeamRow name={supervisorName} active />
              </div>
            )}
            {managers.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                  Gerente proyecto
                </p>
                <ul className="space-y-1.5">
                  {managers.map((a) => (
                    <TeamRow key={a.id} name={a.user_name ?? "—"} active={a.active} />
                  ))}
                </ul>
              </div>
            )}
            {consultants.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                  Consultores
                </p>
                <ul className="space-y-1.5">
                  {consultants.map((a) => (
                    <TeamRow key={a.id} name={a.user_name ?? "—"} active={a.active} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="epuxua-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold">Próximos vencimientos</h3>
        </div>
        {deadlines.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin vencimientos próximos.</p>
        ) : (
          <ul className="space-y-2">
            {deadlines.map((d) => (
              <li key={d.contract_id}>
                <Link
                  href={`/proyectos/${projectId}/contratos/${d.contract_id}`}
                  className="block text-xs hover:text-[var(--corporate-blue)] transition-colors"
                >
                  <span className="font-mono font-semibold">{d.contract_number}</span>
                  <span className="text-muted-foreground block">
                    {formatDate(d.end_date)} · {d.days_remaining} días
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="epuxua-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-red-600" />
            <h3 className="text-sm font-bold">Alertas abiertas</h3>
          </div>
          {openAlerts.length > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
              {openAlerts.length}
            </span>
          )}
        </div>
        {openAlerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin alertas activas.</p>
        ) : (
          <ul className="space-y-2">
            {openAlerts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "text-xs p-2 rounded-lg border",
                  SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.info
                )}
              >
                <p className="font-semibold leading-snug">{a.title}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="epuxua-card p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw size={12} />
        <span>Última actualización: {formatDate(updatedAt)}</span>
      </div>
    </aside>
  )
}

function TeamRow({ name, active }: { name: string; active: boolean }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="font-medium truncate">{name}</span>
      <span
        className={cn(
          "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2",
          active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
        )}
      >
        {active ? "Activo" : "Hist."}
      </span>
    </li>
  )
}
