import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

interface SecopLinkProps {
  url: string | null | undefined
  className?: string
  variant?: "inline" | "button"
}

export function SecopLink({ url, className, variant = "inline" }: SecopLinkProps) {
  if (!url?.trim() || !isValidUrl(url.trim())) return null

  const href = url.trim()

  if (variant === "button") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg",
          "bg-[var(--corporate-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity",
          className
        )}
      >
        <ExternalLink size={15} />
        Ver en SECOP II
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--corporate-blue)] hover:underline break-all",
        className
      )}
    >
      <ExternalLink size={14} className="shrink-0" />
      SECOP II
    </a>
  )
}
