"use client"

import Link from "next/link"
import { ExternalLink, Calendar, User2, Building2 } from "lucide-react"
import { formatDate } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "../lifecycle-badge"
import { projectTypeLabel } from "../../lib/project-type"
import { projectEntityLabel } from "../../lib/project-utils"
import type { ProjectDetail } from "@/types/project"
import type { Contract } from "@/types/contract"

interface ExpedienteHeaderProps {
  project: ProjectDetail
  primaryContract: Contract | null
  dateRange: { start: string | null; end: string | null }
  supervisorName: string | null
}

export function ExpedienteHeader({
  project,
  primaryContract,
  dateRange,
  supervisorName,
}: ExpedienteHeaderProps) {
  const entity = projectEntityLabel(project)
  const secopUrl = primaryContract?.secop_url

  return (
    <header className="epuxua-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--corporate-blue)] font-mono">
              {project.project_code}
            </span>
            <LifecycleBadge status={project.lifecycle_status} />
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {projectTypeLabel(project.project_type)}
            </span>
            <span className="text-xs text-muted-foreground">{project.year}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {project.name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 size={14} className="shrink-0" />
              <span>
                <span className="text-[10px] uppercase font-semibold tracking-wide block text-muted-foreground/80">
                  Entidad
                </span>
                {entity}
              </span>
            </div>
            {project.manager_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User2 size={14} className="shrink-0" />
                <span>
                  <span className="text-[10px] uppercase font-semibold tracking-wide block text-muted-foreground/80">
                    Gerente asignado
                  </span>
                  {project.manager_name}
                </span>
              </div>
            )}
            {supervisorName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User2 size={14} className="shrink-0" />
                <span>
                  <span className="text-[10px] uppercase font-semibold tracking-wide block text-muted-foreground/80">
                    Supervisor principal
                  </span>
                  {supervisorName}
                </span>
              </div>
            )}
            {(dateRange.start || dateRange.end) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} className="shrink-0" />
                <span>
                  <span className="text-[10px] uppercase font-semibold tracking-wide block text-muted-foreground/80">
                    Vigencia
                  </span>
                  {dateRange.start ? formatDate(dateRange.start) : "—"}
                  {" → "}
                  {dateRange.end ? formatDate(dateRange.end) : "—"}
                </span>
              </div>
            )}
          </div>

          {primaryContract?.object && (
            <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-[var(--corporate-blue)]/30 pl-3">
              <span className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground block mb-0.5">
                Objeto contractual
              </span>
              {primaryContract.object}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {secopUrl && (
            <a
              href={secopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--corporate-blue)]/30 bg-[var(--corporate-blue)]/5 text-xs font-semibold text-[var(--corporate-blue)] hover:bg-[var(--corporate-blue)]/10 transition-colors"
            >
              Ver en SECOP <ExternalLink size={14} />
            </a>
          )}
          {project.primary_contract_id && project.primary_contract_number && (
            <Link
              href={`/proyectos/${project.id}/contratos/${project.primary_contract_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[var(--corporate-blue)]/30 transition-colors"
            >
              Contrato {project.primary_contract_number}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
