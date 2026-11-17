"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { msg } from "@/i18n/messages"
import { createClient } from "@/lib/supabase/server"
import { MAX_MILEAGE } from "@/lib/validation/car"

export type UpdateMileageResult = { ok: true } | { ok: false; message: string }

const inputSchema = z.object({
  carId: z.uuid(),
  mileage: z
    .number({ error: "validation.enterCurrentMileage" })
    .int("validation.mileageWhole")
    .min(0, "validation.mileageNegative")
    .max(MAX_MILEAGE, msg("validation.mileageMax", { km: MAX_MILEAGE })),
})

/** Новий показник одометра → запис у mileage_entries; cars.current_mileage оновить тригер. */
export async function updateMileage(carId: string, mileage: number): Promise<UpdateMileageResult> {
  const parsed = inputSchema.safeParse({ carId, mileage })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, message: "errors.notSignedIn" }

  // RLS поверне авто лише власнику
  const { data: car } = await supabase
    .from("cars")
    .select("current_mileage")
    .eq("id", parsed.data.carId)
    .maybeSingle()
  if (!car) return { ok: false, message: "errors.carNotFound" }
  if (parsed.data.mileage < car.current_mileage) {
    return { ok: false, message: msg("validation.mileageBelowCurrent", { km: car.current_mileage }) }
  }

  const { error } = await supabase
    .from("mileage_entries")
    .insert({ car_id: parsed.data.carId, mileage: parsed.data.mileage, source: "manual" })
  if (error) {
    console.error("updateMileage:", error)
    return { ok: false, message: "errors.mileageUpdateFailed" }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}
