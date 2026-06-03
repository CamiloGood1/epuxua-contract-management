"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Receipt,
  Folder,
  Bell,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/types"

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/contracts", label: "Contratos", icon: FileText },
      { href: "/seguimiento", label: "Seguimiento", icon: TrendingUp },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/financiero", label: "Financiero", icon: DollarSign },
      { href: "/facturacion", label: "Facturación", icon: Receipt },
      { href: "/documentos", label: "Documentos", icon: Folder },
      { href: "/alertas", label: "Alertas", icon: Bell, badge: 3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: Users },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function NavItemRow({
  item,
  collapsed,
  isMobile,
}: {
  item: NavItem
  collapsed: boolean
  isMobile: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === item.href
  const Icon = item.icon
  const showLabel = !collapsed || isMobile

  return (
    <Link href={item.href}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-150 group",
          showLabel ? "px-3 py-2.5" : "py-2.5 justify-center",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-xl bg-sidebar-primary"
            style={{ zIndex: -1 }}
          />
        )}

        <Icon
          size={18}
          className={cn(
            "shrink-0 transition-all",
            isActive ? "text-sidebar-primary-foreground" : "group-hover:scale-110"
          )}
        />

        <AnimatePresence mode="wait">
          {showLabel && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.12 }}
              className="text-sm font-medium whitespace-nowrap flex-1"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {item.badge != null && showLabel && (
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
              isActive ? "bg-white/25 text-white" : "bg-destructive text-white"
            )}
          >
            {item.badge}
          </span>
        )}
        {item.badge != null && !showLabel && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
        )}
      </motion.div>
    </Link>
  )
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onMobileClose,
  isMobile = false,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  onMobileClose?: () => void
  isMobile?: boolean
}) {
  const showLabel = !collapsed || isMobile

  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border shrink-0 h-16 px-4",
          !showLabel && "justify-center"
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-sidebar-primary to-violet-600 flex items-center justify-center shrink-0 shadow-lg">
          <Building2 size={18} className="text-white" />
        </div>

        <AnimatePresence mode="wait">
          {showLabel && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sidebar-primary-foreground font-bold text-sm leading-none tracking-tight">
                Epuxua
              </p>
              <p className="text-sidebar-foreground/45 text-[11px] leading-none mt-1">
                Gestión Contractual
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <AnimatePresence>
              {showLabel && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemRow
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 shrink-0 space-y-1">
        {/* User row */}
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent cursor-pointer transition-colors",
            !showLabel && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-sidebar-primary to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
            CA
          </div>
          <AnimatePresence>
            {showLabel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sidebar-foreground text-[13px] font-semibold truncate leading-none">
                  Camila Ruiz
                </p>
                <p className="text-sidebar-foreground/40 text-[11px] truncate mt-0.5">
                  Administrador
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground/80 transition-colors",
              !showLabel && "justify-center"
            )}
          >
            {collapsed ? (
              <ChevronRight size={15} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={15} className="shrink-0" />
                <span className="text-[11px] font-medium">Minimizar panel</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar z-50 md:hidden flex flex-col shadow-2xl"
            >
              <SidebarContent
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                onMobileClose={onMobileClose}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
