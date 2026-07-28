// CLIENT-SAFE — definiciones de campos para la pantalla de revisión (sin secretos de servidor).
import type { DocumentAnalyzerSchema } from "../types"

export const ADICION_ANALYZER_SCHEMA: DocumentAnalyzerSchema = {
  displayName: "Adición Contractual",
  fields: [
    { key: "fecha_adicion",          label: "Fecha de la Adición",  type: "date",       icon: "📅" },
    { key: "valor_total",            label: "Valor Total",           type: "currency",   icon: "💰" },
    { key: "valor_bienes_servicios", label: "Bolsa de Inversión",    type: "currency",   icon: "🏗" },
    { key: "valor_cuota_gerencia",   label: "Cuota de Gerencia",     type: "currency",   icon: "🏢" },
    { key: "numero_rp",              label: "Número RP",             type: "identifier", icon: "📄" },
    { key: "motivo",                 label: "Motivo de la Adición",  type: "text",       icon: "📝" },
  ],
}
