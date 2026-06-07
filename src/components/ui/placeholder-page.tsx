import { MaterialIcon } from "@/components/ui/material-icon"

interface PlaceholderPageProps {
  title: string
  subtitle?: string
  icon?: string
}

export function PlaceholderPage({
  title,
  subtitle = "Módulo en desarrollo. Disponible en una próxima iteración.",
  icon = "construction",
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-container)] flex items-center justify-center mb-4 text-[var(--corporate-blue)]">
        <MaterialIcon name={icon} size={32} />
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{subtitle}</p>
    </div>
  )
}
