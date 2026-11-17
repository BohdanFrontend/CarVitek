import type { ISODate } from "@/lib/dates"
import type { Formatter } from "@/lib/format"
import type { MaintenanceItem } from "./plan"

type Values = Record<string, string | number>

/** Перекладач розділу planner (з useTranslations("planner") або getTranslations("planner")). */
export type PlannerT = (
  key:
    | "due.noHistory"
    | "due.kmOverdue"
    | "due.daysOverdue"
    | "due.dueNow"
    | "due.inKm"
    | "due.inKmDays"
    | "due.inDays"
    | "due.scheduled"
    | "intervalText.both"
    | "intervalText.every"
    | "intervalText.months"
    | "or",
  values?: Values
) => string

/**
 * Скільки лишилось до роботи: «in 2 000 km (~40 days)», «in 27 000 km», «due in 20 days»,
 * «1 000 km overdue». Колір статусу — не єдиний носій інформації, тож текст є завжди.
 */
export function describeDue(
  item: MaintenanceItem,
  today: ISODate,
  t: PlannerT,
  f: Formatter,
  { withDays = false } = {}
): string {
  const { remainingKm, daysLeft, status, dueDateByTime } = item
  if (status === "no_data") return t("due.noHistory")

  if (status === "overdue") {
    if (remainingKm != null && remainingKm < 0) return t("due.kmOverdue", { km: f.km(-remainingKm) })
    // прострочено за часом: nextDate ≤ dueDateByTime < today, тож daysLeft від'ємний
    if (dueDateByTime && dueDateByTime < today && daysLeft != null && daysLeft < 0) {
      return t("due.daysOverdue", { days: f.days(-daysLeft) })
    }
    return t("due.dueNow")
  }

  if (remainingKm != null) {
    return (status === "soon" || withDays) && daysLeft != null
      ? t("due.inKmDays", { km: f.km(remainingKm), days: f.days(daysLeft) })
      : t("due.inKm", { km: f.km(remainingKm) })
  }
  return daysLeft != null ? t("due.inDays", { days: f.days(daysLeft) }) : t("due.scheduled")
}

/** «95 000 km or 10 May 2027» */
export function describeNext(item: MaintenanceItem, t: PlannerT, f: Formatter): string | null {
  const parts = [
    item.dueMileage != null ? f.km(item.dueMileage) : null,
    item.dueDateByTime ? f.date(item.dueDateByTime) : null,
  ].filter(Boolean)
  return parts.length ? parts.join(` ${t("or")} `) : null
}

/** «10 000 km / 12 months», «30 000 km», «Every 6 months» */
export function describeInterval(km: number | null, months: number | null, t: PlannerT, f: Formatter): string {
  const m = months ? t("intervalText.months", { count: months }) : null
  if (km && m) return t("intervalText.both", { km: f.km(km), months: m })
  if (km) return f.km(km)
  if (m) return t("intervalText.every", { months: m })
  return "—"
}
