import Link from "next/link"
import { PageShell } from "@/components/ui/page-shell"
import { getAllDocuments } from "@/services/project-documents.service"
import { ExternalLink } from "lucide-react"

export default async function DocumentosPage() {
  let documents: Awaited<ReturnType<typeof getAllDocuments>> = []
  let loadError: string | null = null

  try {
    documents = await getAllDocuments()
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error al cargar documentos"
  }

  const byType = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    const type = doc.document_type ?? "Sin clasificar"
    if (!acc[type]) acc[type] = []
    acc[type].push(doc)
    return acc
  }, {})

  return (
    <PageShell
      title="Documentos"
      subtitle="Metadatos de documentos en SharePoint y SECOP. Los archivos no se almacenan en Supabase."
      icon="folder"
    >
      {loadError && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive mb-4">
          {loadError}
        </div>
      )}
      {Object.keys(byType).length === 0 ? (
        <div className="epuxua-card p-12 text-center text-muted-foreground">
          Sin documentos vinculados a proyectos.
        </div>
      ) : (
        Object.entries(byType).map(([type, docs]) => (
          <div key={type} className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              {type}
            </h2>
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  className="epuxua-card p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <Link
                      href={`/proyectos/${doc.project_id}?tab=documentos`}
                      className="text-xs text-[var(--corporate-blue)] hover:underline"
                    >
                      Ver en expediente
                    </Link>
                  </div>
                  <div className="flex gap-3">
                    {doc.sharepoint_url && (
                      <a
                        href={doc.sharepoint_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--corporate-blue)]"
                      >
                        SharePoint <ExternalLink size={12} />
                      </a>
                    )}
                    {doc.secop_document_url && (
                      <a
                        href={doc.secop_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                      >
                        SECOP <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </PageShell>
  )
}
