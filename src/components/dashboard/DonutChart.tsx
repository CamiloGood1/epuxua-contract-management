"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"
import type { StatusSlice } from "@/types"

interface DonutChartProps {
  data: StatusSlice[]
  total: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: StatusSlice }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground">
        <span className="font-bold text-foreground">{item.value}</span> contratos
      </p>
    </div>
  )
}

const EMPTY_SLICE: StatusSlice[] = [{ name: "Sin contratos", value: 1, color: "#e5e7eb" }]

export function DonutChart({ data, total }: DonutChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isEmpty = data.length === 0 || total === 0
  const chartData = isEmpty ? EMPTY_SLICE : data

  if (!mounted) {
    return <div className="w-full h-60 rounded-xl bg-muted/40 animate-pulse" />
  }

  return (
    <div className="relative w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={95}
            paddingAngle={isEmpty ? 0 : 3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          {!isEmpty && (
            <Tooltip content={<CustomTooltip />} />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground font-medium">Sin datos</p>
          ) : (
            <>
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-foreground leading-none"
              >
                {total}
              </motion.p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Total</p>
            </>
          )}
        </div>
      </div>

      {/* Custom legend */}
      {!isEmpty && (
        <div className="flex flex-col gap-1.5 mt-2 px-2">
          {data.map((slice) => (
            <div key={slice.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xs text-muted-foreground flex-1 truncate">{slice.name}</span>
              <span className="text-xs font-semibold text-foreground">{slice.value}</span>
              <span className="text-[10px] text-muted-foreground w-8 text-right">
                {Math.round((slice.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
