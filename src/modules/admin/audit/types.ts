// Centro de Integridad de Datos — shared types for the audit engine

export type AuditSeverity = "error" | "warning"

export type AuditStatus = "ok" | "warning" | "error"

export interface AuditFinding {
  ruleId: string
  ruleName: string
  severity: AuditSeverity
  module: string
  field: string
  message: string
  expected?: string
  found?: string
  sqlFix?: string
}

export interface ContractAuditResult {
  contractId: number
  contractNumber: string
  contractName: string | null
  status: AuditStatus
  findings: AuditFinding[]
}

export interface AuditReport {
  results: ContractAuditResult[]
  summary: AuditSummary
}

export interface AuditSummary {
  totalAnalyzed: number
  totalOk: number
  totalWarnings: number
  totalErrors: number
  totalFindings: number
  runAt: string
}

export type AuditModuleId = "consistencia-financiera"

export interface AuditModuleInfo {
  id: AuditModuleId
  name: string
  description: string
  rulesCount: number
}
