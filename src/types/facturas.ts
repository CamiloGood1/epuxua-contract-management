export type DestinoFactura = "BIENES_SERVICIOS" | "CUOTA_GERENCIA"
export type EstadoFactura  = "FACTURADO" | "COBRADO" | "INGRESADO"

export interface Factura {
  id: number
  interadministrativo_id: number
  numero_factura: string
  fecha_remision: string
  fecha_ingreso: string | null
  destino: DestinoFactura
  valor_cobrado: number
  valor_ingresado: number
  descuentos: number
  estado: EstadoFactura
  user_id: string | null
  user_email: string | null
  created_at: string
  updated_at: string
}

export interface FacturacionKPIs {
  facturadoTotal:      number
  ingresadoTotal:      number
  pendienteTotal:      number
  facturadoBienes:     number
  facturadoCuota:      number
  ingresadoBienes:     number
  ingresadoCuota:      number
  ultimoPago:          string | null
  totalFacturas:       number
  facturasPendientes:  number
  facturasCobradas:    number
  facturasIngresadas:  number
  facturasVencidas30d: number
}

export function computeFactura(f: Factura) {
  const valorNeto      = Number(f.valor_cobrado) - Number(f.descuentos ?? 0)
  const saldoPendiente = Math.max(0, valorNeto - Number(f.valor_ingresado ?? 0))
  const pctRecaudado   = valorNeto > 0
    ? Math.round((Number(f.valor_ingresado) / valorNeto) * 100)
    : 0
  return { valorNeto, saldoPendiente, pctRecaudado }
}

export function calcFacturacionKPIs(facturas: Factura[]): FacturacionKPIs {
  const today = new Date(); today.setHours(0,0,0,0)
  const hace30 = new Date(today); hace30.setDate(hace30.getDate() - 30)

  let facturadoTotal = 0, ingresadoTotal = 0, facturadoBienes = 0
  let facturadoCuota = 0, ingresadoBienes = 0, ingresadoCuota = 0
  let ultimoPago: string | null = null
  let facturasPendientes = 0, facturasCobradas = 0, facturasIngresadas = 0
  let facturasVencidas30d = 0

  for (const f of facturas) {
    const cobrado   = Number(f.valor_cobrado)
    const ingresado = Number(f.valor_ingresado ?? 0)
    facturadoTotal += cobrado
    ingresadoTotal += ingresado

    if (f.destino === "BIENES_SERVICIOS") { facturadoBienes += cobrado; ingresadoBienes += ingresado }
    else                                  { facturadoCuota  += cobrado; ingresadoCuota  += ingresado }

    if (f.fecha_ingreso && (!ultimoPago || f.fecha_ingreso > ultimoPago)) ultimoPago = f.fecha_ingreso
    if (f.estado === "FACTURADO") facturasPendientes++
    else if (f.estado === "COBRADO")   facturasCobradas++
    else if (f.estado === "INGRESADO") facturasIngresadas++

    if (
      f.estado !== "INGRESADO" &&
      new Date(f.fecha_remision) < hace30
    ) facturasVencidas30d++
  }

  return {
    facturadoTotal,
    ingresadoTotal,
    pendienteTotal:      Math.max(0, facturadoTotal - ingresadoTotal),
    facturadoBienes,
    facturadoCuota,
    ingresadoBienes,
    ingresadoCuota,
    ultimoPago,
    totalFacturas:       facturas.length,
    facturasPendientes,
    facturasCobradas,
    facturasIngresadas,
    facturasVencidas30d,
  }
}
