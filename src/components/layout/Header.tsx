"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Bell, Menu, Plus, ChevronDown } from "lucide-react"

interface HeaderProps {
  onMobileMenuOpen: () => void
  sidebarCollapsed: boolean
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false)

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

      {/* Breadcrumb separator (desktop) */}
      <div className="hidden md:block h-5 w-px bg-border mx-1" />

      {/* Spacer */}
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

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4.5 h-4.5" size={18} />
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card"
          />
        </button>

        {/* New contract CTA */}
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-muted transition-colors group">
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
            CA
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
        </button>
      </div>
    </header>
  )
}
