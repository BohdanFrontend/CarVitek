"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { CAR_NOT_FOUND, NOT_SIGNED_IN, getActionContext, type MutationResult } from "@/lib/server/auth"
import { expenseSchema, type ExpenseInput } from "@/lib/validation/expense"

const idSchema = z.uuid()

/** Додає або оновлює витрату активного авто. */
export async function saveExpense({
  id,
  carId,
  data,
}: {
  id?: string
  carId: string
  data: ExpenseInput
}): Promise<MutationResult> {
  if (!idSchema.safeParse(carId).success || (id && !idSchema.safeParse(id).success)) {
    return { ok: false, message: "Invalid request." }
  }
  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const { supabase, userId, car } = await getActionContext(carId)
  if (!userId) return NOT_SIGNED_IN
  if (!car) return CAR_NOT_FOUND

  if (id) {
    const { data: existing } = await supabase.from("expenses").select("car_id").eq("id", id).maybeSingle()
    if (!existing || existing.car_id !== carId) return { ok: false, message: "This expense doesn't exist or was deleted." }
    const { error } = await supabase.from("expenses").update(parsed.data).eq("id", id)
    if (error) {
      console.error("saveExpense update:", error)
      return { ok: false, message: "Couldn't save the changes. Please try again." }
    }
  } else {
    const { error } = await supabase.from("expenses").insert({ car_id: carId, ...parsed.data })
    if (error) {
      console.error("saveExpense insert:", error)
      return { ok: false, message: "Couldn't save the expense. Please try again." }
    }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteExpense(id: string): Promise<MutationResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Invalid request." }
  const { supabase, userId } = await getActionContext()
  if (!userId) return NOT_SIGNED_IN

  // RLS: видалити можна лише витрату власного авто
  const { data, error } = await supabase.from("expenses").delete().eq("id", id).select("id")
  if (error || !data?.length) {
    if (error) console.error("deleteExpense:", error)
    return { ok: false, message: "Couldn't delete the expense. Please try again." }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}
