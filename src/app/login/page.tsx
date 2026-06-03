"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, Lock } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { MaterialIcon } from "@/components/ui/material-icon"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Correo o contraseña incorrectos.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--corporate-blue)] text-white flex-col justify-between p-12">
        <div>
          <div className="w-12 h-12 rounded-lg bg-[var(--institutional-gold)] flex items-center justify-center mb-8">
            <MaterialIcon name="account_balance" size={28} className="text-[var(--corporate-blue)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EPUXUA</h1>
          <p className="text-[#ADBDCC] text-sm uppercase tracking-wide mt-2 font-medium">
            Gestión Pública
          </p>
          <p className="text-white/80 mt-8 max-w-md text-lg leading-relaxed">
            Plataforma de seguimiento contractual, ejecución financiera y control de proyectos
            interadministrativos.
          </p>
        </div>
        <p className="text-xs text-white/40">Uso exclusivo para personal autorizado</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#f6f8fc]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-[var(--institutional-gold)] flex items-center justify-center mb-3">
              <MaterialIcon name="account_balance" size={24} className="text-[var(--corporate-blue)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--corporate-blue)]">EPUXUA</h1>
          </div>

          <div className="bg-white rounded-xl border border-[#EAEAEA] shadow-lg p-8">
            <h2 className="text-lg font-bold text-foreground">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Ingresa tus credenciales institucionales
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder="usuario@epuxua.co"
                  className="w-full h-10 rounded-lg border border-[#EAEAEA] bg-[#f6f8fc] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/25"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError(null)
                    }}
                    className="w-full h-10 rounded-lg border border-[#EAEAEA] bg-[#f6f8fc] px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-10 bg-[var(--corporate-blue)] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Ingresando…
                  </>
                ) : (
                  <>
                    <Lock size={14} /> Ingresar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
