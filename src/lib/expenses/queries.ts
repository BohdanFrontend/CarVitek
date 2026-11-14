import { format } from "date-fns"

import { getMileageEntries } from "@/lib/dashboard/get-dashboard-data"
import { fromISODate } from "@/lib/dates"
import {
  categoryTotals,
  costPerKm,
  distanceInRange,
  monthlyCosts,
  monthlyDistance,
  percentChange,
  periodRange,
  sumInRange,
  type CategorizedCost,
  type Period,
} from "@/lib/stats/costs"
import type { ExpenseCategory } from "@/lib/stats/categories"
import { createClient } from "@/lib/supabase/server"

/** Усі витрати авто однією вибіркою: ТО, пальне й інші — з категоріями. */
async function loadCosts(carId: string): Promise<CategorizedCost[]> {
  const supabase = await createClient()
  const [service, fuel, expenses] = await Promise.all([
    supabase.from("service_records").select("performed_at, total_cost").eq("car_id", carId),
    supabase.from("fuel_records").select("filled_at, total_cost").eq("car_id", carId),
    supabase.from("expenses").select("spent_at, amount, category").eq("car_id", carId),
  ])
  for (const r of [service, fuel, expenses]) {
    if (r.error) throw new Error(`Failed to load expenses: ${r.error.message}`)
  }
  return [
    ...(service.data ?? []).map((s) => ({ date: s.performed_at, amount: Number(s.total_cost ?? 0), category: "maintenance" })),
    ...(fuel.data ?? []).map((f) => ({ date: f.filled_at, amount: Number(f.total_cost ?? 0), category: "fuel" })),
    ...(expenses.data ?? []).map((e) => ({ date: e.spent_at, amount: Number(e.amount), category: e.category })),
  ]
}

/**
 * Огляд витрат за місяць або рік: розподіл за категоріями, вартість 1 км
 * (зі зміною до попереднього періоду і трендом за 8 місяців) і витрати по місяцях року.
 */
export async function getExpenseOverview(carId: string, period: Period, today: string) {
  const [costs, mileage] = await Promise.all([loadCosts(carId), getMileageEntries(carId)])
  const { current, previous, label } = periodRange(period)

  const total = sumInRange(costs, current)
  const perKm = costPerKm(total, distanceInRange(mileage, current.from, current.to))
  const prevPerKm = costPerKm(sumInRange(costs, previous), distanceInRange(mileage, previous.from, previous.to))

  // Тренд вартості 1 км: 8 місяців, що закінчуються кінцем вибраного періоду (не пізніше сьогодні)
  const trendEnd = current.to < today ? current.to : today
  const trendCosts = monthlyCosts(costs, [], [], trendEnd)
  const trendDistance = monthlyDistance(mileage, trendEnd)
  const costPerKmTrend = trendCosts.map((m, i) => ({
    month: m.month,
    value: costPerKm(m.total, trendDistance[i].distance),
  }))

  // Витрати по місяцях року (рік вибраного періоду)
  const year = period.kind === "year" ? period.year : Number(period.month.slice(0, 4))
  const byMonth = monthlyCosts(costs, [], [], `${year}-12-31`, 12).map((m) => ({
    month: m.month,
    label: format(fromISODate(`${m.month}-01`), "MMM"),
    total: m.total,
  }))

  return {
    label,
    year,
    total,
    categories: categoryTotals(costs, current),
    costPerKm: perKm,
    costPerKmChange: percentChange(perKm, prevPerKm),
    previousLabel: periodRange(period.kind === "month" ? { kind: "month", month: previous.from.slice(0, 7) } : { kind: "year", year: year - 1 }).label,
    costPerKmTrend,
    byMonth,
  }
}

export type ExpenseRow = {
  id: string
  spent_at: string
  category: ExpenseCategory
  amount: number
  mileage: number | null
  comment: string | null
}

/** Записи «інших витрат» (новіші зверху) з пагінацією. */
export async function listExpenses(carId: string, limit: number) {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from("expenses")
    .select("id, spent_at, category, amount, mileage, comment", { count: "exact" })
    .eq("car_id", carId)
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1)
  if (error) throw new Error(`Failed to load expenses: ${error.message}`)
  const rows: ExpenseRow[] = data.map((e) => ({ ...e, amount: Number(e.amount) }))
  return { rows, total: count ?? rows.length, hasMore: (count ?? 0) > rows.length }
}
