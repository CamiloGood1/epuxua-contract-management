import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/services/user.service"
import { canEditProjects } from "@/modules/projects/lib/access"
import { DerivedContractExpediente } from "@/modules/contracts/components/derivado/derivado-expediente"
import type { Contrato, Interadministrativo } from "@/types/database"
import type {
  ContractTask, ContractPago, ContractChangeLogEntry,
  ContractModificacionesData,
  ContractAdicion, ContractProrroga, ContractSuspension,
  ContractReinicio, ContractAclaratorio,
} from "@/types/contract-derivado"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DerivadoExpedientePage({ params }: PageProps) {
  const { id } = await params
  const contratoId = parseInt(id, 10)
  if (isNaN(contratoId)) notFound()

  const supabase = await createSupabaseServerClient()

  const [
    profile,
    { data: contratoRaw },
    { data: tasksRaw },
    { data: adicionesRaw },
    { data: prorrogasRaw },
    { data: suspensionesRaw },
    { data: reiniciosRaw },
    { data: aclaratioriosRaw },
    { data: pagosRaw },
    { data: changeLogRaw },
  ] = await Promise.all([
    getCurrentUserProfile().catch(() => null),
    supabase.from("contratos").select("*").eq("id", contratoId).maybeSingle(),
    supabase.from("contract_tasks"        as never).select("*").eq("contrato_id", contratoId).is("deleted_at", null).order("created_at"),
    supabase.from("contract_adiciones"    as never).select("*").eq("contrato_id", contratoId).order("numero_adicion"),
    supabase.from("contract_prorrogas"    as never).select("*").eq("contrato_id", contratoId).order("numero_prorroga"),
    supabase.from("contract_suspensiones" as never).select("*").eq("contrato_id", contratoId).order("numero_suspension"),
    supabase.from("contract_reinicios"    as never).select("*").eq("contrato_id", contratoId).order("numero_reinicio"),
    supabase.from("contract_aclaratorios" as never).select("*").eq("contrato_id", contratoId).order("numero_aclaratorio"),
    supabase.from("contract_pagos"        as never).select("*").eq("contrato_id", contratoId).order("numero_pago"),
    supabase.from("contract_derivado_change_log" as never).select("*").eq("contrato_id", contratoId).order("changed_at", { ascending: false }).limit(200),
  ])

  const contrato = contratoRaw as Contrato | null
  if (!contrato || contrato.tipo_contrato !== "DERIVADO") notFound()

  // Padre interadministrativo
  let parentInfo: Pick<Interadministrativo, "id_contrato" | "objeto_contrato" | "secretaria" | "estado" | "total_contrato"> | null = null
  if (contrato.id_interadministrativo) {
    const { data: pRaw } = await supabase
      .from("interadministrativos")
      .select("id_contrato, objeto_contrato, secretaria, estado, total_contrato")
      .eq("id_contrato", contrato.id_interadministrativo)
      .maybeSingle()
    if (pRaw) parentInfo = pRaw as Pick<Interadministrativo, "id_contrato" | "objeto_contrato" | "secretaria" | "estado" | "total_contrato">
  }

  const modificaciones: ContractModificacionesData = {
    adiciones:    (adicionesRaw    ?? []) as ContractAdicion[],
    prorrogas:    (prorrogasRaw    ?? []) as ContractProrroga[],
    suspensiones: (suspensionesRaw ?? []) as ContractSuspension[],
    reinicios:    (reiniciosRaw    ?? []) as ContractReinicio[],
    aclaratorios: (aclaratioriosRaw ?? []) as ContractAclaratorio[],
  }

  const canEdit = canEditProjects(profile?.role) && (
    profile?.role === "ADMIN" || profile?.role === "GERENTE" || profile?.role === "GERENTE_PROYECTO"
  )

  // projectId = id_interadministrativo del contrato (para las server actions de revalidación)
  const projectId = contrato.id_interadministrativo ?? String(contratoId)

  return (
    <DerivedContractExpediente
      contrato={contrato}
      parent={parentInfo}
      canEdit={canEdit}
      projectId={projectId}
      tasks={(tasksRaw ?? []) as ContractTask[]}
      modificaciones={modificaciones}
      pagos={(pagosRaw ?? []) as ContractPago[]}
      changeLog={(changeLogRaw ?? []) as ContractChangeLogEntry[]}
      backHref="/contratacion/derivados"
      backLabel="Volver a Derivados"
    />
  )
}
