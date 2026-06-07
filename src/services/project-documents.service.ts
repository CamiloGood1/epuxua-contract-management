import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ProjectDocument } from "@/types/project"

function mapDocumentRow(row: Record<string, unknown>): ProjectDocument {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    document_type: (row.document_type as string | null) ?? null,
    name: (row.file_name as string) ?? "Documento",
    sharepoint_url: (row.sharepoint_url as string | null) ?? null,
    secop_document_url: (row.secop_document_url as string | null) ?? null,
    created_at: row.created_at as string,
  }
}

export async function getProjectDocuments(
  projectId: string
): Promise<ProjectDocument[]> {
  const supabase = await createSupabaseServerClient()

  const full = await supabase
    .from("documents")
    .select(
      "id, project_id, document_type, file_name, sharepoint_url, secop_document_url, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (!full.error && full.data) {
    return full.data.map((row) => mapDocumentRow(row as Record<string, unknown>))
  }

  const minimal = await supabase
    .from("documents")
    .select("id, project_id, document_type, file_name, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (minimal.error) return []
  return (minimal.data ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>))
}

export async function getAllDocuments(limit = 200): Promise<ProjectDocument[]> {
  const supabase = await createSupabaseServerClient()

  const full = await supabase
    .from("documents")
    .select(
      `
      id,
      project_id,
      document_type,
      file_name,
      sharepoint_url,
      secop_document_url,
      created_at,
      projects ( project_code, name )
    `
    )
    .not("project_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!full.error && full.data) {
    return full.data.map((row) => mapDocumentRow(row as Record<string, unknown>))
  }

  const minimal = await supabase
    .from("documents")
    .select("id, project_id, document_type, file_name, created_at")
    .not("project_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (minimal.error) return []
  return (minimal.data ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>))
}
