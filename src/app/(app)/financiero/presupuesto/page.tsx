import { PageShell } from "@/components/ui/page-shell"
import { getBudgetCommitments } from "@/services/project-financial.service"
import { formatCOP, formatDate } from "@/modules/contracts/lib/status"

export default async function FinancieroPresupuestoPage() {
  let commitments: Awaited<ReturnType<typeof getBudgetCommitments>> = []
  let loadError: string | null = null

  try {
    commitments = await getBudgetCommitments()
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar presupuesto"
  }

  return (
    <PageShell
      title="Presupuesto"
      subtitle="Compromisos presupuestales (CDP/CRP) por proyecto."
      icon="account_balance_wallet"
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      <div className="epuxua-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Proyecto</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {commitments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Sin compromisos presupuestales registrados.
                </td>
              </tr>
            ) : (
              commitments.map((c) => {
                const p = c.projects as { project_code?: string; name?: string } | { project_code?: string; name?: string }[] | null
                const proj = Array.isArray(p) ? p[0] : p
                return (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[var(--corporate-blue)]">
                        {proj?.project_code ?? "—"}
                      </span>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {proj?.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">{c.commitment_type ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(c.date)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCOP(c.value)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
