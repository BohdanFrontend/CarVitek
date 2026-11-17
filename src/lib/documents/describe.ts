import type { DocumentStatus, DocumentType } from "./status"

type Values = Record<string, string | number>

/** Перекладач розділу documents (useTranslations / getTranslations / createTranslator). */
export type DocumentsT = (
  key:
    | "badge.noExpiry"
    | "badge.expired"
    | "badge.today"
    | "badge.days"
    | `types.${DocumentType}`
    | "expiresToday"
    | "expiredAgo"
    | "expiresIn",
  values?: Values
) => string
type AnyT = DocumentsT

/** Текст бейджа: «207 days», «Expires today», «Expired 5 days ago», «No expiry». */
export function daysBadge({ status, daysLeft }: { status: DocumentStatus; daysLeft: number | null }, t: DocumentsT): string {
  const tt: AnyT = t
  if (status === "no_expiry" || daysLeft == null) return tt("badge.noExpiry")
  if (daysLeft < 0) return tt("badge.expired", { count: -daysLeft })
  if (daysLeft === 0) return tt("badge.today")
  return tt("badge.days", { count: daysLeft })
}

/** Назва документа: для «Other» — власна назва, інакше перекладений тип. */
export function documentTitle(doc: { type: DocumentType; title: string | null }, t: DocumentsT): string {
  const tt: AnyT = t
  return doc.type === "other" && doc.title?.trim() ? doc.title.trim() : tt(`types.${doc.type}`)
}

/** «Technical inspection expires in 16 days» / «… expires today» / «… expired 5 days ago». */
export function expiryNotice(
  doc: { type: DocumentType; title: string | null; daysLeft: number | null },
  t: DocumentsT
): string {
  const tt: AnyT = t
  const title = documentTitle(doc, t)
  const d = doc.daysLeft ?? 0
  if (d === 0) return tt("expiresToday", { title })
  return d < 0
    ? tt("expiredAgo", { title, days: tt("badge.days", { count: -d }) })
    : tt("expiresIn", { title, days: tt("badge.days", { count: d }) })
}
