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

interface BarByEntityChartProps {
  data: EntityBar[]
}

const COLORS = ["#4F46E5", "#7C3AED", "#10B981", "#F59E0B", "#06B6D4", "#EC4899", "#8B5CF6"]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: EntityBar }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{payload[0].payload.entity}</p>
      <p className="text-muted-foreground mt-0.5">
        <span className="font-bold text-foreground">{payload[0].value}</span>{" "}
        {payload[0].value === 1 ? "contrato" : "contratos"}
      </p>
    </div>
  )
}

const DEMO: EntityBar[] = [
  { entity: "Min. de Educación", count: 0 },
  { entity: "SENA", count: 0 },
  { entity: "INVIAS", count: 0 },
  { entity: "DNP", count: 0 },
  { entity: "Alcaldía Bogotá", count: 0 },
]

function truncate(str: string, max = 22) {
  return str.length > max ? str.slice(0, max) + "…" : str
}

export function BarByEntityChart({ data }: BarByEntityChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isEmpty = data.length === 0
  const chartData = isEmpty ? DEMO : data.slice(0, 7)

  if (!mounted) {
    return <div className="w-full h-52 rounded-xl bg-muted/40 animate-pulse" />
  }

  return (
    <ResponsiveContainer width="100%" height={isEmpty ? 220 : Math.max(220, chartData.length * 44)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        barCategoryGap="25%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f4" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#6b6b9a" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="entity"
          width={130}
          tick={{ fontSize: 11, fill: "#6b6b9a" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => truncate(v)}
        />
        {!isEmpty && <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5ff", radius: 6 }} />}
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={isEmpty ? "#e8e8f4" : COLORS[i % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
