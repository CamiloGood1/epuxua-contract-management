"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.digest ?? error.message)
  }, [error])

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#EAEAEA] rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={22} />
            <div>
              <h1 className="text-lg font-bold text-[#002869]">Error de la aplicación</h1>
              <p className="text-sm text-[#434652] mt-2">
                {process.env.NODE_ENV === "development"
                  ? error.message
                  : "No se pudo completar la operación. Verifique la sesión, las variables de entorno de Supabase y los logs del servidor."}
              </p>
              {error.digest && (
                <p className="text-xs text-[#747783] font-mono mt-2">Ref: {error.digest}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 h-10 rounded-lg bg-[#0B3D91] text-white text-sm font-semibold"
            >
              Reintentar
            </button>
            <a
              href="/login"
              className="flex-1 h-10 rounded-lg border border-[#EAEAEA] text-sm font-semibold flex items-center justify-center text-[#434652]"
            >
              Ir a login
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
