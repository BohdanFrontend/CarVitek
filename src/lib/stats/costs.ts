import { format, startOfMonth, subMonths } from "date-fns"

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
    const inMonth = entries.filter((e) => e.date.slice(0, 7) === month && e.date <= today)
    if (!inMonth.length) return { month, distance: 0 }
    const before = entries.filter((e) => e.date < start)
    const baseline = before.length
      ? Math.max(...before.map((e) => e.mileage))
      : Math.min(...inMonth.map((e) => e.mileage))
    return { month, distance: Math.max(0, Math.max(...inMonth.map((e) => e.mileage)) - baseline) }
  })
}

/** Вартість 1 км; null, якщо пробігу немає. */
export function costPerKm(totalCost: number, distanceKm: number): number | null {
  return distanceKm > 0 ? totalCost / distanceKm : null
}
