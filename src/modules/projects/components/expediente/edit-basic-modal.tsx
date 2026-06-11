"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { updateInteradminBasicInfo } from "@/services/modificaciones.actions"
import { ESTADO_ORDER, ESTADO_CONFIG } from "../../lib/lifecycle"
import type { Interadministrativo, EstadoInteradministrativo } from "@/types/database"

interface Props {
  project: Interadministrativo
  onClose: () => void
}

export function EditBasicModal({ project: p, onClose }: Props) {
  const router = useRouter()
  const [estado, setEstado]   = useState<EstadoInteradministrativo>(p.estado)
  const [fechaInicio, setFechaInicio] = useState(p.fecha_inicio_ejecucion ?? "")
  const [avance, setAvance]   = useState<string>(String(p.avance_fisico_pct ?? 0))
  const [error, setError]     = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const avanceNum = parseFloat(avance)
    if (isNaN(avanceNum) || avanceNum < 0 || avanceNum > 100) {
      setError("El avance físico debe ser un número entre 0 y 100.")
      return
    }
    start(async () => {
      const res = await updateInteradminBasicInfo({
        id:                     p.id,
        estado,
        fecha_inicio_ejecucion: fechaInicio || null,
        avance_fisico_pct:      avanceNum,
      })
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <h2 className="text-base font-bold text-[#002869]">Editar Registro</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">

          {/* Estado */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoInteradministrativo)}
              className="w-full h-10 rounded-lg border border-[#EAEAEA] pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
            >
              {ESTADO_ORDER.map((s) => (
                <option key={s} value={s}>{ESTADO_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Fecha inicio ejecución */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5">
              Fecha de Inicio de Ejecución
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
            />
          </div>

          {/* Avance físico */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5">
              Avance Físico de Ejecución (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={avance}
                onChange={(e) => setAvance(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#EAEAEA] pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
                placeholder="0 – 100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#747783]">%</span>
            </div>
            {/* mini progress bar */}
            <div className="mt-2 h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
              <div
                className="h-full bg-[#0B3D91] rounded-full transition-all"
                style={{ width: `${Math.min(Math.max(parseFloat(avance) || 0, 0), 100)}%` }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm text-[#434652] hover:bg-[#f9f9f9] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold hover:bg-[#002869] transition-colors disabled:opacity-60"
            >
              {isPending ? "Guardando…" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
