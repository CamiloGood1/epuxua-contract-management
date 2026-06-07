"use client"

import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import type { ProjectContractTreeNode } from "@/types/project"

interface ContractTreeProps {
  projectId: string
  nodes: ProjectContractTreeNode[]
  projectCode?: string
}

const ROLE_LABELS = {
  PRINCIPAL: "Principal",
  DERIVADO: "Derivado",
  OPERATIVO: "Operativo",
} as const

function TreeNode({
  node,
  projectId,
  isLast,
}: {
  node: ProjectContractTreeNode
  projectId: string
  isLast?: boolean
}) {
  const href = `/proyectos/${projectId}/contratos/${node.contract_id}`
  const indent = node.depth * 28

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-[var(--corporate-blue)]/40 hover:shadow-sm transition-all",
        node.depth > 0 && "relative"
      )}
      style={{ marginLeft: indent > 0 ? indent : undefined }}
    >
      {node.depth > 0 && (
        <span
          className="absolute left-0 top-0 bottom-0 w-px bg-border"
          style={{ left: indent - 14 }}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "w-1 self-stretch rounded-full shrink-0",
          node.contract_role === "PRINCIPAL" && "bg-[var(--corporate-blue)]",
          node.contract_role === "DERIVADO" && "bg-[var(--institutional-gold)]",
          node.contract_role === "OPERATIVO" && "bg-emerald-500"
        )}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--corporate-blue)]">
            {node.contract_number}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {ROLE_LABELS[node.contract_role] ?? node.contract_role}
          </span>
          {node.status && <StatusBadge status={node.status} size="sm" />}
        </div>
        {node.object && (
          <p className="text-sm text-foreground line-clamp-2">{node.object}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {node.contractor_name && <span>{node.contractor_name}</span>}
          {node.final_value != null && (
            <span className="font-medium text-foreground">
              {formatCOP(node.final_value)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {node.secop_url && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.open(node.secop_url!, "_blank", "noopener,noreferrer")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                e.stopPropagation()
                window.open(node.secop_url!, "_blank", "noopener,noreferrer")
              }
            }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            title="Ver en SECOP"
          >
            <ExternalLink size={14} />
          </span>
        )}
        <ChevronRight
          size={16}
          className="text-muted-foreground group-hover:text-[var(--corporate-blue)]"
        />
      </div>
    </Link>
  )
}

export function ContractTree({ projectId, nodes, projectCode }: ContractTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No hay contratos asociados a este proyecto.
      </div>
    )
  }

  const principal = nodes.find((n) => n.contract_role === "PRINCIPAL")
  const derived = nodes.filter((n) => n.contract_role === "DERIVADO")
  const operativos = nodes.filter((n) => n.contract_role === "OPERATIVO")

  return (
    <div className="space-y-4">
      {projectCode && (
        <p className="text-sm font-semibold text-foreground">
          Proyecto <span className="text-[var(--corporate-blue)]">{projectCode}</span>
        </p>
      )}

      {principal && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Contrato principal
          </p>
          <TreeNode node={principal} projectId={projectId} />
        </div>
      )}

      {derived.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Contratos derivados ({derived.length})
          </p>
          {derived.map((node, i) => (
            <TreeNode
              key={node.contract_id}
              node={node}
              projectId={projectId}
              isLast={i === derived.length - 1}
            />
          ))}
        </div>
      )}

      {operativos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Contratos operativos ({operativos.length})
          </p>
          {operativos.map((node) => (
            <TreeNode key={node.contract_id} node={node} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  )
}
