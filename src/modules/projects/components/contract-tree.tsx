"use client"

import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import type { ProjectContractTreeNode } from "@/types/project"

interface ContractTreeProps {
  nodes: ProjectContractTreeNode[]
}

const ROLE_LABELS = {
  PRINCIPAL: "Principal",
  DERIVADO: "Derivado",
  OPERATIVO: "Operativo",
} as const

function TreeNode({ node }: { node: ProjectContractTreeNode }) {
  const indent = node.depth * 24

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-[var(--corporate-blue)]/30 transition-colors",
        node.depth > 0 && "ml-4"
      )}
      style={{ marginLeft: indent > 0 ? indent : undefined }}
    >
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
          <a
            href={node.secop_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            title="Ver en SECOP"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <Link
          href={`/contracts/${node.contract_id}`}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          title="Ver contrato"
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}

export function ContractTree({ nodes }: ContractTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No hay contratos asociados a este proyecto.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <TreeNode key={node.contract_id} node={node} />
      ))}
    </div>
  )
}
