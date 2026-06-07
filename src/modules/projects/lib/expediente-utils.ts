import type { ProjectAlert, ProjectDocument, ProjectFollowup, ProjectPayment } from "@/types/project"
import type { ExpedienteContractNode } from "@/types/project-expediente"

export interface UpcomingDeadline {
  contract_number: string
  contract_id: string
  end_date: string
  days_remaining: number
  status: string | null
}

export function projectDateRange(
  primary: { start_date?: string | null; end_date?: string | null } | null,
  tree: ExpedienteContractNode[]
): { start: string | null; end: string | null } {
  const dates = tree.flatMap((n) => [n.start_date, n.end_date].filter(Boolean) as string[])
  if (primary?.start_date) dates.push(primary.start_date)
  if (primary?.end_date) dates.push(primary.end_date)

  if (dates.length === 0) return { start: null, end: null }

  const sorted = [...dates].sort()
  return { start: sorted[0], end: sorted[sorted.length - 1] }
}

export function upcomingDeadlines(
  tree: ExpedienteContractNode[],
  limit = 5
): UpcomingDeadline[] {
  const today = Date.now()
  return tree
    .filter((n) => n.end_date && n.status === "EN_EJECUCION")
    .map((n) => ({
      contract_number: n.contract_number,
      contract_id: n.contract_id,
      end_date: n.end_date!,
      days_remaining: Math.ceil(
        (new Date(n.end_date!).getTime() - today) / 86400000
      ),
      status: n.status,
    }))
    .filter((d) => d.days_remaining >= 0)
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, limit)
}

export function groupDocuments(
  documents: ProjectDocument[],
  tree: ExpedienteContractNode[]
): Record<string, ProjectDocument[]> {
  const principalId = tree.find((n) => n.contract_role === "PRINCIPAL")?.contract_id
  const derivedIds = new Set(
    tree.filter((n) => n.contract_role === "DERIVADO").map((n) => n.contract_id)
  )

  const groups: Record<string, ProjectDocument[]> = {
    "Contrato Principal": [],
    "Contratos Derivados": [],
    Actas: [],
    Informes: [],
    Facturas: [],
    Pólizas: [],
    Otrosíes: [],
    Otros: [],
  }

  const allDocs = [
    ...documents,
    ...tree.flatMap((n) =>
      n.documents.map((d) => ({ ...d, _contract: n.contract_number }))
    ),
  ]

  const seen = new Set<string>()
  for (const doc of allDocs) {
    if (seen.has(doc.id)) continue
    seen.add(doc.id)

    const type = (doc.document_type ?? "").toUpperCase()
    const contractId = doc.contract_id

    if (contractId && contractId === principalId) {
      groups["Contrato Principal"].push(doc)
      continue
    }
    if (contractId && derivedIds.has(contractId)) {
      groups["Contratos Derivados"].push(doc)
      continue
    }
    if (type.includes("ACTA")) groups.Actas.push(doc)
    else if (type.includes("INFORME")) groups.Informes.push(doc)
    else if (type.includes("FACTURA") || type.includes("PAGO")) groups.Facturas.push(doc)
    else if (type.includes("POLIZA") || type.includes("PÓLIZA")) groups.Pólizas.push(doc)
    else if (type.includes("OTROSI") || type.includes("OTROSÍ")) groups.Otrosíes.push(doc)
    else groups.Otros.push(doc)
  }

  return Object.fromEntries(
    Object.entries(groups).filter(([, docs]) => docs.length > 0)
  )
}

export function paymentsByMonth(
  payments: ProjectPayment[]
): { month: string; total: number }[] {
  const map = new Map<string, number>()
  for (const p of payments) {
    const month = p.payment_date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + p.net_value)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({
      month: month.replace("-", "/"),
      total,
    }))
}

export function alertSeverityOrder(severity: ProjectAlert["severity"]): number {
  const order: Record<ProjectAlert["severity"], number> = {
    critica: 0,
    alta: 1,
    media: 2,
    baja: 3,
    info: 4,
  }
  return order[severity] ?? 5
}

export function lifecycleTimeline(
  current: string
): { status: string; label: string; done: boolean; current: boolean }[] {
  const order = [
    "PLANEACION",
    "CONTRATACION",
    "EJECUCION",
    "SEGUIMIENTO",
    "LIQUIDACION",
    "CERRADO",
  ]
  const labels: Record<string, string> = {
    PLANEACION: "Planeación",
    CONTRATACION: "Contratación",
    EJECUCION: "Ejecución",
    SEGUIMIENTO: "Seguimiento",
    LIQUIDACION: "Liquidación",
    CERRADO: "Cerrado",
  }
  const idx = order.indexOf(current)
  return order.map((s, i) => ({
    status: s,
    label: labels[s] ?? s,
    done: i < idx,
    current: s === current,
  }))
}

export function recentFollowups(followups: ProjectFollowup[], n = 5) {
  return followups.slice(0, n)
}

export function recentPayments(payments: ProjectPayment[], n = 5) {
  return payments.slice(0, n)
}

export function recentAlerts(alerts: ProjectAlert[], n = 5) {
  return [...alerts]
    .filter((a) => a.is_active)
    .sort((a, b) => alertSeverityOrder(a.severity) - alertSeverityOrder(b.severity))
    .slice(0, n)
}
