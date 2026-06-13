"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[AppError]", error.digest ?? error.message)
  }, [error])

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl">
        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h2 className="text-base font-bold text-red-900">Error al cargar la página</h2>
          <p className="text-sm text-red-800">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "Ocurrió un error en el servidor. Revise la consola del despliegue o las variables de entorno de Supabase."}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 font-mono">Ref: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-2 px-4 py-2 text-sm font-semibold bg-white border border-red-200 rounded-lg text-red-800 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}
