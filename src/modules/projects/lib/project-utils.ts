import type { Interadministrativo } from "@/types/database"

/** Etiqueta de entidad contratante — acepta tanto el esquema nuevo como el viejo */
export function projectEntityLabel(
  p: {
    secretaria?: string | null
    area_name?: string | null        // ProjectDetail (esquema anterior)
    area_responsable?: string | null // Interadministrativo (esquema nuevo)
  }
): string {
  return p.secretaria ?? p.area_name ?? p.area_responsable ?? "—"
}

/** Stub de compatibilidad — ya no hay conteo de derivados en ProjectDetail */
export function projectContractsCount(
  _p: unknown,
  fallback?: number
): number | null {
  return fallback ?? null
}

/** Formatea fecha ISO a DD/MM/YYYY */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
