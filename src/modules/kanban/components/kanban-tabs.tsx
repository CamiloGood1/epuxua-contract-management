"use client"

import { useState } from "react"
import { TasksKanban } from "./tasks-kanban"
import type { TareaKanban } from "@/types/seguimiento"

type Tab = "proyectos" | "tareas"

interface Props {
  projectKanban: React.ReactNode
  tasksKanban: React.ReactNode
  tareas: TareaKanban[]
  canEdit: boolean
}

export function KanbanTabs({ projectKanban, tareas, canEdit }: Props) {
  const [tab, setTab] = useState<Tab>("proyectos")

  const tabs: { id: Tab; label: string }[] = [
    { id: "proyectos", label: "Kanban de Proyectos" },
    { id: "tareas",    label: "Kanban de Tareas" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-[#EAEAEA]">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.id
                ? "border-[#0B3D91] text-[#0B3D91]"
                : "border-transparent text-[#747783] hover:text-[#434652]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "proyectos" && projectKanban}
      {tab === "tareas"    && <TasksKanban tareas={tareas} canEdit={canEdit} />}
    </div>
  )
}
