"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Eye, EyeOff, Loader2, AlertCircle, Lock } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError("Correo o contraseña incorrectos.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-2xl p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Building2 size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Epuxua</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de Contratos Interadministrativos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="admin@epuxua.co"
                className="w-full h-10 rounded-xl border border-border bg-muted/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-border bg-muted/40 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Ingresando…</>
              ) : (
                <><Lock size={14} /> Ingresar</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-sidebar-foreground/40 mt-6">
          Plataforma de uso exclusivo para personal autorizado
        </p>
      </div>
    </div>
  )
}
