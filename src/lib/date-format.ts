/** Formato de fechas determinista — mismo resultado en Node (SSR) y navegador. */

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const

function parseIsoDate(iso: string): { y: string; m: string; d: string } | null {
  const clean = iso.trim().slice(0, 10)
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return { y: match[1], m: match[2], d: match[3] }
}

/** DD/MM/YYYY */
export function formatDateNumeric(iso: string | null | undefined): string {
  if (!iso) return "—"
  const p = parseIsoDate(iso)
  if (!p) return "—"
  return `${p.d}/${p.m}/${p.y}`
}

/** 12 sep 2025 */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—"
  const p = parseIsoDate(iso)
  if (!p) return "—"
  const mi = parseInt(p.m, 10) - 1
  if (mi < 0 || mi > 11) return formatDateNumeric(iso)
  return `${parseInt(p.d, 10)} ${MESES[mi]} ${p.y}`
}

/** Partes para tablas con fecha + hora */
export function formatDateTimeParts(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return { date: "—", time: "—" }
  }
  const date = formatDateShort(iso.slice(0, 10))
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return { date, time: `${hh}:${mm}` }
}
