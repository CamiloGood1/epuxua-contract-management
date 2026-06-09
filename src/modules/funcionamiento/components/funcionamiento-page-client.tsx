"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { LifecycleBadge } from "@/modules/projects/components/lifecycle-badge"
import type { ProjectDetail } from "@/types/project"
import { NewFuncionamientoContractModal } from "./new-funcionamiento-contract-modal"

interface FuncionamientoPageClientProps {
  projects: ProjectDetail[]
}

function ProjectTree({ project }: { project: ProjectDetail }) {
  const [open, setOpen] = useState(true)
  const [showNewContract, setShowNewContract] = useState(false)

  return (
    <div className="epuxua-card overflow-hidden">
      {/* Cabecera del proyecto contenedor */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform shrink-0",
            !open && "-rotate-90"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[var(--corporate-blue)]">
              {project.project_code}
            </span>
            <LifecycleBadge status={project.lifecycle_status} size="sm" />
            <span className="text-xs text-muted-foreground">{project.year}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.name}</p>
        </div>
        <div className="text-right shrink-0 ml-4 hidden sm:block">
          <p className="text-xs font-semibold">{formatCOP(project.total_value)}</p>
          <p className="text-[10px] text-muted-foreground">
            {Number(project.execution_pct ?? 0).toFixed(0)}% ejec.
          </p>
        </div>
        {(project.active_alerts_count ?? 0) > 0 && (
          <span className="flex items-center gap-0.5 text-red-600 shrink-0">
            <AlertTriangle size={13} />
            <span className="text-[10px] font-bold">{project.active_alerts_count}</span>
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            {/* Sub-contratos / expediente */}
            <div className="px-5 py-3 space-y-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contratos asociados
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/proyectos/${project.id}`}
                    className="text-[10px] font-semibold text-[var(--corporate-blue)] hover:underline"
                  >
                    Ver expediente →
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowNewContract(true)
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-[var(--corporate-blue)]/10 text-[var(--corporate-blue)] hover:bg-[var(--corporate-blue)]/20"
                  >
                    <Plus size={10} />
                    Agregar contrato
                  </button>
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Valor total</p>
                  <p className="text-xs font-bold">{formatCOP(project.total_value)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Ejecutado</p>
                  <p className="text-xs font-bold">{formatCOP(project.executed_value)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Pagado</p>
                  <p className="text-xs font-bold">{formatCOP(project.paid_value)}</p>
                </div>
              </div>

              {/* Info de contrato principal si existe */}
              {project.primary_contract_number ? (
                <Link
                  href={
                    project.primary_contract_id
                      ? `/proyectos/${project.id}/contratos/${project.primary_contract_id}`
                      : `/proyectos/${project.id}`
                  }
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <FileText size={14} className="text-teal-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {project.primary_contract_number}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Contrato principal</p>
                  </div>
                  <TrendingUp size={12} className="text-muted-foreground" />
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center italic">
                  Sin contrato principal — agregar desde el expediente
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showNewContract && (
        <NewFuncionamientoContractModal
          open={showNewContract}
          onClose={() => setShowNewContract(false)}
          project={project}
        />
      )}
    </div>
  )
}

export function FuncionamientoPageClient({ projects }: FuncionamientoPageClientProps) {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  // Agrupar por año
  const byYear = projects.reduce<Record<number, ProjectDetail[]>>((acc, p) => {
    acc[p.year] = acc[p.year] ?? []
    acc[p.year].push(p)
    return acc
  }, {})

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)

  if (projects.length === 0) {
    return (
      <div className="epuxua-card flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          No hay proyectos de funcionamiento creados.
        </p>
        <button
          type="button"
          onClick={() => setShowNewProjectModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold"
        >
          <Plus size={14} />
          Crear FUNCIONAMIENTO-{new Date().getFullYear()}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projects.length} proyecto{projects.length !== 1 ? "s" : ""} contenedor
          {projects.length !== 1 ? "es" : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowNewProjectModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--corporate-blue)] text-white text-xs font-semibold hover:opacity-90"
        >
          <Plus size={13} />
          Nuevo Contrato Funcionamiento
        </button>
      </div>

      {years.map((yr) => (
        <div key={yr} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-teal-500" />
            <h3 className="text-sm font-bold text-foreground">
              FUNCIONAMIENTO — {yr}
            </h3>
            <span className="text-[10px] text-muted-foreground">
              ({byYear[yr].length} proyecto{byYear[yr].length !== 1 ? "s" : ""})
            </span>
          </div>
          <div className="space-y-2 pl-4">
            {byYear[yr].map((p) => (
              <ProjectTree key={p.id} project={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
