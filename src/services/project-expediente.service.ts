import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Contract } from "@/types/contract"
import type { ProjectDetail, ProjectDocument } from "@/types/project"
import type {
  ExpedienteContractNode,
  ProjectBudgetMovement,
  ProjectExpedienteComputed,
  ProjectExpedienteData,
} from "@/types/project-expediente"
import {
  getProjectByNumericId,
  getProjectContractTree,
  getProjectFollowups,
  getProjectAssignments,
} from "./projects.service"
import { getProjectIndicators } from "./project-indicators.service"
import { getProjectFinancialSummary, getProjectPayments } from "./project-financial.service"
import { getProjectDocuments } from "./project-documents.service"
import { getProjectAlerts } from "./user.service"
import { getContractById } from "./contracts.service"
import { safeExpedienteLoad } from "./project-expediente-resilience"

function computeMetrics(
  tree: ExpedienteContractNode[],
  alerts: { is_active: boolean }[]
): ProjectExpedienteComputed {
  const today = new Date()
  let active = 0
  let expiring = 0
  let expired = 0
  let contracted = 0

  for (const node of tree) {
    contracted += node.final_value ?? 0
    const status = node.status ?? ""
    if (status === "EN_EJECUCION" || status === "SUSPENDIDO") active++
    if (node.end_date) {
      const end = new Date(node.end_date)
      const days = Math.ceil((end.getTime() - today.getTime()) / 86400000)
      if (days < 0 && ["EN_EJECUCION", "SUSPENDIDO"].includes(status)) expired++
      else if (days >= 0 && days <= 30 && status === "EN_EJECUCION") expiring++
    }
  }

  const derived = tree.filter((n) => n.contract_role === "DERIVADO").length
  const open = alerts.filter((a) => a.is_active).length
  const closed = alerts.filter((a) => !a.is_active).length

  return {
    contracted_value: contracted,
    derived_count: derived,
    active_contracts: active,
    expiring_contracts: expiring,
    expired_contracts: expired,
    open_alerts: open,
    closed_alerts: closed,
  }
}

async function enrichContractTree(
  projectId: string,
  nodes: ExpedienteContractNode[]
): Promise<ExpedienteContractNode[]> {
  if (nodes.length === 0) return []

  const supabase = await createSupabaseServerClient()
  const ids = nodes.map((n) => n.contract_id)

  const [{ data: details }, { data: contractDocs }] = await Promise.all([
    supabase.from("v_contract_detail").select("*").in("id", ids),
    supabase
      .from("documents")
      .select("id, project_id, contract_id, document_type, file_name, sharepoint_url, secop_document_url, created_at")
      .in("contract_id", ids),
  ])

  const detailMap = new Map((details ?? []).map((d) => [d.id as string, d]))
  const docsByContract = new Map<string, ProjectDocument[]>()

  for (const row of contractDocs ?? []) {
    const cid = row.contract_id as string
    if (!docsByContract.has(cid)) docsByContract.set(cid, [])
    docsByContract.get(cid)!.push({
      id: row.id,
      project_id: row.project_id ?? projectId,
      contract_id: cid,
      document_type: row.document_type,
      name: row.file_name,
      sharepoint_url: row.sharepoint_url,
      secop_document_url: row.secop_document_url,
      created_at: row.created_at,
    })
  }

  return nodes.map((node) => {
    const d = detailMap.get(node.contract_id)
    return {
      ...node,
      supervisor_name: (d?.supervisor_name as string | null) ?? null,
      start_date: (d?.start_date as string | null) ?? null,
      end_date: (d?.end_date as string | null) ?? null,
      subscription_date: (d?.subscription_date as string | null) ?? null,
      days_remaining: d?.days_remaining != null ? Number(d.days_remaining) : null,
      documents: docsByContract.get(node.contract_id) ?? [],
    }
  })
}

async function loadBudgetMovements(
  projectId: string,
  contractIds: string[]
): Promise<ProjectBudgetMovement[]> {
  const supabase = await createSupabaseServerClient()

  let rows: Record<string, unknown>[] = []

  const { data: byProject, error: projectErr } = await supabase
    .from("budget_commitments")
    .select("*, contracts ( contract_number )")
    .eq("project_id", projectId)
    .order("date", { ascending: false })

  if (!projectErr && byProject?.length) {
    rows = byProject
  } else if (contractIds.length > 0) {
    const { data: byContract } = await supabase
      .from("budget_commitments")
      .select("*, contracts ( contract_number )")
      .in("contract_id", contractIds)
      .order("date", { ascending: false })
    rows = byContract ?? []
  }

  return rows.map((row) => {
    const c = row.contracts as
      | { contract_number: string | null }
      | { contract_number: string | null }[]
      | null
    const contract = Array.isArray(c) ? c[0] : c
    return {
      id: row.id as string,
      contract_id: row.contract_id as string,
      contract_number: contract?.contract_number ?? null,
      commitment_type: row.commitment_type as string,
      number: row.number as string,
      value: Number(row.value ?? 0),
      budget_code: (row.budget_code as string | null) ?? null,
      date: (row.date as string | null) ?? null,
      is_addition: Boolean(row.is_addition),
    }
  })
}

async function enrichProjectManager<T>(project: T): Promise<T> {
  return project
}

export async function getProjectExpedienteData(
  projectId: string
): Promise<ProjectExpedienteData | null> {
  const warnings: string[] = []

  const numericId = parseInt(projectId, 10)
  if (isNaN(numericId)) return null

  const project = await safeExpedienteLoad(
    "Proyecto",
    () => getProjectByNumericId(numericId),
    null,
    warnings
  )
  if (!project) return null

  const [
    rawTree,
    followups,
    assignments,
    documents,
    indicators,
    alerts,
    financial,
    payments,
    primary_contract,
  ] = await Promise.all([
    safeExpedienteLoad(
      "Árbol contractual",
      () => getProjectContractTree(projectId),
      [],
      warnings
    ),
    safeExpedienteLoad(
      "Seguimiento",
      () => getProjectFollowups(projectId),
      [],
      warnings
    ),
    safeExpedienteLoad(
      "Asignaciones",
      () => getProjectAssignments(projectId),
      [],
      warnings
    ),
    safeExpedienteLoad(
      "Documentos",
      () => getProjectDocuments(projectId),
      [],
      warnings
    ),
    safeExpedienteLoad(
      "Indicadores",
      () => getProjectIndicators(projectId),
      [],
      warnings
    ),
    safeExpedienteLoad(
      "Alertas",
      () => getProjectAlerts(projectId),
      [],
      warnings
    ),
    safeExpedienteLoad(
      "Resumen financiero",
      () => getProjectFinancialSummary(projectId),
      null,
      warnings
    ),
    safeExpedienteLoad(
      "Pagos",
      () => getProjectPayments(projectId),
      [],
      warnings
    ),
    Promise.resolve(null),
  ])

  const contract_tree = await safeExpedienteLoad(
    "Detalle contractual",
    () => enrichContractTree(projectId, rawTree),
    [],
    warnings
  )
  const contractIds = contract_tree.map((n) => n.contract_id)
  const movements = await safeExpedienteLoad(
    "Movimientos presupuestales",
    () => loadBudgetMovements(projectId, contractIds),
    [],
    warnings
  )
  const enrichedProject = await safeExpedienteLoad(
    "Gerente de proyecto",
    () => enrichProjectManager(project),
    project,
    warnings
  )

  const computed = computeMetrics(contract_tree, alerts)

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    project: enrichedProject as any,
    primary_contract,
    contract_tree,
    followups,
    assignments,
    documents,
    indicators,
    alerts,
    financial,
    payments,
    movements,
    computed,
    load_warnings: warnings.length > 0 ? warnings : undefined,
  }
}
