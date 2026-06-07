"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Building2,
  User2,
  Banknote,
  TrendingUp,
  GitBranch,
  FolderKanban,
} from "lucide-react"
import { formatCOP, pct } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "./lifecycle-badge"
import { projectTypeLabel } from "../lib/project-type"
import { projectEntityLabel, projectContractsCount } from "../lib/project-utils"
import type { ProjectDetail } from "@/types/project"

interface ProjectCardProps {
  project: ProjectDetail
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const entity = projectEntityLabel(project)
  const contractsCount = projectContractsCount(project)
  const derivedCount = project.derived_count ?? 0
  const isInteradmin = project.project_type === "INTERADMINISTRATIVO"

  return (
    <Link href={`/proyectos/${project.id}`} className="block">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
        whileHover={{ y: -3, transition: { duration: 0.18 } }}
        className="group relative bg-white border border-[#EAEAEA] rounded-xl overflow-hidden hover:border-[var(--corporate-blue)]/25 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="h-1 w-full shrink-0 bg-[var(--corporate-blue)]" />

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--corporate-blue)]/10">
              <FolderKanban size={18} className="text-[var(--corporate-blue)]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono tracking-wider">
                  {project.project_code} · {project.year}
                </code>
                <LifecycleBadge status={project.lifecycle_status} size="sm" />
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {project.name}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {projectTypeLabel(project.project_type)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {entity && entity !== "—" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 size={12} className="shrink-0" />
                <span className="truncate">{entity}</span>
              </div>
            )}
            {project.manager_name && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User2 size={12} className="shrink-0" />
                <span className="truncate">{project.manager_name}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5 bg-muted/40 rounded-xl p-3 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Banknote size={11} className="text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">
                  Valor total
                </span>
              </div>
              <p className="text-sm font-bold text-foreground leading-none truncate">
                {formatCOP(project.total_value)}
              </p>
            </div>
            <div className="flex flex-col gap-0.5 bg-muted/40 rounded-xl p-3 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp size={11} className="text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">
                  Ejecutado
                </span>
              </div>
              <p className="text-sm font-bold text-foreground leading-none truncate">
                {pct(project.execution_pct).toFixed(0)}%
              </p>
            </div>
          </div>

          {(isInteradmin || (contractsCount ?? 0) > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
              {isInteradmin && derivedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-[var(--institutional-gold)]/15 text-[var(--institutional-gold)]">
                  <GitBranch size={11} />
                  {derivedCount} derivado{derivedCount !== 1 ? "s" : ""}
                </span>
              )}
              {contractsCount != null && contractsCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {contractsCount} contrato{contractsCount !== 1 ? "s" : ""} en estructura
                </span>
              )}
              {(project.active_alerts_count ?? 0) > 0 && (
                <span className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-[9px] font-bold ml-auto">
                  {project.active_alerts_count}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.article>
    </Link>
  )
}
