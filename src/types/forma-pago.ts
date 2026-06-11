export type DestinoHito = "BIENES_SERVICIOS" | "CUOTA_GERENCIA" | "MIXTO"

export interface PaymentMilestone {
  id: number
  interadministrativo_id: number
  milestone_number: number
  milestone_name: string
  destination: DestinoHito
  percentage: number | null
  scheduled_value: number
  payment_condition: string
  observations: string | null
  created_by: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface FormaPagoSummary {
  programadoBienes:  number
  programadoCuota:   number
  programadoMixto:   number
  programadoTotal:   number
  totalHitos:        number
  sumaPct:           number
}

export function calcFormaPagoSummary(hitos: PaymentMilestone[]): FormaPagoSummary {
  let programadoBienes = 0, programadoCuota = 0, programadoMixto = 0, sumaPct = 0

  for (const h of hitos) {
    const v = Number(h.scheduled_value ?? 0)
    if (h.destination === "BIENES_SERVICIOS") programadoBienes += v
    else if (h.destination === "CUOTA_GERENCIA")   programadoCuota  += v
    else                                            programadoMixto  += v
    sumaPct += Number(h.percentage ?? 0)
  }

  return {
    programadoBienes,
    programadoCuota,
    programadoMixto,
    programadoTotal: programadoBienes + programadoCuota + programadoMixto,
    totalHitos:      hitos.length,
    sumaPct,
  }
}
