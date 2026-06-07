import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ProjectDocument } from "@/types/project"

export async function getProjectDocuments(
  projectId: string
): Promise<ProjectDocument[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("documents")
    .select("id, project_id, document_type, file_name, sharepoint_url, secop_document_url, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    project_id: row.project_id,
    document_type: row.document_type,
    name: row.file_name,
    sharepoint_url: row.sharepoint_url,
    secop_document_url: row.secop_document_url,
    created_at: row.created_at,
  })) as ProjectDocument[]
}

export async function getAllDocuments(limit = 200): Promise<ProjectDocument[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
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

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    project_id: row.project_id,
    document_type: row.document_type,
    name: row.file_name,
    sharepoint_url: row.sharepoint_url,
    secop_document_url: row.secop_document_url,
    created_at: row.created_at,
  })) as ProjectDocument[]
}
