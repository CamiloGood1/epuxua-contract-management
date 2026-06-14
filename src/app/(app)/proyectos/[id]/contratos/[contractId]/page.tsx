import { notFound } from "next/navigation"
import {
  getContractById,
  getContractTrackingById,
  getContractFollowups,
  getDerivedContracts,
} from "@/services/contracts.service"
import { getProjectById } from "@/services/projects.service"
import { ContractDetail } from "@/modules/contracts/components/contract-detail"
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
  params: Promise<{ id: string; contractId: string }>
}

// ── Carga datos del expediente derivado y renderiza ───────────────────────────

async function renderDerivedExpediente(
  contratoId: number,
  projectId: string,
) {
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
  if (!contrato) notFound()

  // Cargar info del padre si tiene id_interadministrativo
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
    />
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function ProyectoContratoPage({ params }: PageProps) {
  const { id: projectId, contractId } = await params

  // ── Path A: ID numérico → tabla contratos (nuevo sistema de derivados) ──────
  const numericId = parseInt(contractId, 10)

  if (!isNaN(numericId)) {
    // Verificar que el proyecto existe (para la breadcrumb / back link)
    const project = await getProjectById(projectId).catch(() => null)
    if (!project) notFound()

    // Verificar que el contrato pertenece a este proyecto antes de renderizar
    const supabase = await createSupabaseServerClient()
    const { data: check } = await supabase
      .from("contratos")
      .select("id, tipo_contrato, id_interadministrativo")
      .eq("id", numericId)
      .maybeSingle()

    if (!check) notFound()

    if (check.tipo_contrato === "DERIVADO") {
      return renderDerivedExpediente(numericId, projectId)
    }

    // Si es otro tipo en la tabla contratos, caer al sistema antiguo por número
    // (fallthrough)
  }

  // ── Path B: UUID → sistema antiguo (v_contract_detail) ───────────────────────
  const [project, contract, profile] = await Promise.all([
    getProjectById(projectId).catch(() => null),
    getContractById(contractId).catch(() => null),
    getCurrentUserProfile().catch(() => null),
  ])

  if (!project || !contract) notFound()

  // ── Si es DERIVADO en el sistema antiguo → buscar en tabla contratos ─────────
  if (contract.contract_type === "DERIVADO") {
    const supabase = await createSupabaseServerClient()

    // Buscar el registro correspondiente en contratos por numero_contrato
    const { data: contratoRef } = await supabase
      .from("contratos")
      .select("id")
      .eq("numero_contrato", contract.contract_number)
      .eq("tipo_contrato", "DERIVADO")
      .maybeSingle()

    if (contratoRef?.id) {
      return renderDerivedExpediente(contratoRef.id as number, projectId)
    }

    // Si no existe en contratos aún, mostrar la vista antigua de solo lectura
    // (el derivado existe en contracts pero no ha sido migrado a contratos)
  }

  // ── Path C: contratos no-DERIVADO → comportamiento original ──────────────────
  const [tracking, followups, derivedContracts] = await Promise.all([
    getContractTrackingById(contractId).catch(() => null),
    getContractFollowups(contractId).catch(() => []),
    contract.contract_type === "INTERADMINISTRATIVO"
      ? getDerivedContracts(contractId).catch(() => [])
      : Promise.resolve([]),
  ])

  return (
    <ContractDetail
      contract={contract}
      physicalProgress={tracking?.last_physical_progress ?? null}
      followups={followups}
      derivedContracts={derivedContracts}
      backHref={`/proyectos/${projectId}`}
      backLabel={`Contrato ${"id_contrato" in project ? project.id_contrato : (project as { project_code?: string }).project_code ?? ""}`}
      projectId={projectId}
    />
  )
}
