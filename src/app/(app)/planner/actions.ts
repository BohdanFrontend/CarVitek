"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { CAR_NOT_FOUND, NOT_SIGNED_IN, getActionContext, type MutationResult } from "@/lib/server/auth"
import {
  customTaskSchema,
  intervalRuleSchema,
  type CustomTaskInput,
  type IntervalRuleInput,
} from "@/lib/validation/maintenance"

const idSchema = z.uuid()

const invalid = (error: z.ZodError): MutationResult => ({
  ok: false,
  message: error.issues[0]?.message ?? "Please check the values.",
  fieldErrors: z.flattenError(error).fieldErrors,
})

/** Робота, видима користувачу (системна або власна). */
async function getType(supabase: Awaited<ReturnType<typeof getActionContext>>["supabase"], typeId: string) {
  const { data } = await supabase
    .from("maintenance_types")
    .select("id, interval_km, interval_months")
    .eq("id", typeId)
    .maybeSingle()
  return data
}

/**
 * Зберігає індивідуальний інтервал для авто (upsert у car_maintenance_rules).
 * Значення, що збігаються з довідником, зберігаємо як NULL — тоді в таблиці «Default».
 */
export async function saveIntervalRule(
  carId: string,
  typeId: string,
  input: IntervalRuleInput
): Promise<MutationResult> {
  if (!idSchema.safeParse(carId).success || !idSchema.safeParse(typeId).success) {
    return { ok: false, message: "Invalid request." }
  }
  const parsed = intervalRuleSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  const { supabase, userId, car } = await getActionContext(carId)
  if (!userId) return NOT_SIGNED_IN
  if (!car) return CAR_NOT_FOUND
  const type = await getType(supabase, typeId)
  if (!type) return { ok: false, message: "This maintenance task doesn't exist." }

  const { interval_km, interval_months, is_enabled } = parsed.data
  const row = {
    car_id: carId,
    maintenance_type_id: typeId,
    interval_km: interval_km === type.interval_km ? null : interval_km,
    interval_months: interval_months === type.interval_months ? null : interval_months,
    is_enabled,
  }
  // Нічого не змінено і робота відстежується — правило не потрібне
  const { error } =
    row.interval_km == null && row.interval_months == null && is_enabled
      ? await supabase.from("car_maintenance_rules").delete().match({ car_id: carId, maintenance_type_id: typeId })
      : await supabase.from("car_maintenance_rules").upsert(row)
  if (error) {
    console.error("saveIntervalRule:", error)
    return { ok: false, message: "Couldn't save the interval. Please try again." }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Повертає типовий інтервал з довідника (видаляє правило). */
export async function resetIntervalRule(carId: string, typeId: string): Promise<MutationResult> {
  if (!idSchema.safeParse(carId).success || !idSchema.safeParse(typeId).success) {
    return { ok: false, message: "Invalid request." }
  }
  const { supabase, userId, car } = await getActionContext(carId)
  if (!userId) return NOT_SIGNED_IN
  if (!car) return CAR_NOT_FOUND

  const { error } = await supabase
    .from("car_maintenance_rules")
    .delete()
    .match({ car_id: carId, maintenance_type_id: typeId })
  if (error) {
    console.error("resetIntervalRule:", error)
    return { ok: false, message: "Couldn't reset the interval. Please try again." }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Власна робота користувача (maintenance_types з owner_id) — для всіх двигунів. */
export async function createCustomTask(input: CustomTaskInput): Promise<MutationResult> {
  const parsed = customTaskSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  const { supabase, userId } = await getActionContext()
  if (!userId) return NOT_SIGNED_IN

  const { data, error } = await supabase
    .from("maintenance_types")
    .insert({ ...parsed.data, owner_id: userId, engine_types: null, sort_order: 200 })
    .select("id")
    .single()
  if (error || !data) {
    console.error("createCustomTask:", error)
    return { ok: false, message: "Couldn't create the task. Please try again." }
  }
  revalidatePath("/", "layout")
  return { ok: true, id: data.id }
}
