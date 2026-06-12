"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, Search, UserPlus, FolderKanban, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDateShort } from "@/lib/date-format"
import {
  INVITABLE_ROLES,
  roleLabel,
} from "@/modules/projects/lib/access"
import {
  bulkAssignInteradmins,
  fetchUserAssignmentIds,
  inviteUser,
  setUserActive,
  updateUserRole,
} from "@/services/users.actions"
import type { InteradminCatalogItem, UserDirectoryEntry } from "@/services/users.service"
import type { UserRole } from "@/types/project"

interface Props {
  users: UserDirectoryEntry[]
  interadminCatalog: InteradminCatalogItem[]
}

function canAssignProjects(role: UserRole): boolean {
  return role === "GERENTE_PROYECTO" || role === "CONSULTOR_PROYECTO"
}

export function UsersPageClient({ users, interadminCatalog }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("GERENTE_PROYECTO")

  const [assignUser, setAssignUser] = useState<UserDirectoryEntry | null>(null)
  const [assignSearch, setAssignSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        roleLabel(u.role).toLowerCase().includes(q)
    )
  }, [users, search])

  const filteredCatalog = useMemo(() => {
    const q = assignSearch.trim().toLowerCase()
    if (!q) return interadminCatalog
    return interadminCatalog.filter(
      (i) =>
        i.id_contrato.toLowerCase().includes(q) ||
        (i.objeto_contrato ?? "").toLowerCase().includes(q)
    )
  }, [interadminCatalog, assignSearch])

  function flash(type: "ok" | "err", text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  function openAssignModal(user: UserDirectoryEntry) {
    setAssignUser(user)
    setAssignSearch("")
    setSelectedIds(new Set())
    startTransition(async () => {
      const result = await fetchUserAssignmentIds(user.id)
      if (result.error) flash("err", result.error)
      else setSelectedIds(new Set(result.ids))
    })
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await inviteUser({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
      })
      if (result.error) {
        flash("err", result.error)
        return
      }
      flash("ok", `Se envió correo a ${inviteEmail.trim()} para que defina su contraseña.`)
      setInviteOpen(false)
      setInviteEmail("")
      setInviteName("")
      setInviteRole("GERENTE_PROYECTO")
      router.refresh()
    })
  }

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      const result = await updateUserRole(userId, role)
      if (result.error) flash("err", result.error)
      else {
        flash("ok", "Rol actualizado.")
        router.refresh()
      }
    })
  }

  function handleToggleActive(user: UserDirectoryEntry) {
    startTransition(async () => {
      const result = await setUserActive(user.id, !user.active)
      if (result.error) flash("err", result.error)
      else {
        flash("ok", user.active ? "Usuario desactivado." : "Usuario activado.")
        router.refresh()
      }
    })
  }

  function handleSaveAssignments() {
    if (!assignUser) return
    startTransition(async () => {
      const result = await bulkAssignInteradmins({
        userId: assignUser.id,
        interadministrativoIds: [...selectedIds],
      })
      if (result.error) flash("err", result.error)
      else {
        flash("ok", "Asignaciones guardadas.")
        setAssignUser(null)
        router.refresh()
      }
    })
  }

  function toggleAssignment(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl border text-sm",
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o rol…"
            className="pl-9 bg-white"
          />
        </div>
        <Button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white"
        >
          <UserPlus size={16} />
          Invitar usuario
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#f6f8fc] text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-center">Proyectos</th>
                <th className="px-4 py-3 font-semibold">Registro</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No hay usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-[#f6f8fc]/60">
                    <td className="px-4 py-3 font-medium text-[#151c27]">
                      {user.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={pending}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="h-8 rounded-lg border border-input bg-white px-2 text-xs min-w-[160px]"
                      >
                        {(["ADMIN", ...INVITABLE_ROLES] as UserRole[]).map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "border-0",
                          user.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {canAssignProjects(user.role) ? user.assignment_count : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDateShort(user.created_at.slice(0, 10))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canAssignProjects(user.role) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => openAssignModal(user)}
                          >
                            <FolderKanban size={14} className="mr-1" />
                            Asignar
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal invitar */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-[#0B3D91]">Invitar usuario</h2>
              <button type="button" onClick={() => setInviteOpen(false)} className="p-1 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Correo *</label>
                <Input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="gerente@epuxua.co"
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre completo *</label>
                <Input
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nombre Apellido"
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Rol *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-white px-2 text-sm"
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Mail size={14} className="shrink-0 mt-0.5" />
                El usuario recibirá un correo de Supabase para definir su contraseña e iniciar sesión.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending} className="bg-[#0B3D91] text-white hover:bg-[#0B3D91]/90">
                  Enviar invitación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal asignar proyectos */}
      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-[#0B3D91]">Asignar proyectos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {assignUser.full_name} · {roleLabel(assignUser.role)}
                </p>
              </div>
              <button type="button" onClick={() => setAssignUser(null)} className="p-1 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-3 border-b shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Buscar por N° contrato u objeto…"
                  className="pl-9 bg-white"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedIds.size} proyecto(s) seleccionado(s)
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {filteredCatalog.map((item) => {
                const checked = selectedIds.has(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAssignment(item.id)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      checked
                        ? "border-[#0B3D91]/40 bg-[#0B3D91]/5"
                        : "border-border hover:bg-[#f6f8fc]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        checked ? "bg-[#0B3D91] border-[#0B3D91] text-white" : "bg-white border-input"
                      )}
                    >
                      {checked && <Check size={12} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#0B3D91]">{item.id_contrato}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2">
                        {item.objeto_contrato ?? "Sin objeto registrado"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
              <Button type="button" variant="outline" onClick={() => setAssignUser(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={handleSaveAssignments}
                className="bg-[#0B3D91] text-white hover:bg-[#0B3D91]/90"
              >
                Guardar asignaciones
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
