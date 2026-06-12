import type { Interadministrativo } from "@/types/database"
import { formatDateNumeric } from "@/lib/date-format"

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
  return formatDateNumeric(iso)
}
