import { cn } from "@/lib/utils"
import { MaterialIcon } from "./material-icon"

interface PageShellProps {
  title: string
  subtitle?: string
  icon?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PageShell({
  title,
  subtitle,
  icon = "dashboard",
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("space-y-6 pb-10", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--on-background,#151c27)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function PageIconBadge({ icon }: { icon: string }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-[var(--surface-container)] flex items-center justify-center text-[var(--corporate-blue)]">
      <MaterialIcon name={icon} size={22} />
    </div>
  )
}
