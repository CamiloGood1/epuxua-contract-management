"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"
import type { StatusSlice } from "@/types"

interface DonutChartProps {
  data: StatusSlice[]
  total: number
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: StatusSlice }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm max-w-[200px]">
      <p className="font-semibold text-foreground leading-snug">{item.name}</p>
      <p className="text-muted-foreground">
        <span className="font-bold text-foreground">{item.value}</span> contratos
      </p>
    </div>
  )
}

const EMPTY_SLICE: StatusSlice[] = [{ name: "Sin contratos", value: 1, color: "#e5e7eb" }]

export function DonutChart({ data, total }: DonutChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const isEmpty = data.length === 0 || total === 0
  const chartData = isEmpty ? EMPTY_SLICE : data

  if (!mounted) {
    return <div className="w-full h-44 rounded-xl bg-muted/40 animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="relative w-full h-[min(180px,42vw)] min-h-[140px] max-h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={isEmpty ? 0 : 2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            {!isEmpty && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-2">
            {isEmpty ? (
              <p className="text-sm text-muted-foreground font-medium">Sin datos</p>
            ) : (
              <>
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-3xl font-bold text-foreground leading-none"
                >
                  {total}
                </motion.p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
                  Total
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {!isEmpty && (
        <div className="max-h-32 sm:max-h-36 overflow-y-auto overscroll-contain scrollbar-thin pr-0.5">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
            {data.map((slice) => (
              <li key={slice.name} className="flex items-start gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-[10px] sm:text-xs text-muted-foreground flex-1 min-w-0 leading-snug line-clamp-2 break-words">
                  {slice.name}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-foreground tabular-nums shrink-0">
                  {slice.value}
                </span>
                <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0 tabular-nums">
                  {Math.round((slice.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
