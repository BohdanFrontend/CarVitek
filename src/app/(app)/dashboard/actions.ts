"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { formatKm } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { MAX_MILEAGE } from "@/lib/validation/car"

export type UpdateMileageResult = { ok: true } | { ok: false; message: string }

const inputSchema = z.object({
  carId: z.uuid(),
  mileage: z
    .number({ error: "Enter the current mileage" })
    .int("Mileage must be a whole number")
    .min(0, "Mileage can't be negative")
    .max(MAX_MILEAGE, `At most ${formatKm(MAX_MILEAGE)}`),
})

/** Новий показник одометра → запис у mileage_entries; cars.current_mileage оновить тригер. */
export async function updateMileage(carId: string, mileage: number): Promise<UpdateMileageResult> {
  const parsed = inputSchema.safeParse({ carId, mileage })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, message: "You're not signed in." }

  // RLS поверне авто лише власнику
  const { data: car } = await supabase
    .from("cars")
    .select("current_mileage")
    .eq("id", parsed.data.carId)
    .maybeSingle()
  if (!car) return { ok: false, message: "This car doesn't exist or was deleted." }
  if (parsed.data.mileage < car.current_mileage) {
    return { ok: false, message: `Mileage can't be lower than ${formatKm(car.current_mileage)}` }
  }

  const { error } = await supabase
    .from("mileage_entries")
    .insert({ car_id: parsed.data.carId, mileage: parsed.data.mileage, source: "manual" })
  if (error) {
    console.error("updateMileage:", error)
    return { ok: false, message: "Couldn't update the mileage. Please try again." }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}
