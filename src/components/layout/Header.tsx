"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Bell, Menu, LogOut, ChevronDown, User } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

interface HeaderProps {
  onMobileMenuOpen: () => void
  sidebarCollapsed: boolean
  userEmail: string
}

function getInitials(email: string): string {
  const name = email.split("@")[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function Header({ onMobileMenuOpen, userEmail }: HeaderProps) {
  const router = useRouter()
  const [searchFocused, setSearchFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const initials = getInitials(userEmail)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center gap-3 px-4 md:px-6 shrink-0 shadow-sm">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page context */}
      <div className="hidden md:flex flex-col justify-center">
        <h1 className="text-base font-semibold text-foreground leading-tight">Dashboard</h1>
        <p className="text-[11px] text-muted-foreground leading-tight">
          Contratos Interadministrativos
        </p>
      </div>

      <div className="hidden md:block h-5 w-px bg-border mx-1" />
      <div className="flex-1" />

      {/* Search */}
      <motion.div
        animate={{ width: searchFocused ? 280 : 200 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative hidden sm:block"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar contratos..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 focus:bg-card transition-all placeholder:text-muted-foreground/60"
        />
      </motion.div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-muted transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:block max-w-30 truncate">
              {userEmail.split("@")[0]}
            </span>
            <ChevronDown
              size={13}
              className={`text-muted-foreground transition-transform hidden sm:block ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {userEmail.split("@")[0]}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={14} />
                      Mi perfil
                    </button>

                    <div className="my-1 h-px bg-border" />

                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                    >
                      <LogOut size={14} />
                      {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
