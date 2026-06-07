"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ProjectLifecycle } from "@/types/project"

export async function updateProjectLifecycle(
  projectId: string,
  lifecycleStatus: ProjectLifecycle
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("projects")
    .update({ lifecycle_status: lifecycleStatus })
    .eq("id", projectId)

  if (error) return { error: error.message }

  revalidatePath("/proyectos/kanban")
  revalidatePath("/proyectos")
  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath("/")

  return { error: null }
}
