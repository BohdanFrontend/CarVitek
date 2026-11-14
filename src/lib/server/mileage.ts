import type { createClient } from "@/lib/supabase/server"

type Supabase = Awaited<ReturnType<typeof createClient>>
type Source = "service" | "fuel"

/**
 * Оновлює точку пробігу, яку тригер створив для запису ТО чи заправки.
 * Тригер синхронізації пробігу авто спрацьовує лише на вставку, тож при збільшенні
 * пробігу понад поточний оновлюємо cars.current_mileage самі (він ніколи не зменшується).
 */
export async function syncMileageEntry(
  supabase: Supabase,
  {
    carId,
    source,
    old,
    next,
    currentMileage,
  }: {
    carId: string
    source: Source
    old: { date: string; mileage: number }
    next: { date: string; mileage: number }
    currentMileage: number
  }
) {
  if (old.date !== next.date || old.mileage !== next.mileage) {
    const { data: updated } = await supabase
      .from("mileage_entries")
      .update({ recorded_at: next.date, mileage: next.mileage })
      .match({ car_id: carId, source, recorded_at: old.date, mileage: old.mileage })
      .select("id")
    if (!updated?.length) {
      // точку раніше видалили — створюємо заново (тригер на вставку підніме пробіг авто)
      await supabase
        .from("mileage_entries")
        .insert({ car_id: carId, source, recorded_at: next.date, mileage: next.mileage })
      return
    }
  }
  if (next.mileage > currentMileage) {
    await supabase.from("cars").update({ current_mileage: next.mileage }).eq("id", carId)
  }
}

/** Видаляє точку пробігу, створену тригером для запису ТО чи заправки. */
export async function deleteMileageEntry(
  supabase: Supabase,
  { carId, source, date, mileage }: { carId: string; source: Source; date: string; mileage: number }
) {
  const { error } = await supabase
    .from("mileage_entries")
    .delete()
    .match({ car_id: carId, source, recorded_at: date, mileage })
  if (error) console.error("deleteMileageEntry:", error)
}
