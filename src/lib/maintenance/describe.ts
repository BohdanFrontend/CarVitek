import { formatDate, type ISODate } from "@/lib/dates"
import { formatDays, formatKm } from "@/lib/format"
import type { MaintenanceItem, MaintenanceStatus } from "./plan"

export const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  soon: "Due soon",
  ok: "On track",
  no_data: "No data",
}

/**
 * Скільки лишилось до роботи: «in 2 000 km (~40 days)», «in 27 000 km», «due in 20 days»,
 * «1 000 km overdue». Колір статусу — не єдиний носій інформації, тож текст є завжди.
 */
export function describeDue(item: MaintenanceItem, today: ISODate, { withDays = false } = {}): string {
  const { remainingKm, daysLeft, status, dueDateByTime } = item
  if (status === "no_data") return "No service history"

  if (status === "overdue") {
    if (remainingKm != null && remainingKm < 0) return `${formatKm(-remainingKm)} overdue`
    // прострочено за часом: nextDate ≤ dueDateByTime < today, тож daysLeft від'ємний
    if (dueDateByTime && dueDateByTime < today && daysLeft != null && daysLeft < 0) {
      return `${formatDays(-daysLeft)} overdue`
    }
    return "Due now"
  }

  if (remainingKm != null) {
    const km = `in ${formatKm(remainingKm)}`
    return (status === "soon" || withDays) && daysLeft != null ? `${km} (~${formatDays(daysLeft)})` : km
  }
  return daysLeft != null ? `due in ${formatDays(daysLeft)}` : "Scheduled"
}

/** «Next: 95 000 km or 10 May 2027» */
export function describeNext(item: MaintenanceItem): string | null {
  const parts = [
    item.dueMileage != null ? formatKm(item.dueMileage) : null,
    item.dueDateByTime ? formatDate(item.dueDateByTime) : null,
  ].filter(Boolean)
  return parts.length ? parts.join(" or ") : null
}

/** «10 000 km / 12 months», «30 000 km», «Every 6 months» */
export function describeInterval(km: number | null, months: number | null): string {
  const m = months ? `${months} ${months === 1 ? "month" : "months"}` : null
  if (km && m) return `${formatKm(km)} / ${m}`
  if (km) return formatKm(km)
  if (m) return `Every ${m}`
  return "—"
}
