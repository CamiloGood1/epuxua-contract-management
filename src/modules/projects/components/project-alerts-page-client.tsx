"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Bell, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/ui/page-shell"
import type { ProjectAlert } from "@/types/project"

const SEVERITY_CONFIG = {
  critica: { label: "Crítica", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  alta: { label: "Alta", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  media: { label: "Media", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  baja: { label: "Baja", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  info: { label: "Info", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
} as const

type Severity = keyof typeof SEVERITY_CONFIG

interface ProjectAlertsPageClientProps {
  alerts: ProjectAlert[]
}

export function ProjectAlertsPageClient({ alerts }: ProjectAlertsPageClientProps) {
  const [filter, setFilter] = useState<Severity | "all">("all")
  const [activeOnly, setActiveOnly] = useState(true)

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (activeOnly && !a.is_active) return false
      if (filter !== "all" && a.severity !== filter) return false
      return true
    })
  }, [alerts, filter, activeOnly])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.filter((a) => a.is_active).length }
    for (const s of Object.keys(SEVERITY_CONFIG)) {
      c[s] = alerts.filter((a) => a.is_active && a.severity === s).length
    }
    return c
  }, [alerts])

  return (
    <PageShell
      title="Alertas"
      subtitle="Alertas activas e históricas por proyecto."
      icon="notifications"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveOnly(!activeOnly)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border",
            activeOnly
              ? "bg-[var(--corporate-blue)] text-white border-transparent"
              : "bg-white text-muted-foreground border-border"
          )}
        >
          Solo activas
        </button>
        {(["all", ...(Object.keys(SEVERITY_CONFIG) as Severity[])] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s as Severity | "all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              filter === s
                ? "bg-[var(--surface-container)] text-[var(--corporate-blue)] border-[var(--corporate-blue)]/30"
                : "bg-white text-muted-foreground border-border hover:border-muted-foreground/30"
            )}
          >
            {s === "all" ? "Todas" : SEVERITY_CONFIG[s as Severity].label} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="epuxua-card p-12 text-center text-muted-foreground">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>No hay alertas que mostrar.</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
            return (
              <Link
                key={alert.id}
                href={`/proyectos/${alert.project_id}?tab=alertas`}
                className={cn(
                  "epuxua-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow border-l-4",
                  cfg.border
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.bg, cfg.text)}>
                      {cfg.label}
                    </span>
                    {alert.project_code && (
                      <span className="text-xs font-semibold text-[var(--corporate-blue)]">
                        {alert.project_code}
                      </span>
                    )}
                    {!alert.is_active && (
                      <span className="text-[10px] text-muted-foreground">Histórica</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {alert.description}
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </Link>
            )
          })
        )}
      </div>
    </PageShell>
  )
}
