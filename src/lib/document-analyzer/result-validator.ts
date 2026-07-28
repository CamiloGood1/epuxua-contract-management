import type { AdicionExtraction, ValidationWarning } from "./types"

export function validateAdicionExtraction(ext: AdicionExtraction): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  const total = ext.valor_total.value
  const bienes = ext.valor_bienes_servicios.value
  const cuota = ext.valor_cuota_gerencia.value

  // Validate that bienes + cuota ≈ total (within 1%)
  if (total && bienes && cuota) {
    const diff = Math.abs(total - (bienes + cuota))
    if (diff / total > 0.01) {
      warnings.push({
        type: "VALUE_MISMATCH",
        message: `La suma de Bolsa de Inversión + Cuota de Gerencia no coincide con el Valor Total extraído. Verifica los valores antes de guardar.`,
        severity: "warning",
      })
    }
  }

  // Warn if total is found but neither breakdown was found
  if (total && !bienes && !cuota) {
    warnings.push({
      type: "BREAKDOWN_MISSING",
      message: `Se encontró el Valor Total pero no el desglose por Bolsa de Inversión y Cuota de Gerencia. Complétalos manualmente.`,
      severity: "info",
    })
  }

  // Validate date is within reasonable range
  if (ext.fecha_adicion.value) {
    const year = new Date(ext.fecha_adicion.value + "T00:00:00").getFullYear()
    const currentYear = new Date().getFullYear()
    if (year < 2010 || year > currentYear + 1) {
      warnings.push({
        type: "DATE_SUSPICIOUS",
        message: `La fecha extraída (${ext.fecha_adicion.value}) parece inusual. Verifica que corresponda a la adición.`,
        severity: "warning",
      })
    }
  }

  return warnings
}
