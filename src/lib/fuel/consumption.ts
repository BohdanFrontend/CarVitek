export type FuelRecordInput = {
  /** id запису (щоб показати витрату біля заправки, що закриває сегмент) */
  id?: string
  mileage: number
  liters: number
  isFullTank: boolean
  date?: string
}

export type FuelSegment = {
  fromMileage: number
  toMileage: number
  /** Літри, заправлені після стартової повної заправки до кінцевої включно */
  liters: number
  distance: number
  lPer100km: number
  /** Заправка, що закриває сегмент */
  toId?: string
  toDate?: string
}

/**
 * Метод «від повного до повного»: кожна пара послідовних повних заправок дає сегмент;
 * неповні між ними додають літри. Перша повна — лише точка відліку,
 * неповні після останньої повної в розрахунок не входять.
 */
export function fuelSegments(records: FuelRecordInput[]): FuelSegment[] {
  const sorted = [...records].sort((a, b) => a.mileage - b.mileage)
  const segments: FuelSegment[] = []
  let start: number | null = null
  let liters = 0

  for (const r of sorted) {
    if (start == null) {
      if (r.isFullTank) start = r.mileage
      continue // неповні до першої повної не мають точки відліку
    }
    liters += r.liters
    if (!r.isFullTank) continue
    const distance = r.mileage - start
    if (distance > 0) {
      segments.push({
        fromMileage: start,
        toMileage: r.mileage,
        liters,
        distance,
        lPer100km: (100 * liters) / distance,
        toId: r.id,
        toDate: r.date,
      })
    }
    start = r.mileage
    liters = 0
  }
  return segments
}

/** Середня витрата, зважена за пробігом: 100 · Σл / Σкм. */
export function averageConsumption(segments: FuelSegment[]): number | null {
  const distance = segments.reduce((s, x) => s + x.distance, 0)
  if (distance <= 0) return null
  return (100 * segments.reduce((s, x) => s + x.liters, 0)) / distance
}

export type ConsumptionPoint = {
  /** "2026-03" (місяць) або "2026-03-14" (день заправки) */
  key: string
  /** Зважене за пробігом середнє: 100 · Σл / Σкм сегментів, що закрились у цей місяць / день */
  value: number
  distance: number
  liters: number
}
/** @deprecated назва для сумісності — те саме, що ConsumptionPoint */
export type MonthlyConsumption = ConsumptionPoint

export type Granularity = "month" | "day"

/**
 * Точки графіка: сегменти групуються за датою заправки, що їх закриває —
 * за місяцем або за днем. Порожні місяці/дні пропускаються
 * (лінія з'єднує сусідні точки, а не падає в 0).
 */
export function groupConsumption(segments: FuelSegment[], by: Granularity): ConsumptionPoint[] {
  const groups = new Map<string, { distance: number; liters: number }>()
  for (const s of segments) {
    if (!s.toDate) continue
    const key = by === "month" ? s.toDate.slice(0, 7) : s.toDate.slice(0, 10)
    const acc = groups.get(key) ?? { distance: 0, liters: 0 }
    acc.distance += s.distance
    acc.liters += s.liters
    groups.set(key, acc)
  }
  return [...groups]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, { distance, liters }]) => ({ key, value: (100 * liters) / distance, distance, liters }))
}

/** Одна точка на місяць (зважене середнє сегментів, що закрились у місяці). */
export const monthlyConsumption = (segments: FuelSegment[]) => groupConsumption(segments, "month")

export type ConsumptionPeriod = "6m" | "1y" | "all"

const PERIOD_MONTHS: Record<Exclude<ConsumptionPeriod, "all">, number> = { "6m": 6, "1y": 12 }

/** Перший місяць періоду ("2026-06" для 6M при today = 2026-11-…): N календарних місяців до поточного включно. */
function periodStart(today: string, months: number, shift = 0) {
  const [y, m] = today.slice(0, 7).split("-").map(Number)
  const idx = y * 12 + (m - 1) - (months - 1) - shift * months
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`
}

/** "2026-01" → "2025-12" */
function monthBefore(month: string) {
  const [y, m] = month.split("-").map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`
}

/**
 * Витрата за період 6M / 1Y / All: помісячні точки, зважене середнє, межі і зміна
 * до попереднього такого ж періоду (для All — без порівняння).
 */
export function consumptionForPeriod(segments: FuelSegment[], period: ConsumptionPeriod, today: string) {
  const inMonths = (from: string, to: string) =>
    segments.filter((s) => s.toDate && s.toDate.slice(0, 7) >= from && s.toDate.slice(0, 7) <= to)

  const thisMonth = today.slice(0, 7)
  let current = segments.filter((s) => s.toDate && s.toDate <= today)
  let previous: FuelSegment[] | null = null
  if (period !== "all") {
    const n = PERIOD_MONTHS[period]
    const from = periodStart(today, n)
    current = inMonths(from, thisMonth)
    // попередній такий самий період: N місяців, що закінчуються місяцем перед `from`
    previous = inMonths(periodStart(today, n, 1), monthBefore(from))
  }

  // Помісячно, але якщо дані вміщаються в один місяць (а заправок кілька) —
  // по кожній заправці, щоб графік показував динаміку, а не одну точку
  const monthly = monthlyConsumption(current)
  const daily = groupConsumption(current, "day")
  const granularity: Granularity = monthly.length < 2 && daily.length >= 2 ? "day" : "month"
  const points = granularity === "day" ? daily : monthly
  const average = averageConsumption(current)
  const previousAverage = previous ? averageConsumption(previous) : null
  const values = points.map((p) => p.value)
  return {
    points,
    granularity,
    average,
    previousAverage,
    change: average != null && previousAverage != null ? average - previousAverage : null,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  }
}
