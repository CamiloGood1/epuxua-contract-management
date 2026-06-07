export function derivedContractHref(row: {
  id: string
  project_id?: string | null
}): string {
  if (row.project_id) return `/proyectos/${row.project_id}/contratos/${row.id}`
  return `/contracts/${row.id}`
}
