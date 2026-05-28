"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { pct } from "../lib/status"

interface ProgressBarProps {
  value: number | null | undefined
  label: string
  colorClass?: string
  animationDelay?: number
  showValue?: boolean
  size?: "sm" | "md"
}

export function ProgressBar({
  value,
  label,
  colorClass = "bg-indigo-500",
  animationDelay = 0,
  showValue = true,
  size = "md",
}: ProgressBarProps) {
  const v = pct(value)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn("text-muted-foreground font-medium", size === "sm" ? "text-[10px]" : "text-[11px]")}>
          {label}
        </span>
        {showValue && (
          <span className={cn("font-bold tabular-nums", size === "sm" ? "text-[10px]" : "text-xs")}>
            {v}%
          </span>
        )}
      </div>
      <div className={cn("rounded-full bg-muted overflow-hidden", size === "sm" ? "h-1" : "h-1.5")}>
        <motion.div
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.7, delay: animationDelay, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

interface DualProgressProps {
  physical: number | null | undefined
  financial: number | null | undefined
  animationDelay?: number
}

export function DualProgress({ physical, financial, animationDelay = 0 }: DualProgressProps) {
  return (
    <div className="space-y-2">
      <ProgressBar
        value={physical}
        label="Avance físico"
        colorClass="bg-emerald-500"
        animationDelay={animationDelay}
      />
      <ProgressBar
        value={financial}
        label="Avance financiero"
        colorClass="bg-indigo-500"
        animationDelay={animationDelay + 0.08}
      />
    </div>
  )
}
