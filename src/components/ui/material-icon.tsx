import { cn } from "@/lib/utils"

interface MaterialIconProps {
  name: string
  className?: string
  size?: number
  filled?: boolean
}

export function MaterialIcon({
  name,
  className,
  size = 20,
  filled = false,
}: MaterialIconProps) {
  return (
    <span
      className={cn("material-symbols-outlined leading-none", className)}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24`,
      }}
      aria-hidden
    >
      {name}
    </span>
  )
}
