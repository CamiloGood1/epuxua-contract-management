import { Suspense } from "react"
import { getContracts } from "@/services/contracts.service"
import { ContractsGrid, CardSkeleton } from "@/modules/contracts/components/contracts-grid"
import { FileText, Plus, Download } from "lucide-react"

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

function PageHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {count} contrato{count !== 1 ? "s" : ""} registrado{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Download size={14} />
          Exportar
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 transition-all shadow-sm shadow-primary/20 active:scale-95">
          <Plus size={14} />
          Nuevo contrato
        </button>
      </div>
    </div>
  )
}

export default async function ContractsPage() {
  const contracts = await getContracts().catch(() => [])

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-8">
      <PageHeader count={contracts.length} />
      <Suspense fallback={<GridSkeleton />}>
        <ContractsGrid contracts={contracts} />
      </Suspense>
    </div>
  )
}
