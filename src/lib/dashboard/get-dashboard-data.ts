import { format, startOfMonth, subMonths } from "date-fns"
import { cache } from "react"

import { getUserCars, type Car } from "@/lib/cars/active-car"
import { fromISODate, todayInKyiv } from "@/lib/dates"
import { averageConsumption, fuelSegments } from "@/lib/fuel/consumption"
import { maintenanceName } from "@/lib/maintenance/names"
import {
  averageKmPerDay,
  buildMaintenancePlan,
  type LastService,
  type MaintenanceItem,
  type MileagePoint,
} from "@/lib/maintenance/plan"
import { costPerKm, monthlyCosts, monthlyDistance } from "@/lib/stats/costs"
import { createClient } from "@/lib/supabase/server"

const MONTHS = 8

/** Історія пробігу авто (кешується в межах запиту: потрібна і плану, і статистиці). */
const getMileageEntries = cache(async (carId: string): Promise<MileagePoint[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mileage_entries")
    .select("recorded_at, mileage")
    .eq("car_id", carId)
    .order("recorded_at")
  if (error) throw new Error(`Failed to load mileage: ${error.message}`)
  return data.map((e) => ({ date: e.recorded_at, mileage: e.mileage }))
})

/**
 * План ТО для авто. cache() — щоб layout (бейдж на дзвіночку) і сторінка
 * дашборду в межах одного запиту рахували його один раз.
 */
export const getMaintenancePlan = cache(async (carId: string): Promise<MaintenanceItem[]> => {
  const car = (await getUserCars()).find((c) => c.id === carId)
  if (!car) return []
  const supabase = await createClient()

  const [types, rules, items, mileageEntries] = await Promise.all([
    supabase
      .from("maintenance_types")
      .select("id, code, name, interval_km, interval_months, engine_types, sort_order"),
    supabase
      .from("car_maintenance_rules")
      .select("maintenance_type_id, interval_km, interval_months, is_enabled")
      .eq("car_id", carId),
    // Усі виконані роботи цього авто з датою й пробігом візиту
    supabase
      .from("service_record_items")
      .select("maintenance_type_id, service_records!inner(performed_at, mileage, car_id)")
      .eq("service_records.car_id", carId),
    getMileageEntries(carId),
  ])
  for (const r of [types, rules, items]) {
    if (r.error) throw new Error(`Failed to load maintenance data: ${r.error.message}`)
  }

  // Останнє виконання кожного типу: найновіше за датою, при рівності — за пробігом
  const lastByType = new Map<string, LastService>()
  for (const item of items.data ?? []) {
    const rec = item.service_records
    const prev = lastByType.get(item.maintenance_type_id)
    if (
      !prev ||
      rec.performed_at > prev.date ||
      (rec.performed_at === prev.date && rec.mileage > prev.mileage)
    ) {
      lastByType.set(item.maintenance_type_id, { date: rec.performed_at, mileage: rec.mileage })
    }
  }

  return buildMaintenancePlan({
    car,
    types: (types.data ?? []).map((t) => ({ ...t, name: maintenanceName(t.code, t.name) })),
    rules: rules.data ?? [],
    lastByType,
    mileageEntries,
    today: todayInKyiv(),
  })
})

/** Кількість робіт, що потребують уваги (бейдж на дзвіночку). */
export async function getAttentionCount(carId: string) {
  const plan = await getMaintenancePlan(carId)
  return plan.filter((i) => i.status === "overdue" || i.status === "soon").length
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

/** Усе для дашборду активного авто: план ТО, витрата пального, витрати й вартість 1 км. */
export async function getDashboardData(car: Car) {
  const today = todayInKyiv()
  const since = format(startOfMonth(subMonths(fromISODate(today), MONTHS - 1)), "yyyy-MM-dd")
  const supabase = await createClient()

  const [plan, mileageEntries, fuel, service, expenses] = await Promise.all([
    getMaintenancePlan(car.id),
    getMileageEntries(car.id),
    supabase
      .from("fuel_records")
      .select("filled_at, mileage, liters, total_cost, is_full_tank")
      .eq("car_id", car.id)
      .order("mileage"),
    supabase
      .from("service_records")
      .select("performed_at, total_cost")
      .eq("car_id", car.id)
      .gte("performed_at", since),
    supabase
      .from("expenses")
      .select("spent_at, amount")
      .eq("car_id", car.id)
      .gte("spent_at", since),
  ])
  for (const r of [fuel, service, expenses]) {
    if (r.error) throw new Error(`Failed to load dashboard data: ${r.error.message}`)
  }
  const fuelRows = fuel.data ?? []

  // Пальне
  const segments = fuelSegments(
    fuelRows.map((f) => ({ mileage: f.mileage, liters: Number(f.liters), isFullTank: f.is_full_tank }))
  )
  const avgConsumption = averageConsumption(segments)
  const consumptionSeries = segments.slice(-MONTHS).map((s) => Math.round(s.lPer100km * 100) / 100)

  // Витрати по місяцях
  const monthlySeries = monthlyCosts(
    (service.data ?? []).map((s) => ({ date: s.performed_at, amount: Number(s.total_cost ?? 0) })),
    fuelRows.map((f) => ({ date: f.filled_at, amount: Number(f.total_cost ?? 0) })),
    (expenses.data ?? []).map((e) => ({ date: e.spent_at, amount: Number(e.amount) })),
    today,
    MONTHS
  )
  const spentThisMonth = monthlySeries.at(-1)?.total ?? 0
  const spentPrevMonth = monthlySeries.at(-2)?.total ?? 0

  // Вартість 1 км: за весь період і по місяцях
  const distance = monthlyDistance(mileageEntries, today, MONTHS)
  const totalCost = monthlySeries.reduce((s, m) => s + m.total, 0)
  const totalDistance = distance.reduce((s, m) => s + m.distance, 0)
  const costPerKmSeries = monthlySeries.map((m, i) => costPerKm(m.total, distance[i].distance) ?? 0)

  return {
    plan,
    avgKmPerDay: averageKmPerDay(mileageEntries, today),
    avgConsumption,
    consumptionSeries,
    spentThisMonth,
    spentPrevMonth,
    monthlySeries,
    costPerKm: costPerKm(totalCost, totalDistance),
    costPerKmSeries,
  }
}
