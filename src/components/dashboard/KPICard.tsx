"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KPICardData } from "@/types"

function useCountUp(target: number, enabled: boolean, duration = 1200) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const steps = 50
    const stepDuration = duration / steps
    const increment = target / steps
    let current = 0
    let frame = 0

    const tick = () => {
      frame = window.setTimeout(() => {
        current += increment
        if (current >= target) {
          setCount(target)
        } else {
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
  iconBg,
  index = 0,
}: KPICardProps) {
  const [mounted, setMounted] = useState(false)
  const isPositive = change >= 0
  const count = useCountUp(value, mounted)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayValue = isCurrency
    ? formattedValue
    : count.toLocaleString("es-CO")

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className={cn(
        "relative rounded-2xl p-5 overflow-hidden cursor-pointer select-none",
        gradient
      )}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute right-4 bottom-0 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top row: icon + badge */}
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg",
              iconBg
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>

          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? "+" : ""}
            {change}%
          </div>
        </div>

        {/* Value + label */}
        <div>
          <p className="text-white/70 text-xs font-medium tracking-wide uppercase mb-0.5">
            {label}
          </p>
          <p className="text-white text-2xl font-bold tracking-tight">{displayValue}</p>
        </div>

        {/* Mini progress bar */}
        <div className="h-1 rounded-full bg-white/20 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change) * 4, 100)}%` }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.7 }}
            className="h-full rounded-full bg-white/50"
          />
        </div>
      </div>
    </motion.div>
  )
}
