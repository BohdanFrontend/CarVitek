import { getTranslations } from "next-intl/server"
import { cache } from "react"

import { getFormat } from "@/i18n/format-server"
import { getMaintenancePlan } from "@/lib/dashboard/get-dashboard-data"
import { todayInKyiv } from "@/lib/dates"
import { daysBadge, documentTitle } from "@/lib/documents/describe"
import { getDocumentAlerts } from "@/lib/documents/queries"
import type { DocumentType } from "@/lib/documents/status"
import { describeDue } from "@/lib/maintenance/describe"

/** Пункт дзвіночка: робота ТО (overdue/soon) або документ (expired/expiring). */
export type BellItem = {
  id: string
  kind: "maintenance" | "document"
  /** Код типу роботи (для іконки) або тип документа */
  code: string | null
  title: string
  detail: string
  /** червоний — прострочено, бурштиновий — скоро */
  urgent: boolean
  href: "/planner" | "/documents"
}

/** Що потребує уваги для авто: спершу прострочене, потім «скоро». Перекладено мовою інтерфейсу. */
export const getBellItems = cache(async (carId: string): Promise<BellItem[]> => {
  const [plan, docs, tp, td, f] = await Promise.all([
    getMaintenancePlan(carId),
    getDocumentAlerts(carId),
    getTranslations("planner"),
    getTranslations("documents"),
    getFormat(),
  ])
  const today = todayInKyiv()

  const items: BellItem[] = [
    ...plan
      .filter((i) => i.status === "overdue" || i.status === "soon")
      .map((i) => ({
        id: `m-${i.typeId}`,
        kind: "maintenance" as const,
        code: i.code,
        title: i.name,
        detail: describeDue(i, today, tp, f),
        urgent: i.status === "overdue",
        href: "/planner" as const,
      })),
    ...docs.map((d) => ({
      id: `d-${d.id}`,
      kind: "document" as const,
      code: d.type as DocumentType,
      title: documentTitle(d, td),
      detail: daysBadge(d, td),
      urgent: d.status === "expired",
      href: "/documents" as const,
    })),
  ]
  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent))
})
