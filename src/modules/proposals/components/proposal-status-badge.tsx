import { PROPOSAL_STATUS_CONFIG } from "@/types/proposals"
import type { ProposalStatus } from "@/types/proposals"

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const cfg = PROPOSAL_STATUS_CONFIG[status] ?? {
    label: status, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
