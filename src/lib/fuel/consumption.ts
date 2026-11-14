export type FuelRecordInput = {
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
