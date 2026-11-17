import { differenceInCalendarDays } from "date-fns"

import { fromISODate, type ISODate } from "@/lib/dates"
import type { Enums } from "@/lib/supabase/database.types"

export type DocumentType = Enums<"document_type">
export type DocumentStatus = "valid" | "expiring" | "expired" | "no_expiry"

export const DOCUMENT_TYPES = [
  "osago",
  "casco",
  "green_card",
  "tech_inspection",
  "registration",
  "warranty",
  "other",
] as const satisfies readonly DocumentType[]

/** Скільки днів до кінця дії вважаємо «скоро закінчується», якщо нагадування вимкнене. */
export const DEFAULT_REMIND_DAYS = 30

/**
 * Статус документа на дату today (Europe/Kyiv):
 * без дати — no_expiry; daysLeft < 0 — expired; daysLeft ≤ remindDays (30) — expiring; інакше — valid.
 */
export function documentStatus({
  expiryDate,
  remindDays,
  today,
}: {
  expiryDate: ISODate | null
  remindDays: number | null
  today: ISODate
}): { status: DocumentStatus; daysLeft: number | null } {
  if (!expiryDate) return { status: "no_expiry", daysLeft: null }
  const daysLeft = differenceInCalendarDays(fromISODate(expiryDate), fromISODate(today))
  if (daysLeft < 0) return { status: "expired", daysLeft }
  if (daysLeft <= (remindDays ?? DEFAULT_REMIND_DAYS)) return { status: "expiring", daysLeft }
  return { status: "valid", daysLeft }
}

const STATUS_ORDER: Record<DocumentStatus, number> = { expired: 0, expiring: 1, valid: 2, no_expiry: 3 }

/** Порядок списку: expired → expiring → valid (за датою закінчення) → no_expiry (за типом). */
export function sortDocuments<T extends { type: DocumentType; expiry_date: ISODate | null; status: DocumentStatus }>(
  docs: T[]
): T[] {
  return [...docs].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.expiry_date && b.expiry_date ? a.expiry_date.localeCompare(b.expiry_date) : 0) ||
      DOCUMENT_TYPES.indexOf(a.type) - DOCUMENT_TYPES.indexOf(b.type)
  )
}
