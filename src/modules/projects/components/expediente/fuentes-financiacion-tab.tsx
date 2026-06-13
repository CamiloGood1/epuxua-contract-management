"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  X, Plus, Pencil, Trash2, AlertTriangle, Landmark, PieChart as PieChartIcon, BarChart3,
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts"
import { formatCOP } from "@/modules/contracts/lib/status"
import {
  createFundingSource,
  updateFundingSource,
  deleteFundingSource,
} from "@/services/funding.actions"
import type { CreateFundingSourceInput } from "@/services/funding.actions"
import {
  calcFundingKPIs,
  calcParticipationPct,
  getSourcesForGroup,
  isGroupConsistent,
  hasFundingInconsistencies,
  CHART_COLORS,
  type FundingData,
  type FundingGroup,
  type FundingSource,
} from "@/types/funding"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) { return formatCOP(v) }

function KpiCard({
  label, value, sub, accent = "text-[#D9A520]", icon,
}: {
  label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#747783] leading-tight">{label}</p>
        {icon && <div className="text-[#747783]">{icon}</div>}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#747783] mt-1">{sub}</p>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface SourceModalProps {
  interadministrativoId: number
  group: FundingGroup
  groupSources: FundingSource[]
  source?: FundingSource | null
  onClose: () => void
}

function SourceModal({ interadministrativoId, group, groupSources, source, onClose }: SourceModalProps) {
  const router = useRouter()
  const [form, setForm] = useState(() =>
    source
      ? { source_name: source.source_name, source_value: String(source.source_value), observations: source.observations ?? "" }
      : { source_name: "", source_value: "", observations: "" },
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  const isEditing = !!source

  const otherSum = useMemo(
    () => groupSources.filter((s) => s.id !== source?.id).reduce((acc, s) => acc + s.source_value, 0),
    [groupSources, source],
  )

  const parsedValue = parseFloat(form.source_value.replace(/[^\d.-]/g, "")) || 0
  const previewPct = calcParticipationPct(parsedValue, group.total_value)
  const projectedTotal = otherSum + parsedValue
  const projectedDiff = projectedTotal - group.total_value
  const isOverLimit = projectedTotal - group.total_value > 0.01

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.source_name.trim()) { setError("El nombre de la fuente es obligatorio."); return }
    if (isNaN(parsedValue) || parsedValue <= 0) { setError("El valor aportado debe ser mayor a 0."); return }
    if (isOverLimit) {
      setError(`La suma de fuentes (${fmt(projectedTotal)}) supera el valor del grupo (${fmt(group.total_value)}).`)
      return
    }

    const input: CreateFundingSourceInput = {
      interadministrativo_id: interadministrativoId,
      funding_group_id: group.id,
      source_name: form.source_name.trim(),
      source_value: parsedValue,
      observations: form.observations.trim() || null,
    }

    start(async () => {
      const res = isEditing
        ? await updateFundingSource(source!.id, interadministrativoId, input)
        : await createFundingSource(input)
      if (res.error) { setError(res.error); return }
      onClose()
      router.refresh()
    })
  }

  const inputCls = "w-full h-10 rounded-lg border border-[#EAEAEA] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#747783] mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <div>
            <h2 className="text-base font-bold text-[#002869]">
              {isEditing ? "Editar Fuente de Financiación" : "Agregar Fuente de Financiación"}
            </h2>
            <p className="text-xs text-[#747783] mt-0.5">{group.group_name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f3ff]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Nombre Fuente <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.source_name}
              onChange={(e) => setForm((p) => ({ ...p, source_name: e.target.value }))}
              className={inputCls}
              placeholder="Ej. ENEL, Alcaldía Municipal"
            />
          </div>

          <div>
            <label className={labelCls}>Valor Aportado (COP) <span className="text-red-500">*</span></label>
            <input
              type="text"
              inputMode="numeric"
              value={form.source_value}
              onChange={(e) => setForm((p) => ({ ...p, source_value: e.target.value }))}
              className={inputCls}
              placeholder="0"
            />
            <p className="text-[10px] text-[#747783] mt-1">
              Disponible en grupo: {fmt(Math.max(0, group.total_value - otherSum))}
            </p>
          </div>

          <div className="bg-[#f0f3ff] rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#434652]">Participación calculada</span>
            <span className="text-sm font-bold text-[#0B3D91] tabular-nums">{previewPct.toFixed(2)}%</span>
          </div>

          {isOverLimit && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                Excede el valor del grupo en {fmt(Math.abs(projectedDiff))}. Corrija el valor antes de guardar.
              </p>
            </div>
          )}

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
              className={inputCls + " h-20 py-2 resize-none"}
              placeholder="Opcional"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-[#EAEAEA] rounded-lg text-sm font-semibold text-[#434652] hover:bg-[#f9f9ff]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || isOverLimit}
              className="flex-1 h-10 bg-[#0B3D91] text-white rounded-lg text-sm font-semibold hover:bg-[#002869] disabled:opacity-50"
            >
              {isPending ? "Guardando…" : isEditing ? "Actualizar" : "Agregar Fuente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Sección por grupo ─────────────────────────────────────────────────────────

function GroupSection({
  group,
  sources,
  interadministrativoId,
  canEdit,
  canDelete,
}: {
  group: FundingGroup
  sources: FundingSource[]
  interadministrativoId: number
  canEdit: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const [modal, setModal] = useState<{ mode: "create" | "edit"; source?: FundingSource } | null>(null)
  const [isPending, start] = useTransition()

  const groupSources = getSourcesForGroup(sources, group.id)
  const { consistent, totalAportado, diferencia } = isGroupConsistent(group, sources)

  const chartData = groupSources.map((s, i) => ({
    name: s.source_name,
    value: s.source_value,
    pct: s.participation_percentage,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  function handleDelete(source: FundingSource) {
    if (!confirm(`¿Eliminar la fuente "${source.source_name}"?`)) return
    start(async () => {
      const res = await deleteFundingSource(source.id, interadministrativoId)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="px-5 py-4 border-b border-[#EAEAEA] bg-[#f9f9ff] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#002869]">{group.group_name}</h3>
          <p className="text-xs text-[#747783] mt-0.5">
            Valor del grupo: <strong className="text-[#D9A520]">{fmt(group.total_value)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!consistent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle size={11} />
              Diferencia: {fmt(Math.abs(diferencia))}
            </span>
          )}
          {consistent && groupSources.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Cuadrado
            </span>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => setModal({ mode: "create" })}
              className="flex items-center gap-1.5 h-9 px-3 bg-[#0B3D91] text-white rounded-lg text-xs font-semibold hover:bg-[#002869]"
            >
              <Plus size={13} />
              Agregar Fuente de Financiación
            </button>
          )}
        </div>
      </div>

      {groupSources.length === 0 ? (
        <div className="p-8 text-center">
          <Landmark size={28} className="mx-auto text-[#747783] mb-2 opacity-50" />
          <p className="text-sm font-semibold text-[#434652]">Sin fuentes registradas</p>
          <p className="text-xs text-[#747783] mt-1">Agregue las fuentes que componen este grupo financiero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[#EAEAEA]">
                <tr>
                  {["Fuente", "Valor Aportado", "Participación", "Observaciones", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {groupSources.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f9f9ff]">
                    <td className="px-5 py-3 text-sm font-semibold text-[#151c27]">{s.source_name}</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#D9A520] tabular-nums">{fmt(s.source_value)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden max-w-[80px]">
                          <div
                            className="h-full bg-[#0B3D91] rounded-full"
                            style={{ width: `${Math.min(s.participation_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#0B3D91] tabular-nums">{s.participation_percentage.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#747783] max-w-[160px] truncate">{s.observations ?? "—"}</td>
                    <td className="px-5 py-3">
                      {canEdit && (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => setModal({ mode: "edit", source: s })}
                            className="p-1.5 rounded-lg hover:bg-[#f0f3ff] text-[#747783] hover:text-[#0B3D91]"
                          >
                            <Pencil size={13} />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(s)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#747783] hover:text-red-600"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[#EAEAEA] bg-[#f9f9ff]">
                <tr>
                  <td className="px-5 py-3 text-xs font-bold uppercase text-[#747783]">Total Aportado</td>
                  <td className={`px-5 py-3 text-sm font-bold tabular-nums ${consistent ? "text-emerald-600" : "text-amber-600"}`}>
                    {fmt(totalAportado)}
                  </td>
                  <td colSpan={3} className="px-5 py-3 text-xs text-[#747783]">
                    {consistent
                      ? "La suma coincide con el valor del grupo."
                      : `Faltan ${diferencia > 0 ? "— excede en" : ""} ${fmt(Math.abs(diferencia))} para cuadrar.`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {chartData.length > 0 && (
            <div className="p-4 border-l border-[#EAEAEA] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#747783] mt-1">Composición</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <SourceModal
          interadministrativoId={interadministrativoId}
          group={group}
          groupSources={groupSources}
          source={modal.source}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  interadministrativoId: number
  funding: FundingData
  canEdit: boolean
  canDelete: boolean
}

export function FuentesFinanciacionTab({ interadministrativoId, funding, canEdit, canDelete }: Props) {
  const kpis = useMemo(() => calcFundingKPIs(funding), [funding])
  const hasInconsistencies = useMemo(() => hasFundingInconsistencies(funding), [funding])

  const originalGroup = funding.groups.find((g) => g.group_type === "ORIGINAL")
  const adicionGroups = funding.groups.filter((g) => g.group_type === "ADICION")

  const consolidatedChart = funding.consolidated.map((c, i) => ({
    name: c.source_name,
    value: c.total_aportado,
    pct: c.participacion_consolidada_pct,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const adicionBarData = adicionGroups.map((g) => {
    const groupSources = getSourcesForGroup(funding.sources, g.id)
    const total = groupSources.reduce((acc, s) => acc + s.source_value, 0)
    return { name: g.group_name.replace("Adición No. ", "Ad. "), valor: total, meta: g.total_value }
  })

  return (
    <div className="space-y-6">

      {!canEdit && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0f3ff] border border-[#0B3D91]/20 rounded-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span className="text-xs font-semibold text-[#0B3D91]">Solo lectura — su rol no tiene permisos de edición en esta sección</span>
        </div>
      )}

      {hasInconsistencies && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Inconsistencias detectadas</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Uno o más grupos tienen fuentes cuya suma no coincide con el valor del grupo. Revise cada sección marcada.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Fuentes" value={String(kpis.totalFuentes)} sub={`${kpis.fuentesDistintas} entidades distintas`} icon={<Landmark size={16} />} />
        <KpiCard label="Valor Financiado" value={kpis.valorFinanciadoTotal > 0 ? fmt(kpis.valorFinanciadoTotal) : "—"} accent="text-[#0B3D91]" />
        <KpiCard
          label="Principal Financiador"
          value={kpis.principalFinanciador ?? "—"}
          sub={kpis.principalFinanciador ? `${kpis.participacionPrincipal.toFixed(1)}% · ${fmt(kpis.valorPrincipal)}` : undefined}
          accent="text-emerald-600"
        />
        <KpiCard label="Grupos Financieros" value={String(kpis.totalGrupos)} sub={`Original + ${adicionGroups.length} adición${adicionGroups.length !== 1 ? "es" : ""}`} />
      </div>

      {/* Bolsa Original */}
      {originalGroup && (
        <div>
          <h3 className="text-[13px] font-bold text-[#002869] uppercase tracking-wider mb-3">Nivel 1 — Bolsa Original</h3>
          <GroupSection
            group={originalGroup}
            sources={funding.sources}
            interadministrativoId={interadministrativoId}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      {/* Adiciones */}
      {adicionGroups.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-[#002869] uppercase tracking-wider mb-3">Nivel 2 — Adiciones</h3>
          <div className="space-y-4">
            {adicionGroups.map((g) => (
              <GroupSection
                key={g.id}
                group={g}
                sources={funding.sources}
                interadministrativoId={interadministrativoId}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resumen Consolidado */}
      {funding.consolidated.length > 0 && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4 border-b border-[#EAEAEA] flex items-center gap-2">
            <PieChartIcon size={16} className="text-[#0B3D91]" />
            <h3 className="text-sm font-bold text-[#002869]">Resumen Consolidado — Vista Ejecutiva</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#EAEAEA]">
                  <tr>
                    {["Fuente", "Total Aportado", "Participación Consolidada"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#747783]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {funding.consolidated.map((c, i) => (
                    <tr key={c.source_name} className="hover:bg-[#f9f9ff]">
                      <td className="px-5 py-3 text-sm font-semibold text-[#151c27]">
                        <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {c.source_name}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-[#D9A520] tabular-nums">{fmt(c.total_aportado)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-[#EAEAEA] overflow-hidden max-w-[120px]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${c.participacion_consolidada_pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#434652] tabular-nums">{c.participacion_consolidada_pct.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#EAEAEA] bg-[#f9f9ff]">
                  <tr>
                    <td className="px-5 py-3 text-xs font-bold uppercase text-[#747783]">Total</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#0B3D91] tabular-nums">{fmt(kpis.valorFinanciadoTotal)}</td>
                    <td className="px-5 py-3 text-xs font-bold text-[#747783]">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-5 border-l border-[#EAEAEA]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={consolidatedChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                    {consolidatedChart.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico distribución por adición */}
      {adicionBarData.length > 0 && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[#0B3D91]" />
            <h3 className="text-sm font-bold text-[#002869]">Distribución Financiera por Adición</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={adicionBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="valor" name="Aportado" fill="#0B3D91" radius={[4, 4, 0, 0]} />
              <Bar dataKey="meta" name="Valor Adición" fill="#D9A520" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
