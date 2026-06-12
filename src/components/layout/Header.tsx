"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, LogOut, ChevronDown, KeyRound } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { MaterialIcon } from "@/components/ui/material-icon"
import { ChangePasswordDialog } from "@/components/layout/change-password-dialog"
import { cn } from "@/lib/utils"

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Ejecución y monitoreo financiero" },
  "/proyectos": { title: "Proyectos", subtitle: "Cartera de proyectos EPUXUA" },
  "/contratacion/derivados": {
    title: "Contratos derivados",
    subtitle: "Vinculados a interadministrativos",
  },
  "/seguimiento": { title: "Seguimiento", subtitle: "Proyectos y avance de ejecución" },
  "/alertas": { title: "Alertas", subtitle: "Centro de notificaciones" },
  "/financiero": { title: "Financiero", subtitle: "Presupuesto y ejecución" },
  "/facturacion": { title: "Facturación", subtitle: "Pagos y facturas" },
  "/documentos": { title: "Documentos", subtitle: "Repositorio documental" },
  "/usuarios": { title: "Usuarios", subtitle: "Administración de accesos" },
  "/configuracion": { title: "Configuración", subtitle: "Parámetros del sistema" },
  "/administracion/usuarios": { title: "Usuarios", subtitle: "Roles e invitaciones" },
  "/administracion/configuracion": { title: "Configuración", subtitle: "Administración del sistema" },
}

function getPageMeta(pathname: string) {
  if (pathname.match(/^\/proyectos\/[^/]+\/contratos\//)) {
    return { title: "Detalle de contrato", subtitle: "Dentro del expediente del proyecto" }
  }
  if (pathname.startsWith("/proyectos/")) {
    return { title: "Expediente del proyecto", subtitle: "Información y estructura contractual" }
  }
  if (pathname.startsWith("/contracts/")) {
    return { title: "Detalle de contrato", subtitle: "Ficha contractual" }
  }
  for (const [path, meta] of Object.entries(PAGE_TITLES)) {
    if (path !== "/" && pathname.startsWith(path)) return meta
  }
  return PAGE_TITLES["/"] ?? { title: "EPUXUA", subtitle: "Gestión contractual" }
}

function getInitials(email: string): string {
  const name = email.split("@")[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface HeaderProps {
  onMobileMenuOpen: () => void
  sidebarCollapsed: boolean
  userEmail: string
}

export function Header({ onMobileMenuOpen, userEmail }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const meta = getPageMeta(pathname)
  const initials = getInitials(userEmail)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-[#EAEAEA] flex items-center gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-40">
      <button
        type="button"
        onClick={onMobileMenuOpen}
        className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0 -ml-1"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="min-w-0 flex-1 md:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          EPUXUA
        </p>
        <h1 className="text-sm font-bold text-foreground leading-tight truncate">
          {meta.title}
        </h1>
      </div>

      <div className="hidden md:block min-w-0 shrink-0 max-w-[240px] lg:max-w-none">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Área principal
        </p>
        <h1 className="text-sm font-bold text-foreground leading-tight truncate">
          {meta.title}
        </h1>
      </div>

      <div className="flex-1 max-w-xl mx-auto hidden sm:block">
        <div className="relative">
          <MaterialIcon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Buscar contratos, expedientes o pagos..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#f6f8fc] border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--corporate-blue)]/20 focus:border-[var(--corporate-blue)]/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto">
        <button
          type="button"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
        >
          <MaterialIcon name="help" size={18} />
          Ayuda
        </button>

        <button
          type="button"
          className="relative p-2 sm:p-2.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0"
        >
          <MaterialIcon name="notifications" size={20} />
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-lg hover:bg-muted"
          >
            <div
              className="w-8 h-8 rounded-full bg-[var(--corporate-blue)] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            >
              {initials}
            </div>
            <span className="text-xs font-medium hidden lg:block max-w-[120px] truncate">
              {userEmail.split("@")[0]}
            </span>
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0", menuOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-1.5rem)] bg-white border border-[#EAEAEA] rounded-xl shadow-xl z-20 p-1"
                >
                  <p className="px-3 py-2 text-[10px] text-muted-foreground truncate border-b border-border mb-1">
                    {userEmail}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setPasswordOpen(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted"
                  >
                    <KeyRound size={14} />
                    Cambiar contraseña
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <LogOut size={14} />
                    {loggingOut ? "Cerrando…" : "Cerrar sesión"}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </header>
  )
}
