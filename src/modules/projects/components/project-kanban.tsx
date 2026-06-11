"use client"

import { useMemo, useState, useTransition } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCOP } from "@/modules/contracts/lib/status"
import { ESTADO_ORDER, ESTADO_CONFIG } from "../lib/lifecycle"
import { updateProjectLifecycle } from "@/services/projects.actions"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"

interface ProjectKanbanProps {
  cards: Interadministrativo[]
  canEdit?: boolean
}

export function ProjectKanban({ cards, canEdit = true }: ProjectKanbanProps) {
  const [items, setItems] = useState(cards)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const byColumn = useMemo(() => {
    const map: Record<EstadoInteradministrativo, Interadministrativo[]> = {
      "PLANEACIÓN":               [],
      "CONTRATACIÓN":             [],
      "EN EJECUCIÓN":             [],
      "SUSPENDIDO":               [],
      "TERMINADO":                [],
      "LIQUIDADO":                [],
      "TERMINADO ANTICIPADAMENTE":[],
    }
    for (const card of items) {
      map[card.estado]?.push(card)
    }
    return map
  }, [items])

  function handleDrop(targetStatus: EstadoInteradministrativo) {
    if (!draggingId || !canEdit) return
    const card = items.find((c) => c.id === draggingId)
    if (!card || card.estado === targetStatus) {
      setDraggingId(null)
      return
    }

    const prev = items
    setItems((current) =>
      current.map((c) =>
        c.id === draggingId ? { ...c, estado: targetStatus } : c
      )
    )
    setDraggingId(null)

    startTransition(async () => {
      const { error } = await updateProjectLifecycle(card.id_contrato, targetStatus)
      if (error) setItems(prev)
    })
  }

  return (
    <div className="space-y-3">
      {isPending && (
        <p className="text-xs text-muted-foreground animate-pulse">Guardando cambios…</p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
        {ESTADO_ORDER.map((status) => {
          const cfg = ESTADO_CONFIG[status]
          const columnCards = byColumn[status]

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[300px]"
              onDragOver={(e) => { if (canEdit) e.preventDefault() }}
              onDrop={() => handleDrop(status)}
            >
              <div
                className={cn(
                  "rounded-t-xl px-3 py-2 border border-b-0",
                  cfg.bgClass,
                  cfg.borderClass
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-bold", cfg.textClass)}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {columnCards.length}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "min-h-[420px] rounded-b-xl border border-t-0 p-2 space-y-2 bg-muted/20",
                  cfg.borderClass,
                  draggingId && canEdit && "ring-2 ring-[var(--corporate-blue)]/20"
                )}
              >
                {columnCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    draggable={canEdit}
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={cn(
                      "epuxua-card p-3 space-y-2 cursor-grab active:cursor-grabbing",
                      draggingId === card.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {canEdit && (
                        <GripVertical size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/proyectos/${card.id}`}
                          className="text-xs font-bold text-[var(--corporate-blue)] hover:underline"
                        >
                          {card.id_contrato}
                        </Link>
                        {card.objeto_contrato && (
                          <p className="text-xs text-foreground line-clamp-2 mt-0.5">
                            {card.objeto_contrato}
                          </p>
                        )}
                      </div>
                    </div>
                    {card.secretaria && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {card.secretaria}
                      </p>
                    )}
                    {card.total_contrato != null && (
                      <div className="text-[10px]">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-semibold">{formatCOP(card.total_contrato)}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
