"use client"

import { cn } from "@/lib/utils"
import { resolveLifecycle } from "../lib/lifecycle"

interface LifecycleBadgeProps {
  status: string | null | undefined
  size?: "sm" | "md"
}

export function LifecycleBadge({ status, size = "md" }: LifecycleBadgeProps) {
  const cfg = resolveLifecycle(status)
  const Icon = cfg.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap",
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
    >
      <Icon size={size === "sm" ? 10 : 12} className="shrink-0" />
      {cfg.label}
    </span>
  )
}
