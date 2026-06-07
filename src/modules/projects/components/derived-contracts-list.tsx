"use client"

import Link from "next/link"
import { ChevronRight, FileText } from "lucide-react"
import { formatCOP } from "@/modules/contracts/lib/status"
import { StatusBadge } from "@/modules/contracts/components/status-badge"
import type { ProjectContractTreeNode } from "@/types/project"

interface DerivedContractsListProps {
  projectId: string
  nodes: ProjectContractTreeNode[]
  /** Si true, muestra también el contrato principal */
  includePrincipal?: boolean
}

export function DerivedContractsList({
  projectId,
  nodes,
  includePrincipal = false,
}: DerivedContractsListProps) {
  const principal = nodes.find((n) => n.contract_role === "PRINCIPAL")
  const derived = nodes.filter((n) => n.contract_role === "DERIVADO")

  if (!includePrincipal && derived.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Este proyecto no tiene contratos derivados registrados.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {includePrincipal && principal && (
        <ContractRow projectId={projectId} node={principal} variant="principal" />
      )}
      {derived.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-2">
          Sin contratos derivados vinculados al interadministrativo.
        </p>
      ) : (
        derived.map((node) => (
          <ContractRow key={node.contract_id} projectId={projectId} node={node} variant="derived" />
        ))
      )}
    </div>
  )
}

function ContractRow({
  projectId,
  node,
  variant,
}: {
  projectId: string
  node: ProjectContractTreeNode
  variant: "principal" | "derived"
}) {
  const href = `/proyectos/${projectId}/contratos/${node.contract_id}`

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-[var(--corporate-blue)]/40 hover:shadow-sm transition-all"
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          variant === "principal"
            ? "bg-[var(--corporate-blue)]/10 text-[var(--corporate-blue)]"
            : "bg-[var(--institutional-gold)]/15 text-[var(--institutional-gold)]"
        }`}
      >
        <FileText size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-[var(--corporate-blue)]">
            {node.contract_number}
          </span>
          {node.status && <StatusBadge status={node.status} size="sm" />}
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {variant === "principal" ? "Principal" : "Derivado"}
          </span>
        </div>
        {node.object && (
          <p className="text-xs text-foreground line-clamp-2">{node.object}</p>
        )}
        <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-muted-foreground">
          {node.contractor_name && <span>{node.contractor_name}</span>}
          {node.final_value != null && (
            <span className="font-medium text-foreground">{formatCOP(node.final_value)}</span>
          )}
          {node.paid_value != null && node.final_value != null && node.final_value > 0 && (
            <span>
              Pagado {((node.paid_value / node.final_value) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <ChevronRight
        size={18}
        className="text-muted-foreground group-hover:text-[var(--corporate-blue)] shrink-0"
      />
    </Link>
  )
}
