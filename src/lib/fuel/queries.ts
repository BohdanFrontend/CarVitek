import { createClient } from "@/lib/supabase/server"
import { averageConsumption, fuelSegments } from "./consumption"

export type FuelRow = {
  id: string
  filled_at: string
  mileage: number
  liters: number
  price_per_liter: number
  total_cost: number
  is_full_tank: boolean
  station: string | null
  /** Витрата для повної заправки, що закриває сегмент; інакше null */
  consumption: number | null
}

/**
 * Усі заправки авто: сегменти «від повного до повного» рахуються по всій історії,
 * а список віддається сторінками (новіші зверху).
 */
export async function getFuelLog(carId: string, limit: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("fuel_records")
    .select("id, filled_at, mileage, liters, price_per_liter, total_cost, is_full_tank, station")
    .eq("car_id", carId)
    .order("mileage")
  if (error) throw new Error(`Failed to load fuel records: ${error.message}`)

  const records = data.map((r) => ({
    ...r,
    liters: Number(r.liters),
    price_per_liter: Number(r.price_per_liter),
    total_cost: Number(r.total_cost ?? 0),
  }))
  const segments = fuelSegments(
    records.map((r) => ({ id: r.id, date: r.filled_at, mileage: r.mileage, liters: r.liters, isFullTank: r.is_full_tank }))
  )
  const bySegmentEnd = new Map(segments.map((s) => [s.toId, s.lPer100km]))

  const newestFirst = [...records].sort((a, b) =>
    a.filled_at === b.filled_at ? b.mileage - a.mileage : a.filled_at < b.filled_at ? 1 : -1
  )
  const rows: FuelRow[] = newestFirst.slice(0, limit).map((r) => ({ ...r, consumption: bySegmentEnd.get(r.id) ?? null }))

  return {
    rows,
    total: records.length,
    hasMore: records.length > limit,
    average: averageConsumption(segments),
    chart: segments.map((s) => ({ date: s.toDate ?? "", value: Math.round(s.lPer100km * 100) / 100 })),
    /** Для попередження «пробіг менший за попередню заправку» у формі */
    history: records.map((r) => ({ id: r.id, date: r.filled_at, mileage: r.mileage })),
    totalSpent: records.reduce((s, r) => s + r.total_cost, 0),
  }
}
