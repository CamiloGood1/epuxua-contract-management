import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { canCurrentUserAccessInteradmin } from "@/services/interadmin-access"
import { canEditProjects, canDeleteProject, canEditFinancialTabs, canDownloadReport } from "@/modules/projects/lib/access"
import { InteradministrativoDetail } from "@/modules/projects/components/interadministrativo-detail"
import type { Interadministrativo, Contrato } from "@/types/database"
import type { ModificacionesData } from "@/types/modificaciones"
import { EMPTY_MODIFICACIONES } from "@/types/modificaciones"
import type { Factura } from "@/types/facturas"
import type { PaymentMilestone } from "@/types/forma-pago"
import type { Tarea, Avance } from "@/types/seguimiento"
import type { FundingData, FundingGroup, FundingSource } from "@/types/funding"
import { calcConsolidatedFromSources } from "@/types/funding"
import type { FinancialReturnsData, FinancialReturn, FinancialReturnDistribution } from "@/types/financial-returns"
import { syncFundingGroups } from "@/services/funding.actions"

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function ProyectoDetallePage({ params }: PageProps) {
  const { id } = await params

  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) notFound()

  const supabase = await createSupabaseServerClient()

  const [{ data: project, error: projError }, profile] = await Promise.all([
    supabase
      .from("interadministrativos")
      .select("*")
      .eq("id", numericId)
      .maybeSingle(),
    getCurrentUserProfile().catch(() => null),
  ])

  if (projError || !project) notFound()

  const hasAccess = await canCurrentUserAccessInteradmin(numericId)
  if (!hasAccess) notFound()

  const [
    { data: contratos, error: contError },
    { data: adiciones },
    { data: prorrogas },
    { data: suspensiones },
    { data: reinicios },
    { data: aclaratorios },
    { data: facturasRaw },
    { data: hitosRaw },
    { data: tareasRaw },
    { data: avancesRaw },
  ] = await Promise.all([
    supabase.from("contratos").select("*").eq("id_interadministrativo", project.id_contrato).order("numero_contrato", { ascending: true }).limit(500),
    supabase.from("interadmin_adiciones"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_adicion",    { ascending: true }),
    supabase.from("interadmin_prorrogas"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_prorroga",   { ascending: true }),
    supabase.from("interadmin_suspensiones" as never).select("*").eq("interadministrativo_id", numericId).order("numero_suspension", { ascending: true }),
    supabase.from("interadmin_reinicios"    as never).select("*").eq("interadministrativo_id", numericId).order("numero_reinicio",   { ascending: true }),
    supabase.from("interadmin_aclaratorios" as never).select("*").eq("interadministrativo_id", numericId).order("numero_aclaratorio",{ ascending: true }),
    supabase.from("interadmin_facturas"           as never).select("*").eq("interadministrativo_id", numericId).order("fecha_remision",      { ascending: false }),
    supabase.from("contract_payment_schedule" as never).select("*").eq("interadministrativo_id", numericId).order("milestone_number", { ascending: true  }),
    supabase.from("interadmin_tasks"   as never).select("*").eq("interadministrativo_id", numericId).is("deleted_at", null).order("created_at", { ascending: true }),
    supabase.from("interadmin_avances" as never).select("*").eq("interadministrativo_id", numericId).order("fecha",      { ascending: false }),
  ])

  const modificaciones: ModificacionesData = {
    adiciones:    (adiciones    as ModificacionesData["adiciones"]    | null) ?? EMPTY_MODIFICACIONES.adiciones,
    prorrogas:    (prorrogas    as ModificacionesData["prorrogas"]    | null) ?? EMPTY_MODIFICACIONES.prorrogas,
    suspensiones: (suspensiones as ModificacionesData["suspensiones"] | null) ?? EMPTY_MODIFICACIONES.suspensiones,
    reinicios:    (reinicios    as ModificacionesData["reinicios"]    | null) ?? EMPTY_MODIFICACIONES.reinicios,
    aclaratorios: (aclaratorios as ModificacionesData["aclaratorios"] | null) ?? EMPTY_MODIFICACIONES.aclaratorios,
  }

  await syncFundingGroups(
    numericId,
    project.valor_inicial,
    modificaciones.adiciones,
  ).catch(() => {})

  let funding: FundingData = { groups: [], sources: [], consolidated: [] }
  const [{ data: fundingGroupsRaw, error: groupsErr }, { data: fundingSourcesRaw, error: sourcesErr }] = await Promise.all([
    supabase
      .from("interadmin_funding_groups" as never)
      .select("*")
      .eq("interadministrativo_id", numericId)
      .order("group_type", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("interadmin_funding_sources" as never)
      .select("*")
      .eq("interadministrativo_id", numericId)
      .order("source_name", { ascending: true }),
  ])

  if (!groupsErr && !sourcesErr) {
    const fundingSources = (fundingSourcesRaw ?? []) as FundingSource[]
    funding = {
      groups: (fundingGroupsRaw ?? []) as FundingGroup[],
      sources: fundingSources,
      consolidated: calcConsolidatedFromSources(numericId, fundingSources),
    }
  }

  let financialReturns: FinancialReturnsData = { returns: [], distributions: [] }
  const [{ data: returnsRaw, error: returnsErr }, { data: distRaw, error: distErr }] = await Promise.all([
    supabase
      .from("interadmin_financial_returns" as never)
      .select("*")
      .eq("interadministrativo_id", numericId)
      .order("return_year", { ascending: false })
      .order("return_month", { ascending: false }),
    supabase
      .from("interadmin_financial_return_distribution" as never)
      .select("*")
      .eq("interadministrativo_id", numericId),
  ])

  if (!returnsErr && !distErr) {
    financialReturns = {
      returns: (returnsRaw ?? []) as FinancialReturn[],
      distributions: (distRaw ?? []) as FinancialReturnDistribution[],
    }
  }

  return (
    <div className="space-y-0">
      <div className="px-3 sm:px-6 pt-4 sm:pt-5">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </Link>
      </div>

      <InteradministrativoDetail
        project={project as Interadministrativo}
        contratos={(contratos ?? []) as Contrato[]}
        canEdit={canEditProjects(profile?.role)}
        canEditFinancial={canEditFinancialTabs(profile?.role)}
        canDelete={canDeleteProject(profile?.role)}
        canDownloadReport={canDownloadReport(profile?.role)}
        modificaciones={modificaciones}
        hitos={(hitosRaw ?? []) as PaymentMilestone[]}
        facturas={(facturasRaw ?? []) as Factura[]}
        tareas={(tareasRaw ?? []) as Tarea[]}
        avances={(avancesRaw ?? []) as Avance[]}
        funding={funding}
        financialReturns={financialReturns}
        contratosError={contError?.message}
      />
    </div>
  )
}
