import { addMonths, endOfMonth, format, startOfMonth, subMonths, subYears } from "date-fns"

import { fromISODate, type ISODate } from "@/lib/dates"
import type { MileagePoint } from "@/lib/maintenance/plan"

export type CostEntry = { date: ISODate; amount: number }
export type MonthTotal = { month: string; total: number }

/** Останні `months` календарних місяців до поточного включно: ["2026-04", …, "2026-11"]. */
export function lastMonths(today: ISODate, months = 8): string[] {
  const current = startOfMonth(fromISODate(today))
  return Array.from({ length: months }, (_, i) =>
    format(subMonths(current, months - 1 - i), "yyyy-MM")
  )
}

/** Витрати по місяцях: ТО + пальне + інші витрати. */
export function monthlyCosts(
  service: CostEntry[],
  fuel: CostEntry[],
  expenses: CostEntry[],
  today: ISODate,
  months = 8
): MonthTotal[] {
  const totals = new Map(lastMonths(today, months).map((m) => [m, 0]))
  for (const e of [...service, ...fuel, ...expenses]) {
    const month = e.date.slice(0, 7)
    if (totals.has(month) && e.date <= today) totals.set(month, totals.get(month)! + e.amount)
  }
  return [...totals].map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
}

/**
 * Пробіг по місяцях з історії пробігу: максимум у місяці мінус останній запис
 * до початку місяця (або мінімум у місяці, якщо раніших записів немає).
 */
export function monthlyDistance(
  entries: MileagePoint[],
  today: ISODate,
  months = 8
): { month: string; distance: number }[] {
  return lastMonths(today, months).map((month) => {
    const start = `${month}-01`
    const end = format(endOfMonth(fromISODate(start)), "yyyy-MM-dd")
    return { month, distance: distanceInRange(entries, start, end < today ? end : today) }
  })
}

/**
 * Пробіг за період [from, to]: максимум у періоді мінус останній запис до його початку
 * (або мінімум у періоді, якщо раніших записів немає). 0 — записів у періоді немає.
 */
export function distanceInRange(entries: MileagePoint[], from: ISODate, to: ISODate): number {
  const inRange = entries.filter((e) => e.date >= from && e.date <= to)
  if (!inRange.length) return 0
  const before = entries.filter((e) => e.date < from)
  const baseline = before.length
    ? Math.max(...before.map((e) => e.mileage))
    : Math.min(...inRange.map((e) => e.mileage))
  return Math.max(0, Math.max(...inRange.map((e) => e.mileage)) - baseline)
}

/** Вартість 1 км; null, якщо пробігу немає. */
export function costPerKm(totalCost: number, distanceKm: number): number | null {
  return distanceKm > 0 ? totalCost / distanceKm : null
}

export type Period = { kind: "month"; month: string } | { kind: "year"; year: number }
export type DateRange = { from: ISODate; to: ISODate }

/** Межі періоду і попереднього періоду: місяць "2026-11" або рік 2026. */
export function periodRange(period: Period): { current: DateRange; previous: DateRange; label: string } {
  if (period.kind === "month") {
    const start = fromISODate(`${period.month}-01`)
    const prev = subMonths(start, 1)
    return {
      current: { from: format(start, "yyyy-MM-dd"), to: format(endOfMonth(start), "yyyy-MM-dd") },
      previous: { from: format(prev, "yyyy-MM-dd"), to: format(endOfMonth(prev), "yyyy-MM-dd") },
      label: format(start, "MMMM yyyy"),
    }
  }
  const start = fromISODate(`${period.year}-01-01`)
  const prev = subYears(start, 1)
  return {
    current: { from: `${period.year}-01-01`, to: `${period.year}-12-31` },
    previous: { from: format(prev, "yyyy-MM-dd"), to: `${period.year - 1}-12-31` },
    label: String(period.year),
  }
}

/** Сусідній період для перемикачів ‹ ›. */
export function shiftPeriod(period: Period, step: 1 | -1): Period {
  if (period.kind === "year") return { kind: "year", year: period.year + step }
  return { kind: "month", month: format(addMonths(fromISODate(`${period.month}-01`), step), "yyyy-MM") }
}

export type CategorizedCost = CostEntry & { category: string }

/** Суми за категоріями в межах періоду (лише ненульові, від найбільшої). */
export function categoryTotals(entries: CategorizedCost[], { from, to }: DateRange) {
  const totals = new Map<string, number>()
  for (const e of entries) {
    if (e.date < from || e.date > to) continue
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
  }
  return [...totals]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
}

/** Сума витрат за період. */
export const sumInRange = (entries: CostEntry[], { from, to }: DateRange) =>
  Math.round(entries.filter((e) => e.date >= from && e.date <= to).reduce((s, e) => s + e.amount, 0) * 100) / 100

/** Зміна у відсотках; null, якщо попереднє значення відсутнє або нульове. */
export const percentChange = (current: number | null, previous: number | null) =>
  current == null || previous == null || previous === 0 ? null : Math.round(((current - previous) / previous) * 100)
