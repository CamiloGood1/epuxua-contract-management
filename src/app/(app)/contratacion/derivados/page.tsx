import { GitBranch } from "lucide-react"
import {
  getAllDerivedContracts,
  getDerivedContractsKPIs,
} from "@/services/derived-contracts.service"
import { DerivedContractsClient } from "@/modules/derived-contracts/components/derived-contracts-client"
import { getCurrentUserProfile } from "@/services/user.service"
import { canCreateProject } from "@/modules/projects/lib/access"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const CAN_CREATE_FUNC_ROLES = new Set(["ADMIN", "GERENTE"])

export default async function ContratacionDerivadosPage() {
  const [contracts, profile] = await Promise.all([
    getAllDerivedContracts().catch(() => []),
    getCurrentUserProfile().catch(() => null),
  ])

  const kpis    = await getDerivedContractsKPIs(contracts)
  const canCreate = canCreateProject(profile?.role)
  const canCreateFuncionamiento = CAN_CREATE_FUNC_ROLES.has(profile?.role ?? "")

  // Only fetch interadmins if the user can create derivados
  let interadmins: { id: number; id_contrato: string; objeto_contrato: string | null }[] = []
  if (canCreate) {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("interadministrativos")
      .select("id, id_contrato, objeto_contrato")
      .order("id_contrato")
    interadmins = (data ?? []) as typeof interadmins
  }

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--corporate-blue)]/10 flex items-center justify-center shrink-0 mt-0.5">
            <GitBranch size={20} className="text-[var(--corporate-blue)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Contratos derivados
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Contratos directos vinculados a interadministrativos. Busca por número,
              objeto o contratista, o entra desde el expediente del proyecto.
            </p>
          </div>
        </div>
      </div>

      <DerivedContractsClient
        contracts={contracts}
        kpis={kpis}
        canCreate={canCreate}
        canCreateFuncionamiento={canCreateFuncionamiento}
        interadmins={interadmins}
      />
    </div>
  )
}
