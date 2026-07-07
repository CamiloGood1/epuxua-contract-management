"use client"

import { useState, useMemo } from "react"
import { CheckCircle2, AlertTriangle, XCircle, Search, ChevronDown, ChevronUp, Copy, Check, Download, ClipboardList, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuditReport, ContractAuditResult, AuditFinding, AuditStatus } from "@/modules/admin/audit/types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  report: AuditReport
}

type SeverityFilter = "all" | "error" | "warning" | "ok"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function statusConfig(status: AuditStatus) {
  switch (status) {
    case "ok":
      return { label: "Correcto", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" }
    case "warning":
      return { label: "Advertencia", icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" }
    case "error":
      return { label: "Error crítico", icon: XCircle, className: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" }
  }
}

function severityBadge(severity: "error" | "warning") {
  if (severity === "error") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"><XCircle size={11} /> Error</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"><AlertTriangle size={11} /> Advertencia</span>
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass }: {
  label: string
  value: number
  icon: React.ElementType
  colorClass: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card px-5 py-4">
      <div className={cn("flex items-center gap-2 text-sm font-medium", colorClass)}>
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  )
}

// ── SQL Modal ─────────────────────────────────────────────────────────────────

function SqlModal({ sql, onClose }: { sql: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl rounded-2xl border bg-card shadow-2xl flex flex-col gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-base">Sugerencia de reparación SQL</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Solo lectura — este SQL no se ejecutará automáticamente.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle size={14} />
          Revise y valide este SQL antes de ejecutarlo en producción. Considere hacer un respaldo previo.
        </div>

        <div className="p-5">
          <pre className="rounded-lg bg-muted/60 p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
            {sql}
          </pre>
        </div>

        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar SQL</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Finding Row ───────────────────────────────────────────────────────────────

function FindingRow({ finding, onShowSql }: { finding: AuditFinding; onShowSql: (sql: string) => void }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 py-3 px-4 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/60">
      <div className="pt-0.5">{severityBadge(finding.severity)}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{finding.message}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
          <span>Módulo: <strong className="text-foreground">{finding.module}</strong></span>
          <span>Campo: <code className="bg-muted rounded px-1">{finding.field}</code></span>
          {finding.expected && <span>Esperado: <strong className="text-foreground">{finding.expected}</strong></span>}
          {finding.found && <span>Encontrado: <strong className="text-destructive">{finding.found}</strong></span>}
        </div>
      </div>
      <div className="flex items-start">
        {finding.sqlFix && (
          <button
            type="button"
            onClick={() => onShowSql(finding.sqlFix!)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap"
          >
            <ClipboardList size={12} />
            SQL
          </button>
        )}
      </div>
    </div>
  )
}

// ── Contract Row ──────────────────────────────────────────────────────────────

function ContractRow({ result, onShowSql }: {
  result: ContractAuditResult
  onShowSql: (sql: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig(result.status)
  const Icon = cfg.icon
  const errorCount   = result.findings.filter((f) => f.severity === "error").length
  const warningCount = result.findings.filter((f) => f.severity === "warning").length

  return (
    <div className={cn("rounded-xl border transition-colors", expanded && "border-border shadow-sm")}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full grid grid-cols-[32px_minmax(0,1fr)_minmax(0,2fr)_auto_auto] gap-3 items-center px-4 py-3 text-left hover:bg-muted/40 rounded-xl transition-colors"
      >
        {/* Status icon */}
        <Icon size={18} className={cfg.className} />

        {/* Contract number */}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{result.contractNumber}</p>
        </div>

        {/* Contract name */}
        <div className="min-w-0 hidden sm:block">
          <p className="text-sm text-muted-foreground truncate">{result.contractName ?? "—"}</p>
        </div>

        {/* Findings badges */}
        <div className="flex items-center gap-1.5 justify-end">
          {result.status === "ok" ? (
            <span className="text-xs text-muted-foreground">Sin hallazgos</span>
          ) : (
            <>
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                  <XCircle size={10} /> {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  <AlertTriangle size={10} /> {warningCount}
                </span>
              )}
            </>
          )}
        </div>

        {/* Expand toggle */}
        <div className="text-muted-foreground">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && result.findings.length > 0 && (
        <div className="px-4 pb-4 flex flex-col gap-1 border-t pt-3">
          {result.findings.map((f) => (
            <FindingRow key={f.ruleId} finding={f} onShowSql={onShowSql} />
          ))}
        </div>
      )}

      {expanded && result.findings.length === 0 && (
        <div className="px-4 pb-4 border-t pt-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Todas las validaciones pasaron correctamente.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function IntegridadDashboard({ report }: Props) {
  const { summary, results } = report

  const [search, setSearch]         = useState("")
  const [filter, setFilter]         = useState<SeverityFilter>("all")
  const [activeSql, setActiveSql]   = useState<string | null>(null)
  const [showOnlyIssues, setShowOnlyIssues] = useState(true)

  const filtered = useMemo(() => {
    let list = results
    if (showOnlyIssues) list = list.filter((r) => r.status !== "ok")
    if (filter !== "all") list = list.filter((r) => r.status === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) => r.contractNumber.toLowerCase().includes(q) || (r.contractName ?? "").toLowerCase().includes(q)
      )
    }
    // Sort: errors first, then warnings, then ok
    return [...list].sort((a, b) => {
      const order: Record<AuditStatus, number> = { error: 0, warning: 1, ok: 2 }
      return order[a.status] - order[b.status]
    })
  }, [results, filter, search, showOnlyIssues])

  function handleExcel() {
    window.open("/api/reports/excel/integridad", "_blank")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Análisis ejecutado: <strong>{formatDate(summary.runAt)}</strong>
          {" · "}Módulo activo: <strong>Consistencia Financiera</strong>
        </p>
        <button
          type="button"
          onClick={handleExcel}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download size={14} />
          Exportar Excel
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Contratos analizados" value={summary.totalAnalyzed}   icon={Filter}       colorClass="text-muted-foreground" />
        <KpiCard label="Sin hallazgos"         value={summary.totalOk}         icon={CheckCircle2} colorClass="text-emerald-600 dark:text-emerald-400" />
        <KpiCard label="Con advertencias"      value={summary.totalWarnings}   icon={AlertTriangle} colorClass="text-amber-600 dark:text-amber-400" />
        <KpiCard label="Con errores críticos"  value={summary.totalErrors}     icon={XCircle}      colorClass="text-red-600 dark:text-red-400" />
        <KpiCard label="Total hallazgos"       value={summary.totalFindings}   icon={ClipboardList} colorClass="text-blue-600 dark:text-blue-400" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por contrato u objeto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SeverityFilter)}
          className="px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todos los estados</option>
          <option value="error">Solo errores críticos</option>
          <option value="warning">Solo advertencias</option>
          <option value="ok">Solo correctos</option>
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyIssues}
            onChange={(e) => setShowOnlyIssues(e.target.checked)}
            className="rounded border-border"
          />
          Ocultar contratos sin hallazgos
        </label>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground -mt-2">
        Mostrando <strong>{filtered.length}</strong> de <strong>{results.length}</strong> contratos
      </p>

      {/* Results list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-2xl border border-dashed">
          <CheckCircle2 size={40} className="text-emerald-500" />
          <div>
            <p className="font-semibold text-lg">Sin hallazgos</p>
            <p className="text-sm text-muted-foreground mt-1">
              {results.length === 0
                ? "No hay contratos registrados."
                : "Todos los contratos pasaron las validaciones con los filtros actuales."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((result) => (
            <ContractRow
              key={result.contractId}
              result={result}
              onShowSql={(sql) => setActiveSql(sql)}
            />
          ))}
        </div>
      )}

      {/* SQL Modal */}
      {activeSql && (
        <SqlModal sql={activeSql} onClose={() => setActiveSql(null)} />
      )}
    </div>
  )
}
