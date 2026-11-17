"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

import { todayInKyiv } from "@/lib/dates"
import type { DocumentType } from "@/lib/documents/status"
import { CAR_NOT_FOUND, NOT_SIGNED_IN, getActionContext, isOwnedPath, type MutationResult } from "@/lib/server/auth"
import type { Enums } from "@/lib/supabase/database.types"
import { documentSchema, type DocumentData, type DocumentFormValues } from "@/lib/validation/document"

const BUCKET = "documents"
const idSchema = z.uuid()

const INSURANCE: readonly DocumentType[] = ["osago", "casco", "green_card"]
const expenseCategory = (type: DocumentType): Enums<"expense_category"> =>
  INSURANCE.includes(type) ? "insurance" : "other"

function revalidate() {
  revalidatePath("/documents")
  revalidatePath("/dashboard")
  revalidatePath("/expenses")
  // бейдж і список на дзвіночку — у каркасі
  revalidatePath("/", "layout")
}

type Supabase = Awaited<ReturnType<typeof getActionContext>>["supabase"]

/**
 * Пов'язана витрата: є вартість — створити/оновити, немає — видалити.
 * Повертає expense_id для документа.
 */
async function syncExpense(supabase: Supabase, carId: string, expenseId: string | null, doc: DocumentData) {
  if (doc.cost == null) {
    if (expenseId) await supabase.from("expenses").delete().eq("id", expenseId).eq("car_id", carId)
    return null
  }
  const t = await getTranslations("documents")
  const name = doc.type === "other" && doc.title ? doc.title : t(`types.${doc.type}`)
  const today = todayInKyiv()
  const fields = {
    category: expenseCategory(doc.type),
    amount: doc.cost,
    // майбутня дата початку не має записувати витрату наперед
    spent_at: doc.start_date && doc.start_date <= today ? doc.start_date : today,
    comment: [name, doc.number].filter(Boolean).join(" "),
  }
  if (expenseId) {
    const { data } = await supabase.from("expenses").update(fields).eq("id", expenseId).eq("car_id", carId).select("id")
    if (data?.length) return expenseId
  }
  const { data, error } = await supabase.from("expenses").insert({ car_id: carId, ...fields }).select("id").single()
  if (error) throw new Error(error.message)
  return data.id
}

function parse(values: DocumentFormValues) {
  const parsed = documentSchema.safeParse(values)
  if (parsed.success) return { data: parsed.data, error: null }
  const error: MutationResult = {
    ok: false,
    message: "errors.checkFields",
    fieldErrors: z.flattenError(parsed.error).fieldErrors,
  }
  return { data: null, error }
}

/** Новий документ авто. Файл уже завантажено клієнтом у documents/<user_id>/<car_id>/…. */
export async function createDocument(input: {
  carId: string
  values: DocumentFormValues
  filePath: string | null
}): Promise<MutationResult> {
  if (!idSchema.safeParse(input.carId).success) return { ok: false, message: "errors.invalidRequest" }
  const { supabase, userId, car } = await getActionContext(input.carId)
  if (!userId) return NOT_SIGNED_IN
  if (!car) return CAR_NOT_FOUND
  if (input.filePath && !isOwnedPath(input.filePath, userId, car.id)) return { ok: false, message: "validation.invalidFile" }
  const { data, error } = parse(input.values)
  if (!data) return error

  let expenseId: string | null = null
  try {
    expenseId = await syncExpense(supabase, car.id, null, data)
    const { data: row, error: insertError } = await supabase
      .from("car_documents")
      .insert({ car_id: car.id, ...data, expense_id: expenseId, file_path: input.filePath })
      .select("id")
      .single()
    if (insertError) throw new Error(insertError.message)
    revalidate()
    return { ok: true, id: row.id }
  } catch (e) {
    console.error("createDocument:", e instanceof Error ? e.message : e)
    if (expenseId) await supabase.from("expenses").delete().eq("id", expenseId)
    return { ok: false, message: "errors.saveDocumentFailed" }
  }
}

/** Редагування документа; старий файл видаляється, якщо його замінили або прибрали. */
export async function updateDocument(input: {
  id: string
  values: DocumentFormValues
  filePath: string | null
}): Promise<MutationResult> {
  if (!idSchema.safeParse(input.id).success) return { ok: false, message: "errors.invalidRequest" }
  const { supabase, userId } = await getActionContext()
  if (!userId) return NOT_SIGNED_IN

  // RLS поверне документ лише власного авто
  const { data: existing } = await supabase
    .from("car_documents")
    .select("id, car_id, file_path, expense_id")
    .eq("id", input.id)
    .maybeSingle()
  if (!existing) return { ok: false, message: "errors.documentNotFound" }
  const { car } = await getActionContext(existing.car_id)
  if (!car) return CAR_NOT_FOUND
  if (input.filePath && input.filePath !== existing.file_path && !isOwnedPath(input.filePath, userId, car.id)) {
    return { ok: false, message: "validation.invalidFile" }
  }
  const { data, error } = parse(input.values)
  if (!data) return error

  try {
    const expenseId = await syncExpense(supabase, car.id, existing.expense_id, data)
    const { error: updateError } = await supabase
      .from("car_documents")
      .update({ ...data, expense_id: expenseId, file_path: input.filePath })
      .eq("id", existing.id)
    if (updateError) throw new Error(updateError.message)
  } catch (e) {
    console.error("updateDocument:", e instanceof Error ? e.message : e)
    return { ok: false, message: "errors.saveDocumentFailed" }
  }

  if (existing.file_path && existing.file_path !== input.filePath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([existing.file_path])
    if (removeError) console.error("updateDocument remove old file:", removeError.message)
  }
  revalidate()
  return { ok: true, id: existing.id }
}

/** Видаляє документ, його файл і пов'язану витрату. */
export async function deleteDocument(id: string): Promise<MutationResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "errors.invalidRequest" }
  const { supabase, userId } = await getActionContext()
  if (!userId) return NOT_SIGNED_IN

  const { data: deleted, error } = await supabase
    .from("car_documents")
    .delete()
    .eq("id", id)
    .select("car_id, file_path, expense_id")
  if (error || !deleted?.length) {
    if (error) console.error("deleteDocument:", error.message)
    return { ok: false, message: error ? "errors.deleteDocumentFailed" : "errors.documentNotFound" }
  }
  const doc = deleted[0]
  if (doc.expense_id) await supabase.from("expenses").delete().eq("id", doc.expense_id).eq("car_id", doc.car_id)
  if (doc.file_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([doc.file_path])
    if (removeError) console.error("deleteDocument remove file:", removeError.message)
  }
  revalidate()
  return { ok: true }
}
