import { PageShell } from "@/components/ui/page-shell"
import { IntegridadDashboard } from "@/modules/admin/components/integridad/integridad-dashboard"
import { canManageUsers } from "@/modules/projects/lib/access"
import { getCurrentUserProfile } from "@/services/user.service"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { auditContract } from "@/modules/admin/audit/financial-audit"
import type { AuditReport } from "@/modules/admin/audit/types"
import type { Interadministrativo } from "@/types/database"
import type { Adicion, Prorroga } from "@/types/modificaciones"
import type { PaymentMilestone } from "@/types/forma-pago"

export const dynamic = "force-dynamic"

function groupById<T extends { interadministrativo_id: number }>(arr: T[]): Map<number, T[]> {
  const m = new Map<number, T[]>()
  for (const item of arr) {
    const list = m.get(item.interadministrativo_id) ?? []
    list.push(item)
    m.set(item.interadministrativo_id, list)
  }
  return m
}

/** Recupera todos los registros de una tabla paginando de 1000 en 1000. */
async function fetchAll<T>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  columns: string,
): Promise<T[]> {
  const PAGE = 1000
  const result: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await (supabase as never as {
      from: (t: string) => { select: (c: string) => { range: (a: number, b: number) => Promise<{ data: T[] | null; error: unknown }> } }
    }).from(table).select(columns).range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    result.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return result
}

async function runAudit(): Promise<AuditReport> {
  const supabase = await createSupabaseServerClient()

  // Contratos: select(*) justificado — las 13 reglas usan ~15 campos distintos del modelo.
  const { data: contractsRaw } = await supabase
    .from("interadministrativos")
    .select("*")
    .order("id_contrato")

  // Tablas de detalle: solo columnas usadas por las reglas de auditoría.
  const [adiciones, prorrogas, hitos] = await Promise.all([
    fetchAll<Adicion>(
      supabase,
      "interadmin_adiciones",
      "id, interadministrativo_id, numero_adicion, valor_total, valor_bienes_servicios, valor_cuota_gerencia",
    ),
    fetchAll<Prorroga>(
      supabase,
      "interadmin_prorrogas",
      "id, interadministrativo_id, numero_prorroga, nueva_fecha_terminacion",
    ),
    fetchAll<PaymentMilestone>(
      supabase,
      "contract_payment_schedule",
      "interadministrativo_id, scheduled_value, destination, percentage",
    ),
  ])

  const contracts = (contractsRaw ?? []) as Interadministrativo[]

  const adicionesMap  = groupById(adiciones)
  const prorrogasMap  = groupById(prorrogas)
  const hitosMap      = groupById(hitos)

  const results = contracts.map((c) =>
    auditContract({
      contract:  c,
      adiciones: adicionesMap.get(c.id)  ?? [],
      prorrogas: prorrogasMap.get(c.id)  ?? [],
      hitos:     hitosMap.get(c.id)      ?? [],
    })
  )

  const totalErrors   = results.filter((r) => r.status === "error").length
  const totalWarnings = results.filter((r) => r.status === "warning").length
  const totalOk       = results.filter((r) => r.status === "ok").length
  const totalFindings = results.reduce((s, r) => s + r.findings.length, 0)

  return {
    results,
    summary: {
      totalAnalyzed: results.length,
      totalOk,
      totalWarnings,
      totalErrors,
      totalFindings,
      runAt: new Date().toISOString(),
    },
  }
}

export default async function IntegridadPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile) {
    return (
      <PageShell title="Integridad de Datos" subtitle="">
        <p className="text-sm text-muted-foreground">No hay sesión activa.</p>
      </PageShell>
    )
  }

  if (!canManageUsers(profile.role)) {
    return (
      <PageShell title="Integridad de Datos" subtitle="">
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          Acceso exclusivo para administradores.
        </div>
      </PageShell>
    )
  }

  const report = await runAudit()

  return (
    <PageShell
      title="Centro de Integridad de Datos"
      subtitle="Auditoría automática de consistencia financiera en todos los contratos."
    >
      <IntegridadDashboard report={report} />
    </PageShell>
  )
}
