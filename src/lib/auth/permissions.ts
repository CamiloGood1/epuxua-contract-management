import type { UserRole } from "@/types/project"

// ── Etiquetas y orden canónico de roles ───────────────────────────────────────

/** Etiqueta legible para cada rol, usada en selectores y el sidebar. */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:              "Administrador",
  GERENTE:            "Gerente General",
  DIRECTIVO:          "Directivo",
  SECRETARIA_GENERAL: "Secretaría General",
  GERENTE_PROYECTO:   "Gerente de Proyecto",
  ESTRUCTURADOR:      "Estructurador",
  CONSULTOR_PROYECTO: "Consultor de Proyecto",
  ESPECTADOR:         "Espectador",
  SUBADMINISTRATIVA:  "Subadministrativa",
}

/** Orden de presentación en selectores de rol de la UI. */
export const ROLE_ORDER: UserRole[] = [
  "ADMIN",
  "GERENTE",
  "DIRECTIVO",
  "SECRETARIA_GENERAL",
  "GERENTE_PROYECTO",
  "ESTRUCTURADOR",
  "CONSULTOR_PROYECTO",
  "ESPECTADOR",
  "SUBADMINISTRATIVA",
]

// ── Matriz de permisos por módulo ─────────────────────────────────────────────
//
// Para agregar un nuevo permiso:
//   1. Definir una nueva clave en PERMISSIONS con los roles autorizados.
//   2. Crear la función de guarda exportada al final de este archivo.
//   3. Usarla en el frontend (page.tsx) y en el backend (server actions / API routes).
//
// Tabla de referencia (✅ = tiene acceso, 👁️ = solo lectura, ❌ = sin acceso):
//
// Módulo                  | ADM | GER | DIR | SEC | GP  | EST | CON | ESP | SUB
// ─────────────────────────────────────────────────────────────────────────────
// Crear Interadministrativo|  ✅ |  ❌ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Crear Derivado           |  ✅ |  ❌ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Modificaciones (crear)   |  ✅ |  ❌ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Modificaciones (editar)  |  ✅ |  ❌ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Edición general (seg/fp) |  ✅ |  ✅ |  ❌ |  ✅ |  ✅ |  ✅ |  ❌ |  ❌ |  ✅
// Rendimientos Financieros |  ✅ |  ✅ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  👁️ |  ✅
// Eliminar registros       |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Descargar reportes       |  ✅ |  ✅ |  ✅ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  ❌
// Administrar usuarios     |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Ver todos los contratos  |  ✅ |  ✅ |  ❌ |  ✅ |  ❌ |  ❌ |  ❌ |  ❌ |  ❌
// Leer todos los contratos |  ✅ |  ✅ |  ✅ |  ✅ |  ❌ |  ❌ |  ❌ |  ✅ |  ✅

export const PERMISSIONS = {
  // Contratos
  CREATE_INTERADMIN:    ["ADMIN", "SECRETARIA_GENERAL"] as UserRole[],
  CREATE_DERIVADO:      ["ADMIN", "SECRETARIA_GENERAL"] as UserRole[],

  // Modificaciones contractuales (adiciones, prórrogas, suspensiones, reinicios, aclaratorios)
  CREATE_MODIFICACION:  ["ADMIN", "SECRETARIA_GENERAL"] as UserRole[],
  EDIT_MODIFICACION:    ["ADMIN", "SECRETARIA_GENERAL"] as UserRole[],

  // Edición general de proyectos: seguimiento, facturación, forma de pago
  EDIT_PROJECT:         ["ADMIN", "SECRETARIA_GENERAL", "GERENTE", "GERENTE_PROYECTO", "ESTRUCTURADOR", "SUBADMINISTRATIVA"] as UserRole[],

  // Datos financieros: fuentes de financiación y rendimientos
  EDIT_FINANCIAL:       ["ADMIN", "SECRETARIA_GENERAL", "GERENTE", "SUBADMINISTRATIVA"] as UserRole[],

  // Eliminación (solo ADMIN)
  DELETE_ANY:           ["ADMIN"] as UserRole[],

  // Reportes descargables
  DOWNLOAD_REPORT:      ["ADMIN", "GERENTE", "DIRECTIVO", "GERENTE_PROYECTO"] as UserRole[],

  // Administración de usuarios
  MANAGE_USERS:         ["ADMIN"] as UserRole[],

  // Visibilidad global de interadministrativos
  VIEW_ALL_INTERADMINS: ["ADMIN", "GERENTE", "SECRETARIA_GENERAL"] as UserRole[],

  // Lectura (listado) de todos los interadministrativos
  READ_ALL_INTERADMINS: ["ADMIN", "GERENTE", "SECRETARIA_GENERAL", "DIRECTIVO", "ESPECTADOR", "SUBADMINISTRATIVA"] as UserRole[],

  // Solo lectura (no puede editar nada)
  READ_ONLY:            ["DIRECTIVO", "CONSULTOR_PROYECTO", "ESPECTADOR"] as UserRole[],
} as const

// ── Función interna de comprobación ──────────────────────────────────────────

function allows(permission: keyof typeof PERMISSIONS, role: UserRole | null | undefined): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role)
}

// ── Funciones de guarda por módulo ────────────────────────────────────────────

/** Crear contratos interadministrativos. */
export function canCreateInteradmin(role: UserRole | null | undefined): boolean {
  return allows("CREATE_INTERADMIN", role)
}

/** Crear contratos derivados y de funcionamiento. */
export function canCreateDerivado(role: UserRole | null | undefined): boolean {
  return allows("CREATE_DERIVADO", role)
}

/** Registrar modificaciones contractuales (adiciones, prórrogas, suspensiones, reinicios, aclaratorios). */
export function canCreateModification(role: UserRole | null | undefined): boolean {
  return allows("CREATE_MODIFICACION", role)
}

/** Editar modificaciones contractuales ya registradas. */
export function canEditModification(role: UserRole | null | undefined): boolean {
  return allows("EDIT_MODIFICACION", role)
}

/** Editar seguimiento, facturación, forma de pago (edición operativa general). */
export function canEditProject(role: UserRole | null | undefined): boolean {
  return allows("EDIT_PROJECT", role)
}

/** Editar fuentes de financiación y rendimientos financieros. */
export function canEditFinancialData(role: UserRole | null | undefined): boolean {
  return allows("EDIT_FINANCIAL", role)
}

/** Eliminar cualquier registro (actualmente solo ADMIN). */
export function canDeleteAny(role: UserRole | null | undefined): boolean {
  return allows("DELETE_ANY", role)
}

/** Descargar reportes Word/Excel/PPT. */
export function canDownloadReportFor(role: UserRole | null | undefined): boolean {
  return allows("DOWNLOAD_REPORT", role)
}

/** Administrar usuarios del sistema. */
export function canManageUsersInSystem(role: UserRole | null | undefined): boolean {
  return allows("MANAGE_USERS", role)
}

/** Ver y escribir en TODOS los contratos interadministrativos sin filtro de asignación. */
export function canViewAllContracts(role: UserRole | null | undefined): boolean {
  return allows("VIEW_ALL_INTERADMINS", role)
}

/** Leer (listar) todos los contratos interadministrativos sin filtro de asignación. */
export function canReadAllContracts(role: UserRole | null | undefined): boolean {
  return allows("READ_ALL_INTERADMINS", role)
}

/** El rol es exclusivamente de consulta — no puede crear ni editar nada. */
export function isReadOnlyUser(role: UserRole | null | undefined): boolean {
  if (!role) return true
  return allows("READ_ONLY", role)
}
