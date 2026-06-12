"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MaterialIcon } from "@/components/ui/material-icon"
import { canManageUsers, roleLabel } from "@/modules/projects/lib/access"
import type { UserRole } from "@/types/project"

const SIDEBAR_WIDTH = 260

type NavItem = {
  href: string
  label: string
  icon?: string
  badge?: number
}

type NavSection = {
  label: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const navSections: NavSection[] = [
  {
    label: "Principal",
    items: [{ href: "/", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Proyectos",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/proyectos", label: "Proyectos", icon: "folder_special" },
      { href: "/proyectos/kanban", label: "Kanban", icon: "view_kanban" },
      { href: "/proyectos/calendario", label: "Calendario", icon: "calendar_month" },
    ],
  },
  {
    label: "Contratación",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/contratacion/derivados", label: "Derivados", icon: "account_tree" },
      { href: "/contratacion/supervision", label: "Supervisión", icon: "supervisor_account" },
    ],
  },
  {
    label: "Funcionamiento",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/funcionamiento", label: "Todos los contratos", icon: "corporate_fare" },
      { href: "/funcionamiento?status=activos", label: "Activos", icon: "play_circle" },
      { href: "/funcionamiento?status=proximos", label: "Próximos a vencer", icon: "schedule" },
      { href: "/funcionamiento?status=finalizados", label: "Finalizados", icon: "check_circle" },
    ],
  },
  {
    label: "Administración",
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/administracion/usuarios", label: "Usuarios", icon: "group" },
      { href: "/administracion/configuracion", label: "Configuración", icon: "settings" },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  userRole?: UserRole | null
  userName?: string
  userEmail?: string
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavItemRow({
  item,
  collapsed,
  isMobile,
  nested = false,
}: {
  item: NavItem
  collapsed: boolean
  isMobile: boolean
  nested?: boolean
}) {
  const pathname = usePathname()
  const isActive = isItemActive(pathname, item.href)
  const showLabel = !collapsed || isMobile

  return (
    <Link href={item.href}>
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-lg transition-all duration-150",
          showLabel ? (nested ? "px-3 py-2 ml-2" : "px-3 py-2.5") : "py-2.5 justify-center",
          isActive
            ? "sidebar-active text-white font-medium"
            : "text-[#dce2fb]/80 hover:bg-white/10 hover:text-white"
        )}
      >
        {item.icon && (
          <MaterialIcon
            name={item.icon}
            size={nested ? 18 : 20}
            className={cn("shrink-0", isActive && "text-[var(--institutional-gold)]")}
          />
        )}
        {showLabel && (
          <span className={cn("flex-1 whitespace-nowrap", nested ? "text-xs" : "text-sm")}>
            {item.label}
          </span>
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

function NavSectionBlock({
  section,
  collapsed,
  isMobile,
}: {
  section: NavSection
  collapsed: boolean
  isMobile: boolean
}) {
  const pathname = usePathname()
  const showLabel = !collapsed || isMobile
  const sectionActive = section.items.some((item) => isItemActive(pathname, item.href))
  const [open, setOpen] = useState(section.defaultOpen ?? sectionActive)

  // Ocultar sección sin ítems visibles
  if (section.items.length === 0) return null

  // Administración: pocos ítems → siempre visibles (sin acordeón)
  if (section.label === "Administración" && showLabel) {
    return (
      <div>
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">
          {section.label}
        </p>
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavItemRow
              key={item.href}
              item={item}
              collapsed={collapsed}
              isMobile={isMobile}
              nested
            />
          ))}
        </div>
      </div>
    )
  }

  if (section.collapsible && showLabel) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35 hover:text-white/55"
        >
          <span>{section.label}</span>
          <ChevronDown
            size={14}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-0.5 overflow-hidden"
            >
              {section.items.map((item) => (
                <NavItemRow
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isMobile={isMobile}
                  nested
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div>
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
            nested={section.collapsible && showLabel}
          />
        ))}
      </div>
    </div>
  )
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onMobileClose,
  isMobile = false,
  userRole,
  userName,
  userEmail,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  onMobileClose?: () => void
  isMobile?: boolean
  userRole?: UserRole | null
  userName?: string
  userEmail?: string
}) {
  const showLabel = !collapsed || isMobile

  const sections = navSections.map((section) => {
    if (section.label !== "Administración") return section
    const isAdmin = canManageUsers(userRole)
    return {
      ...section,
      defaultOpen: true,
      items: section.items.filter(
        (item) => item.href !== "/administracion/usuarios" || isAdmin
      ),
    }
  })

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
        {sections.map((section) => (
          <NavSectionBlock
            key={section.label}
            section={section}
            collapsed={collapsed}
            isMobile={isMobile}
          />
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
              <p className="text-white text-sm font-semibold truncate">{userName ?? "Usuario"}</p>
              <p className="text-[#ADBDCC] text-[11px] truncate">
                {roleLabel(userRole)}
                {userEmail ? ` · ${userEmail.split("@")[0]}` : ""}
              </p>
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
  userRole,
  userName,
  userEmail,
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
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
        />
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
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
