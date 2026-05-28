import {
  AlertTriangle,
  Clock,
  CalendarX2,
  TrendingDown,
  ShieldAlert,
  Hourglass,
  CalendarClock,
  Info,
  CheckCircle2,
  Pause,
  CalendarDays,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Contract } from "@/types/contract"

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertSeverity = "critica" | "alta" | "media" | "baja" | "info"

export interface ContractAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  icon: LucideIcon
  date?: string | null
}

export const SEVERITY_CONFIG: Record<AlertSeverity, {
  label: string
  color: string
  bg: string
  text: string
  border: string
  dot: string
  barColor: string
}> = {
  critica: {
    label: "Crítica",
    color: "#EF4444",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    barColor: "bg-red-500",
  },
  alta: {
    label: "Alta",
    color: "#F97316",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    barColor: "bg-orange-500",
  },
  media: {
    label: "Media",
    color: "#F59E0B",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    barColor: "bg-amber-400",
  },
  baja: {
    label: "Baja",
    color: "#3B82F6",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
    barColor: "bg-blue-400",
  },
  info: {
    label: "Info",
    color: "#6366F1",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-400",
    barColor: "bg-indigo-400",
  },
}

const SEVERITY_ORDER: AlertSeverity[] = ["critica", "alta", "media", "baja", "info"]

function daysDiff(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.floor((target.getTime() - now.getTime()) / 86_400_000)
}

function fmt(dateStr?: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ── Core computation ──────────────────────────────────────────────────────────

export function computeAlerts(contract: Contract): ContractAlert[] {
  const alerts: ContractAlert[] = []
  const status = contract.status
  const isActive = status === "in_progress"
  const phys = Number(contract.physical_progress ?? 0)
  const fin = Number(contract.financial_progress ?? 0)

  // ── Vencimiento ───────────────────────────────────────────────────────────

  if (contract.end_date) {
    const days = daysDiff(contract.end_date)

    if (days < 0 && status !== "liquidated") {
      alerts.push({
        id: "expired",
        severity: "critica",
        title: "Contrato vencido",
        description: `El contrato venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""} (${fmt(contract.end_date)}). Se requiere acción inmediata.`,
        icon: CalendarX2,
        date: contract.end_date,
      })
    } else if (days >= 0 && days <= 15 && status !== "liquidated") {
      alerts.push({
        id: "expiring-critical",
        severity: "critica",
        title: "Vencimiento inminente",
        description: `El contrato vence en ${days} día${days !== 1 ? "s" : ""} (${fmt(contract.end_date)}). Se requiere acción urgente.`,
        icon: AlertTriangle,
        date: contract.end_date,
      })
    } else if (days > 15 && days <= 30 && status !== "liquidated") {
      alerts.push({
        id: "expiring-alta",
        severity: "alta",
        title: "Próximo a vencer",
        description: `El contrato vence en ${days} días (${fmt(contract.end_date)}). Verificar estado de ejecución.`,
        icon: Clock,
        date: contract.end_date,
      })
    } else if (days > 30 && days <= 60 && status !== "liquidated") {
      alerts.push({
        id: "expiring-media",
        severity: "media",
        title: "Vencimiento en menos de 60 días",
        description: `El contrato vence el ${fmt(contract.end_date)} (${days} días restantes).`,
        icon: CalendarClock,
        date: contract.end_date,
      })
    }
  } else if (status !== "liquidated" && status !== "liquidation") {
    alerts.push({
      id: "no-end-date",
      severity: "baja",
      title: "Sin fecha de vencimiento",
      description: "El contrato no tiene fecha de vencimiento registrada. Actualiza esta información.",
      icon: CalendarDays,
    })
  }

  // ── Estado del contrato ───────────────────────────────────────────────────

  if (status === "suspended") {
    alerts.push({
      id: "suspended",
      severity: "alta",
      title: "Contrato suspendido",
      description: "El contrato está en estado de suspensión. Revisar las causales y plazos de reinicio.",
      icon: Pause,
    })
  }

  if (status === "liquidation") {
    alerts.push({
      id: "in-liquidation",
      severity: "media",
      title: "En proceso de liquidación",
      description: "El contrato está en proceso de liquidación. Verificar que todos los documentos estén en orden.",
      icon: Hourglass,
    })
  }

  // ── Ejecución ─────────────────────────────────────────────────────────────

  if (isActive && phys < 20) {
    alerts.push({
      id: "very-low-physical",
      severity: "alta",
      title: "Ejecución física muy baja",
      description: `El avance físico es de solo el ${phys}%. Se requiere seguimiento inmediato.`,
      icon: TrendingDown,
    })
  } else if (isActive && phys < 40) {
    alerts.push({
      id: "low-physical",
      severity: "media",
      title: "Baja ejecución física",
      description: `El avance físico es del ${phys}%. Verificar el cronograma de actividades.`,
      icon: TrendingDown,
    })
  }

  if (isActive && fin < 20) {
    alerts.push({
      id: "very-low-financial",
      severity: "alta",
      title: "Ejecución financiera muy baja",
      description: `El avance financiero es de solo el ${fin}%. Revisar el plan de pagos.`,
      icon: TrendingDown,
    })
  } else if (isActive && fin < 40) {
    alerts.push({
      id: "low-financial",
      severity: "media",
      title: "Baja ejecución financiera",
      description: `El avance financiero es del ${fin}%. Verificar el flujo de pagos.`,
      icon: TrendingDown,
    })
  }

  // Discrepancia física vs financiera > 20 puntos
  if (isActive && Math.abs(phys - fin) > 20) {
    const leader = phys > fin ? "física" : "financiera"
    alerts.push({
      id: "execution-gap",
      severity: "media",
      title: "Brecha entre ejecución física y financiera",
      description: `Hay una diferencia de ${Math.abs(phys - fin)} puntos porcentuales entre el avance físico (${phys}%) y financiero (${fin}%). La ejecución ${leader} va más adelantada.`,
      icon: TrendingDown,
    })
  }

  // Casi completo → preparar liquidación
  if (isActive && phys >= 90) {
    alerts.push({
      id: "near-complete",
      severity: "info",
      title: "Contrato próximo a completarse",
      description: `El avance físico es del ${phys}%. Preparar la documentación para el proceso de liquidación.`,
      icon: CheckCircle2,
    })
  }

  // ── Riesgo ────────────────────────────────────────────────────────────────

  if (contract.risk_level === "critical") {
    alerts.push({
      id: "risk-critical",
      severity: "critica",
      title: "Nivel de riesgo crítico",
      description: "El contrato tiene un nivel de riesgo crítico. Se requieren medidas inmediatas de mitigación.",
      icon: ShieldAlert,
    })
  } else if (contract.risk_level === "high") {
    alerts.push({
      id: "risk-high",
      severity: "alta",
      title: "Nivel de riesgo alto",
      description: "El contrato presenta un nivel de riesgo alto. Revisar el plan de gestión de riesgos.",
      icon: ShieldAlert,
    })
  }

  // ── Información faltante ──────────────────────────────────────────────────

  if (!contract.start_date && isActive) {
    alerts.push({
      id: "no-start-date",
      severity: "baja",
      title: "Sin fecha de inicio registrada",
      description: "El contrato en ejecución no tiene fecha de inicio registrada.",
      icon: Info,
    })
  }

  if (!contract.manager_name) {
    alerts.push({
      id: "no-manager",
      severity: "baja",
      title: "Sin gerente asignado",
      description: "El contrato no tiene un gerente responsable asignado.",
      icon: Info,
    })
  }

  // ── Ordenar por prioridad ─────────────────────────────────────────────────

  return alerts.sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  )
}
