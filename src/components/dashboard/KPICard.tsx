"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { KPICardData } from "@/types"

function useCountUp(target: number, enabled: boolean, duration = 1000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const steps = 40
    const stepDuration = duration / steps
    const increment = target / steps
    let current = 0
    let frame = 0
    const tick = () => {
      frame = window.setTimeout(() => {
        current += increment
        if (current >= target) setCount(target)
        else {
          setCount(Math.round(current))
          tick()
        }
      }, stepDuration)
    }
    tick()
    return () => window.clearTimeout(frame)
  }, [target, enabled, duration])
  return count
}

const ACCENT: Record<string, { iconBg: string; iconColor: string; spark: string }> = {
  indigo: { iconBg: "bg-[#e7eefe]", iconColor: "text-[#345bab]", spark: "bg-[#345bab]" },
  emerald: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600", spark: "bg-emerald-500" },
  amber: { iconBg: "bg-amber-50", iconColor: "text-amber-600", spark: "bg-amber-500" },
  violet: { iconBg: "bg-violet-50", iconColor: "text-violet-600", spark: "bg-violet-500" },
  rose: { iconBg: "bg-rose-50", iconColor: "text-rose-600", spark: "bg-rose-500" },
  purple: { iconBg: "bg-purple-50", iconColor: "text-purple-600", spark: "bg-purple-500" },
}

function accentFromGradient(gradient: string) {
  if (gradient.includes("emerald")) return ACCENT.emerald
  if (gradient.includes("amber") || gradient.includes("orange")) return ACCENT.amber
  if (gradient.includes("rose") || gradient.includes("red")) return ACCENT.rose
  if (gradient.includes("violet") || gradient.includes("purple")) return ACCENT.violet
  return ACCENT.indigo
}

interface KPICardProps extends KPICardData {
  index?: number
}

export function KPICard({
  label,
  value,
  formattedValue,
  isCurrency,
  change,
  icon: Icon,
  gradient,
  index = 0,
}: KPICardProps) {
  const [mounted, setMounted] = useState(false)
  const accent = accentFromGradient(gradient)
  const count = useCountUp(value, mounted && !isCurrency)
  useEffect(() => setMounted(true), [])

  const displayValue = isCurrency ? formattedValue : count.toLocaleString("es-CO")

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="epuxua-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", accent.iconBg)}>
          <Icon className={cn("w-5 h-5", accent.iconColor)} />
        </div>
        {change !== 0 && (
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground tracking-tight mt-0.5 tabular-nums">
          {displayValue}
        </p>
      </div>
      <div className="h-8 flex items-end gap-0.5 opacity-60">
        {[35, 55, 40, 70, 45, 80, 60].map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-t-sm min-h-[4px]", accent.spark)}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </motion.div>
  )
}
