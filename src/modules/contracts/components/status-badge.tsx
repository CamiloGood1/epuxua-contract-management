"use client"

import { cn } from "@/lib/utils"
import { resolveStatus } from "../lib/status"

interface StatusBadgeProps {
  status: string | null | undefined
  size?: "sm" | "md"
  showDot?: boolean
}

export function StatusBadge({ status, size = "md", showDot = true }: StatusBadgeProps) {
  const cfg = resolveStatus(status)
  const Icon = cfg.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap",
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
        size === "sm"
          ? "text-[10px] px-2 py-0.5"
          : "text-xs px-2.5 py-1"
      )}
    >
      {showDot ? (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)} />
      ) : (
        <Icon size={size === "sm" ? 10 : 12} className="shrink-0" />
      )}
      {cfg.label}
    </span>
  )
}
