import { PageShell } from "@/components/ui/page-shell"
import { getGlobalPaymentsSummary } from "@/services/project-financial.service"
import { formatCOP, formatDate } from "@/modules/contracts/lib/status"

export default async function FinancieroPagosPage() {
  let payments: Awaited<ReturnType<typeof getGlobalPaymentsSummary>> = []
  let loadError: string | null = null

  try {
    payments = await getGlobalPaymentsSummary()
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar pagos"
  }

  return (
    <PageShell
      title="Pagos"
      subtitle="Pagos registrados a nivel de proyecto."
      icon="payments"
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
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Proyecto</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Bruto</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Neto</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Sin pagos registrados.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const proj = p.projects as { project_code?: string; name?: string } | { project_code?: string; name?: string }[] | null
                const project = Array.isArray(proj) ? proj[0] : proj
                const gross = Number(p.gross_value ?? 0)
                const deductions = Number(p.deductions ?? 0)
                return (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="px-4 py-3">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[var(--corporate-blue)]">
                        {project?.project_code ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCOP(gross)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCOP(gross - deductions)}
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
