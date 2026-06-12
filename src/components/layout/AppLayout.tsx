"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import type { UserRole } from "@/types/project"

interface AppLayoutProps {
  children: React.ReactNode
  userEmail: string
  userRole?: UserRole | null
  userName?: string
}

export function AppLayout({ children, userEmail, userRole, userName }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#f6f8fc] overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
