"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MaterialIcon } from "@/components/ui/material-icon"

const SIDEBAR_WIDTH = 260

type NavLink = {
  href: string
  label: string
  icon: string
  badge?: number
}

const navSections: { label: string; items: NavLink[] }[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: "dashboard" },
      { href: "/contracts", label: "Contratos", icon: "description" },
      { href: "/seguimiento", label: "Seguimiento", icon: "query_stats" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/financiero", label: "Financiero", icon: "payments" },
      { href: "/facturacion", label: "Facturación", icon: "receipt_long" },
      { href: "/documentos", label: "Documentos", icon: "folder" },
      { href: "/alertas", label: "Alertas", icon: "notifications", badge: 3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: "group" },
      { href: "/configuracion", label: "Configuración", icon: "settings" },
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
  item: NavLink
  collapsed: boolean
  isMobile: boolean
}) {
  const pathname = usePathname()
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  const showLabel = !collapsed || isMobile

  return (
    <Link href={item.href}>
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-lg transition-all duration-150",
          showLabel ? "px-3 py-2.5" : "py-2.5 justify-center",
          isActive
            ? "sidebar-active text-white font-medium"
            : "text-[#dce2fb]/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <MaterialIcon
          name={item.icon}
          size={20}
          className={cn("shrink-0", isActive && "text-[var(--institutional-gold)]")}
        />
        {showLabel && (
          <span className="text-sm flex-1 whitespace-nowrap">{item.label}</span>
        )}
        {item.badge != null && showLabel && (
          <span className="text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#EF4444] text-white px-1">
            {item.badge}
          </span>
        )}
      </div>
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
    <div className="flex flex-col h-full select-none bg-[var(--corporate-blue)] text-[#dce2fb]">
      <div
        className={cn(
          "flex items-center gap-3 border-b border-white/10 shrink-0 px-6 py-6",
          !showLabel && "justify-center px-3"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--institutional-gold)] flex items-center justify-center shrink-0">
          <MaterialIcon name="account_balance" size={18} className="text-[var(--corporate-blue)]" />
        </div>
        {showLabel && (
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-none">EPUXUA</p>
            <p className="text-[#ADBDCC] text-[10px] uppercase tracking-wide font-medium mt-1">
              Gestión Pública
            </p>
          </div>
        )}
        {isMobile && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            {showLabel && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                {section.label}
              </p>
            )}
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

      <div className="border-t border-white/10 px-3 py-4 shrink-0 space-y-2">
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg",
            !showLabel && "justify-center"
          )}
        >
          <div
            className="w-8 h-8 rounded-full bg-cover bg-center shrink-0 ring-2 ring-white/20"
            style={{
              backgroundImage:
                "url(https://ui-avatars.com/api/?name=CR&background=D9A520&color=002869&bold=true)",
            }}
          />
          {showLabel && (
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">Administrador</p>
              <p className="text-[#ADBDCC] text-[11px] truncate">Admin General</p>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white text-[11px]",
              !showLabel && "justify-center"
            )}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            {showLabel && <span>Minimizar panel</span>}
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
  const width = collapsed ? 72 : SIDEBAR_WIDTH

  return (
    <>
      <motion.aside
        animate={{ width }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col overflow-hidden shrink-0 z-50"
        style={{ width }}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden flex flex-col shadow-2xl"
              style={{ width: SIDEBAR_WIDTH }}
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
