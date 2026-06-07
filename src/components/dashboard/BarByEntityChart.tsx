"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { EntityBar } from "@/types"
import { useIsMobile } from "@/hooks/use-breakpoint"

interface BarByEntityChartProps {
  data: EntityBar[]
  emptyMessage?: string
}

const COLORS = [
  "#002869",
  "#1e4a8c",
  "#D9A520",
  "#10B981",
  "#7C3AED",
  "#06B6D4",
  "#EC4899",
  "#64748b",
]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: EntityBar }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm max-w-[240px]">
      <p className="font-semibold text-foreground leading-snug">{payload[0].payload.entity}</p>
      <p className="text-muted-foreground mt-0.5">
        <span className="font-bold text-foreground">{payload[0].value}</span>{" "}
        {payload[0].value === 1 ? "contrato" : "contratos"}
      </p>
    </div>
  )
}

function truncate(str: string, max: number) {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

export function BarByEntityChart({
  data,
  emptyMessage = "No hay contratos interadministrativos con secretaría registrada.",
}: BarByEntityChartProps) {
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  useEffect(() => {
    setMounted(true)
  }, [])

  const isEmpty = data.length === 0
  const chartData = data.slice(0, 8)
  const yWidth = isMobile ? 88 : 148
  const labelMax = isMobile ? 12 : 24
  const chartHeight = Math.max(isMobile ? 200 : 220, chartData.length * (isMobile ? 36 : 44))

  if (!mounted) {
    return <div className="w-full h-52 rounded-xl bg-muted/40 animate-pulse" />
  }

  if (isEmpty) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">{emptyMessage}</p>
    )
  }

  return (
    <div className="w-full min-w-0 -mx-1 sm:mx-0">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: isMobile ? 8 : 16, left: 0, bottom: 4 }}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: isMobile ? 10 : 11, fill: "#6b6b9a" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="entity"
            width={yWidth}
            tick={{ fontSize: isMobile ? 9 : 10, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => truncate(v, labelMax)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5ff", radius: 6 }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={isMobile ? 18 : 24}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
