"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  FileText,
  GitBranch,
  ExternalLink,
  Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP, formatDate } from "@/modules/contracts/lib/status"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import type { ExpedienteContractNode } from "@/types/project-expediente"

interface ExpandableContractTreeProps {
  projectId: string
  projectCode: string
  nodes: ExpedienteContractNode[]
}

export function ExpandableContractTree({
  projectId,
  projectCode,
  nodes,
}: ExpandableContractTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>(["project-root"])
    const principal = nodes.find((n) => n.contract_role === "PRINCIPAL")
    if (principal) initial.add(principal.contract_id)
    return initial
  })

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const principal = nodes.find((n) => n.contract_role === "PRINCIPAL")
  const derived = nodes.filter((n) => n.contract_role === "DERIVADO")
  const operativos = nodes.filter((n) => n.contract_role === "OPERATIVO")

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Este proyecto no tiene contratos vinculados en la estructura contractual.
      </p>
    )
  }

  return (
    <div className="epuxua-card p-4 sm:p-5 space-y-1">
      <ProjectRoot
        projectCode={projectCode}
        expanded={expanded.has("project-root")}
        onToggle={() => toggle("project-root")}
        childCount={nodes.length}
      />

      {expanded.has("project-root") && (
        <div className="ml-4 sm:ml-6 border-l-2 border-[var(--corporate-blue)]/20 pl-3 sm:pl-4 space-y-1">
          {principal && (
            <ContractNode
              node={principal}
              projectId={projectId}
              expanded={expanded.has(principal.contract_id)}
              onToggle={() => toggle(principal.contract_id)}
              variant="principal"
            >
              {expanded.has(principal.contract_id) && derived.length > 0 && (
                <div className="ml-4 sm:ml-6 border-l-2 border-[var(--institutional-gold)]/30 pl-3 sm:pl-4 space-y-1 mt-1">
                  {derived.map((child, i) => (
                    <ContractNode
                      key={child.contract_id}
                      node={child}
                      projectId={projectId}
                      expanded={expanded.has(child.contract_id)}
                      onToggle={() => toggle(child.contract_id)}
                      variant="derived"
                      isLast={i === derived.length - 1}
                    />
                  ))}
                </div>
              )}
            </ContractNode>
          )}

          {operativos.map((op) => (
            <ContractNode
              key={op.contract_id}
              node={op}
              projectId={projectId}
              expanded={expanded.has(op.contract_id)}
              onToggle={() => toggle(op.contract_id)}
              variant="operativo"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectRoot({
  projectCode,
  expanded,
  onToggle,
  childCount,
}: {
  projectCode: string
  expanded: boolean
  onToggle: () => void
  childCount: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-muted/40 transition-colors text-left"
    >
      {expanded ? (
        <ChevronDown size={16} className="text-[var(--corporate-blue)] shrink-0" />
      ) : (
        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
      )}
      <FolderKanban size={18} className="text-[var(--corporate-blue)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Proyecto {projectCode}</p>
        <p className="text-[10px] text-muted-foreground">
          {childCount} contrato{childCount !== 1 ? "s" : ""} en estructura
        </p>
      </div>
    </button>
  )
}

function ContractNode({
  node,
  projectId,
  expanded,
  onToggle,
  variant,
  isLast,
  children,
}: {
  node: ExpedienteContractNode
  projectId: string
  expanded: boolean
  onToggle: () => void
  variant: "principal" | "derived" | "operativo"
  isLast?: boolean
  children?: React.ReactNode
}) {
  const href = `/proyectos/${projectId}/contratos/${node.contract_id}`
  const Icon = variant === "derived" ? GitBranch : FileText

  return (
    <div className={cn("space-y-1", !isLast && variant === "derived" && "pb-0.5")}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-start gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="p-3 hover:bg-muted/30 shrink-0"
            aria-label={expanded ? "Contraer" : "Expandir"}
          >
            {expanded ? (
              <ChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={14} className="text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0 py-3 pr-3">
            <div className="flex flex-wrap items-center gap-2">
              <Icon
                size={14}
                className={
                  variant === "principal"
                    ? "text-[var(--corporate-blue)]"
                    : variant === "derived"
                      ? "text-[var(--institutional-gold)]"
                      : "text-emerald-600"
                }
              />
              <Link
                href={href}
                className="text-sm font-bold text-[var(--corporate-blue)] hover:underline font-mono"
              >
                {node.contract_number}
              </Link>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {variant === "principal" ? "Principal" : variant === "derived" ? "Derivado" : "Operativo"}
              </span>
              {node.status && <StatusBadge status={node.status} size="sm" />}
            </div>
            {node.object && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{node.object}</p>
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t border-border/60 bg-muted/20">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
              <Detail label="Contratista" value={node.contractor_name} />
              <Detail label="Supervisor" value={node.supervisor_name} />
              <Detail
                label="Valor"
                value={node.final_value != null ? formatCOP(node.final_value) : null}
              />
              <Detail
                label="Pagado"
                value={node.paid_value != null ? formatCOP(node.paid_value) : null}
              />
              <Detail label="Inicio" value={node.start_date ? formatDate(node.start_date) : null} />
              <Detail label="Fin" value={node.end_date ? formatDate(node.end_date) : null} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/40">
              <Link
                href={href}
                className="text-xs font-semibold text-[var(--corporate-blue)] hover:underline"
              >
                Ver expediente completo →
              </Link>
              {node.secop_url && (
                <a
                  href={node.secop_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  SECOP <ExternalLink size={11} />
                </a>
              )}
              {node.documents.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip size={11} />
                  {node.documents.length} documento{node.documents.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground mt-0.5">{value ?? "—"}</p>
    </div>
  )
}
