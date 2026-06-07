"use client"

import { cn } from "@/lib/utils"
import type { ExpedienteTabId } from "@/types/project-expediente"

export const EXPEDIENTE_TABS: { id: ExpedienteTabId; label: string }[] = [
  { id: "resumen", label: "Resumen Ejecutivo" },
  { id: "estructura", label: "Estructura Contractual" },
  { id: "financiero", label: "Financiero" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "documentos", label: "Documentos" },
  { id: "indicadores", label: "Indicadores" },
  { id: "alertas", label: "Alertas" },
]

interface ExpedienteTabsProps {
  active: ExpedienteTabId
  onChange: (tab: ExpedienteTabId) => void
  alertCount?: number
}

export function ExpedienteTabs({ active, onChange, alertCount = 0 }: ExpedienteTabsProps) {
  return (
    <div className="border-b border-border overflow-x-auto scrollbar-thin -mx-1 px-1">
      <div className="flex gap-0.5 min-w-max">
        {EXPEDIENTE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
              active === t.id
                ? "border-[var(--corporate-blue)] text-[var(--corporate-blue)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.id === "alertas" && alertCount > 0 && (
              <span className="ml-1.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-100 text-red-700 text-[9px] font-bold">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
