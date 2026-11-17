"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { CAR_NOT_FOUND, NOT_SIGNED_IN, getActionContext, type MutationResult } from "@/lib/server/auth"
import { deleteMileageEntry, syncMileageEntry } from "@/lib/server/mileage"
import { fuelRecordSchema, type FuelRecordInput } from "@/lib/validation/fuel"

const idSchema = z.uuid()

/**
 * Зберігає заправку. Нова: тригер додає точку пробігу (source 'fuel').
 * Редагування: оновлюємо ту саму точку пробігу.
 */
export async function saveFuelRecord({
  id,
  carId,
  data,
}: {
  id?: string
  carId: string
  data: FuelRecordInput
}): Promise<MutationResult> {
  if (!idSchema.safeParse(carId).success || (id && !idSchema.safeParse(id).success)) {
    return { ok: false, message: "errors.invalidRequest" }
  }
  const parsed = fuelRecordSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      message: "errors.checkFields",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const { supabase, userId, car } = await getActionContext(carId)
  if (!userId) return NOT_SIGNED_IN
  if (!car) return CAR_NOT_FOUND

  if (!id) {
    const { data: created, error } = await supabase
      .from("fuel_records")
      .insert({ car_id: carId, ...parsed.data })
      .select("id")
      .single()
    if (error || !created) {
      console.error("saveFuelRecord insert:", error)
      return { ok: false, message: "errors.saveRefuelingFailed" }
    }
    revalidatePath("/", "layout")
    return { ok: true, id: created.id }
  }

  const { data: existing } = await supabase
    .from("fuel_records")
    .select("id, car_id, filled_at, mileage")
    .eq("id", id)
    .maybeSingle()
  if (!existing || existing.car_id !== carId) return { ok: false, message: "errors.refuelingNotFound" }

  const { error } = await supabase.from("fuel_records").update(parsed.data).eq("id", id)
  if (error) {
    console.error("saveFuelRecord update:", error)
    return { ok: false, message: "errors.saveChangesFailed" }
  }
  await syncMileageEntry(supabase, {
    carId,
    source: "fuel",
    old: { date: existing.filled_at, mileage: existing.mileage },
    next: { date: parsed.data.filled_at, mileage: parsed.data.mileage },
    currentMileage: car.current_mileage,
  })

  revalidatePath("/", "layout")
  return { ok: true, id }
}

/** Видаляє заправку і її точку пробігу. */
export async function deleteFuelRecord(id: string): Promise<MutationResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "errors.invalidRequest" }
  const { supabase, userId } = await getActionContext()
  if (!userId) return NOT_SIGNED_IN

  const { data: record } = await supabase
    .from("fuel_records")
    .select("id, car_id, filled_at, mileage")
    .eq("id", id)
    .maybeSingle()
  if (!record) return { ok: false, message: "errors.refuelingNotFound" }

  await deleteMileageEntry(supabase, {
    carId: record.car_id,
    source: "fuel",
    date: record.filled_at,
    mileage: record.mileage,
  })
  const { error } = await supabase.from("fuel_records").delete().eq("id", id)
  if (error) {
    console.error("deleteFuelRecord:", error)
    return { ok: false, message: "errors.deleteRefuelingFailed" }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}
