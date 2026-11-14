import { addDays, addMonths, differenceInCalendarDays, subDays } from "date-fns"

import { fromISODate, toISODate, type ISODate } from "@/lib/dates"
import type { Enums } from "@/lib/supabase/database.types"

export type MaintenanceStatus = "overdue" | "soon" | "ok" | "no_data"

/** Останнє виконання роботи: дата і пробіг. */
export type LastService = { date: ISODate; mileage: number }

export type MileagePoint = { date: ISODate; mileage: number }

export type MaintenanceItem = {
  typeId: string
  code: string | null
  name: string
  intervalKm: number | null
  intervalMonths: number | null
  last: LastService | null
  /** M_due = m0 + I_km */
  dueMileage: number | null
  /** ΔM = M_due − M (від'ємне — перепробіг) */
  remainingKm: number | null
  /** t_time = d0 + I_months */
  dueDateByTime: ISODate | null
  /** t_km — прогноз дати за середнім пробігом */
  forecastDateByKm: ISODate | null
  /** t_next = min(t_km, t_time) */
  nextDate: ISODate | null
  daysLeft: number | null
  status: MaintenanceStatus
}

export type NextDueInput = {
  last: LastService | null
  intervalKm: number | null
  intervalMonths: number | null
  currentMileage: number
  avgKmPerDay: number | null
  today: ISODate
}

export type NextDue = Omit<MaintenanceItem, "typeId" | "code" | "name" | "intervalKm" | "intervalMonths" | "last">

/** Найраніша з дат; відсутня складова вважається нескінченністю. */
const earliest = (a: ISODate | null, b: ISODate | null) => (a && b ? (a < b ? a : b) : (a ?? b))

/**
 * Наступне обслуговування за пробігом і часом (формули з дипломної записки):
 *   M_due = m0 + I_km,  ΔM = M_due − M
 *   t_time = d0 + I_months
 *   t_km = today + ceil(ΔM / v)  (ΔM ≤ 0 → today; v невідома → ∞)
 *   t_next = min(t_km, t_time)
 *   δ_km = max(1000, 0.2·I_km),  δ_days = max(14, 3·I_months)
 */
export function computeNextDue({
  last,
  intervalKm,
  intervalMonths,
  currentMileage,
  avgKmPerDay,
  today,
}: NextDueInput): NextDue {
  const empty: NextDue = {
    dueMileage: null,
    remainingKm: null,
    dueDateByTime: null,
    forecastDateByKm: null,
    nextDate: null,
    daysLeft: null,
    status: "no_data",
  }
  if (!last) return empty

  const todayDate = fromISODate(today)

  let dueMileage: number | null = null
  let remainingKm: number | null = null
  let forecastDateByKm: ISODate | null = null
  if (intervalKm != null) {
    dueMileage = last.mileage + intervalKm
    remainingKm = dueMileage - currentMileage
    if (remainingKm <= 0) {
      forecastDateByKm = today
    } else if (avgKmPerDay != null && avgKmPerDay > 0) {
      forecastDateByKm = toISODate(addDays(todayDate, Math.ceil(remainingKm / avgKmPerDay)))
    }
  }

  const dueDateByTime =
    intervalMonths != null ? toISODate(addMonths(fromISODate(last.date), intervalMonths)) : null

  const nextDate = earliest(forecastDateByKm, dueDateByTime)
  const daysLeft = nextDate ? differenceInCalendarDays(fromISODate(nextDate), todayDate) : null

  const deltaKm = intervalKm != null ? Math.max(1000, 0.2 * intervalKm) : null
  const deltaDays = intervalMonths != null ? Math.max(14, 3 * intervalMonths) : 14

  let status: MaintenanceStatus = "ok"
  if ((remainingKm != null && remainingKm <= 0) || (dueDateByTime != null && dueDateByTime <= today)) {
    status = "overdue"
  } else if (
    (remainingKm != null && deltaKm != null && remainingKm <= deltaKm) ||
    (daysLeft != null && daysLeft <= deltaDays)
  ) {
    status = "soon"
  }

  return { dueMileage, remainingKm, dueDateByTime, forecastDateByKm, nextDate, daysLeft, status }
}

const WINDOW_DAYS = 90
const MIN_SPAN_DAYS = 14

const byDateThenMileage = (a: MileagePoint, b: MileagePoint) =>
  a.date === b.date ? a.mileage - b.mileage : a.date < b.date ? -1 : 1

/**
 * Середній пробіг за день: за останні 90 днів, а якщо там менше 2 записів
 * або проміжок коротший за 14 днів — за всю історію.
 * null, якщо й по всій історії проміжок < 14 днів або пробіг не зріс.
 */
export function averageKmPerDay(entries: MileagePoint[], today: ISODate): number | null {
  return averageKmPerDayDetailed(entries, today)?.kmPerDay ?? null
}

/** Те саме, що averageKmPerDay, але з позначкою, за який період пораховано. */
export function averageKmPerDayDetailed(
  entries: MileagePoint[],
  today: ISODate
): { kmPerDay: number; basis: "last90days" | "allHistory" } | null {
  const sorted = entries.filter((e) => e.date <= today).sort(byDateThenMileage)
  const from = toISODate(subDays(fromISODate(today), WINDOW_DAYS))

  const rate = (points: MileagePoint[]) => {
    if (points.length < 2) return null
    const first = points[0]
    const last = points[points.length - 1]
    const days = differenceInCalendarDays(fromISODate(last.date), fromISODate(first.date))
    if (days < MIN_SPAN_DAYS) return null
    return { days, distance: last.mileage - first.mileage }
  }

  const window = rate(sorted.filter((e) => e.date >= from))
  if (window) return { kmPerDay: Math.max(0, window.distance) / window.days, basis: "last90days" }

  const all = rate(sorted)
  if (!all || all.distance <= 0) return null
  return { kmPerDay: all.distance / all.days, basis: "allHistory" }
}

export type PlanType = {
  id: string
  code: string | null
  name: string
  interval_km: number | null
  interval_months: number | null
  engine_types: Enums<"engine_type">[] | null
  sort_order: number
}

export type PlanRule = {
  maintenance_type_id: string
  interval_km: number | null
  interval_months: number | null
  is_enabled: boolean
}

export type BuildPlanInput = {
  car: { engine_type: Enums<"engine_type">; current_mileage: number }
  types: PlanType[]
  rules: PlanRule[]
  lastByType: Map<string, LastService>
  mileageEntries: MileagePoint[]
  today: ISODate
}

const STATUS_ORDER: Record<MaintenanceStatus, number> = { overdue: 0, soon: 1, ok: 2, no_data: 3 }

/** План ТО для авто: застосовні роботи з урахуванням індивідуальних правил, від найтерміновіших. */
export function buildMaintenancePlan({
  car,
  types,
  rules,
  lastByType,
  mileageEntries,
  today,
}: BuildPlanInput): MaintenanceItem[] {
  const ruleByType = new Map(rules.map((r) => [r.maintenance_type_id, r]))
  const avgKmPerDay = averageKmPerDay(mileageEntries, today)
  const sortOrder = new Map(types.map((t) => [t.id, t.sort_order]))

  const items = types
    .filter((t) => t.engine_types == null || t.engine_types.includes(car.engine_type))
    .filter((t) => ruleByType.get(t.id)?.is_enabled !== false)
    .map((t): MaintenanceItem => {
      const rule = ruleByType.get(t.id)
      const intervalKm = rule?.interval_km ?? t.interval_km
      const intervalMonths = rule?.interval_months ?? t.interval_months
      const last = lastByType.get(t.id) ?? null
      return {
        typeId: t.id,
        code: t.code,
        name: t.name,
        intervalKm,
        intervalMonths,
        last,
        ...computeNextDue({
          last,
          intervalKm,
          intervalMonths,
          currentMileage: car.current_mileage,
          avgKmPerDay,
          today,
        }),
      }
    })

  return items.sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (a.status === "no_data") return (sortOrder.get(a.typeId) ?? 0) - (sortOrder.get(b.typeId) ?? 0)
    // за nextDate зростаюче; без дати — в кінці групи
    if (a.nextDate === b.nextDate) return 0
    if (a.nextDate == null) return 1
    if (b.nextDate == null) return -1
    return a.nextDate < b.nextDate ? -1 : 1
  })
}

/**
 * Частка пройденого інтервалу (0…1) для прогрес-бару: більша з часток за пробігом
 * і за часом. null — немає попереднього виконання.
 */
export function intervalProgress(
  item: Pick<MaintenanceItem, "last" | "intervalKm" | "intervalMonths">,
  currentMileage: number,
  today: ISODate
): number | null {
  if (!item.last) return null
  const parts: number[] = []
  if (item.intervalKm) parts.push((currentMileage - item.last.mileage) / item.intervalKm)
  if (item.intervalMonths) {
    const start = fromISODate(item.last.date)
    const total = differenceInCalendarDays(addMonths(start, item.intervalMonths), start)
    parts.push(differenceInCalendarDays(fromISODate(today), start) / total)
  }
  if (!parts.length) return null
  return Math.min(1, Math.max(0, ...parts))
}

/**
 * Оцінка стану ТО авто для кругового індикатора:
 * round(100 · (ok + 0.5 · soon) / кількість робіт з історією); null — історії немає.
 */
export function healthScore(plan: Pick<MaintenanceItem, "status">[]): number | null {
  const tracked = plan.filter((i) => i.status !== "no_data")
  if (!tracked.length) return null
  const ok = tracked.filter((i) => i.status === "ok").length
  const soon = tracked.filter((i) => i.status === "soon").length
  return Math.round((100 * (ok + 0.5 * soon)) / tracked.length)
}

/** Підсумок плану: скільки робіт у кожному статусі. */
export function planSummary(plan: Pick<MaintenanceItem, "status">[]) {
  const count = (s: MaintenanceStatus) => plan.filter((i) => i.status === s).length
  return { overdue: count("overdue"), soon: count("soon"), ok: count("ok"), noData: count("no_data") }
}
