"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  CAR_NOT_FOUND,
  NOT_SIGNED_IN,
  getActionContext,
  isOwnedPath,
  type MutationResult,
} from "@/lib/server/auth"
import { deleteMileageEntry, syncMileageEntry } from "@/lib/server/mileage"
import { serviceRecordSchema, type ServiceRecordInput } from "@/lib/validation/service"

const RECEIPTS = "receipts"
const idSchema = z.uuid()

type SaveInput = {
  /** id запису для редагування; без нього — новий запис */
  id?: string
  carId: string
  data: ServiceRecordInput
  receiptPath: string | null
}

/**
 * Зберігає запис ТО разом із роботами (service_record_items).
 * Новий запис: тригер сам додає точку в mileage_entries (source 'service').
 * Редагування: синхронізуємо роботи, відповідну точку пробігу і чек у Storage.
 */
export async function saveServiceRecord({ id, carId, data, receiptPath }: SaveInput): Promise<MutationResult> {
  if (!idSchema.safeParse(carId).success || (id && !idSchema.safeParse(id).success)) {
    return { ok: false, message: "Invalid request." }
  }
  const parsed = serviceRecordSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }
  const { type_ids, ...fields } = parsed.data

  const { supabase, userId, car } = await getActionContext(carId)
  if (!userId) return NOT_SIGNED_IN
  if (!car) return CAR_NOT_FOUND
  if (receiptPath && !isOwnedPath(receiptPath, userId, carId)) {
    return { ok: false, message: "Invalid receipt file." }
  }

  // Усі роботи мають бути видимі користувачу (системні або власні)
  const { data: types } = await supabase.from("maintenance_types").select("id").in("id", type_ids)
  if ((types?.length ?? 0) !== new Set(type_ids).size) {
    return { ok: false, message: "Some work types are not available.", fieldErrors: { type_ids: ["Select work types from the list"] } }
  }

  // ---------------------------------------------------------------- новий запис
  if (!id) {
    const { data: created, error } = await supabase
      .from("service_records")
      .insert({ car_id: carId, ...fields, receipt_path: receiptPath })
      .select("id")
      .single()
    if (error || !created) {
      console.error("saveServiceRecord insert:", error)
      return { ok: false, message: "Couldn't save the record. Please try again." }
    }
    const { error: itemsError } = await supabase
      .from("service_record_items")
      .insert(type_ids.map((t) => ({ service_record_id: created.id, maintenance_type_id: t })))
    if (itemsError) {
      console.error("saveServiceRecord items:", itemsError)
      await deleteRecordWithMileage(supabase, { id: created.id, car_id: carId, performed_at: fields.performed_at, mileage: fields.mileage })
      return { ok: false, message: "Couldn't save the record. Please try again." }
    }
    revalidatePath("/", "layout")
    return { ok: true, id: created.id }
  }

  // ---------------------------------------------------------------- редагування
  const { data: existing } = await supabase
    .from("service_records")
    .select("id, car_id, performed_at, mileage, receipt_path, service_record_items(maintenance_type_id)")
    .eq("id", id)
    .maybeSingle()
  if (!existing || existing.car_id !== carId) return { ok: false, message: "This record doesn't exist or was deleted." }

  const { error: updateError } = await supabase
    .from("service_records")
    .update({ ...fields, receipt_path: receiptPath })
    .eq("id", id)
  if (updateError) {
    console.error("saveServiceRecord update:", updateError)
    return { ok: false, message: "Couldn't save the changes. Please try again." }
  }

  // Роботи: видаляємо зайві, додаємо нові
  const current = new Set(existing.service_record_items.map((i) => i.maintenance_type_id))
  const next = new Set(type_ids)
  const removed = [...current].filter((t) => !next.has(t))
  const added = [...next].filter((t) => !current.has(t))
  if (removed.length) {
    await supabase.from("service_record_items").delete().eq("service_record_id", id).in("maintenance_type_id", removed)
  }
  if (added.length) {
    const { error } = await supabase
      .from("service_record_items")
      .insert(added.map((t) => ({ service_record_id: id, maintenance_type_id: t })))
    if (error) console.error("saveServiceRecord add items:", error)
  }

  await syncMileageEntry(supabase, {
    carId,
    source: "service",
    old: { date: existing.performed_at, mileage: existing.mileage },
    next: { date: fields.performed_at, mileage: fields.mileage },
    currentMileage: car.current_mileage,
  })

  if (existing.receipt_path && existing.receipt_path !== receiptPath) {
    await supabase.storage.from(RECEIPTS).remove([existing.receipt_path])
  }

  revalidatePath("/", "layout")
  return { ok: true, id }
}

/** Видаляє запис ТО, його точку пробігу і чек. */
export async function deleteServiceRecord(id: string): Promise<MutationResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Invalid request." }
  const { supabase, userId } = await getActionContext()
  if (!userId) return NOT_SIGNED_IN

  const { data: record } = await supabase
    .from("service_records")
    .select("id, car_id, performed_at, mileage, receipt_path")
    .eq("id", id)
    .maybeSingle()
  if (!record) return { ok: false, message: "This record doesn't exist or was deleted." }

  const ok = await deleteRecordWithMileage(supabase, record)
  if (!ok) return { ok: false, message: "Couldn't delete the record. Please try again." }
  if (record.receipt_path) await supabase.storage.from(RECEIPTS).remove([record.receipt_path])

  revalidatePath("/", "layout")
  return { ok: true }
}

type Supabase = Awaited<ReturnType<typeof getActionContext>>["supabase"]

async function deleteRecordWithMileage(
  supabase: Supabase,
  record: { id: string; car_id: string; performed_at: string; mileage: number }
) {
  await deleteMileageEntry(supabase, {
    carId: record.car_id,
    source: "service",
    date: record.performed_at,
    mileage: record.mileage,
  })
  const { error } = await supabase.from("service_records").delete().eq("id", record.id)
  if (error) console.error("deleteServiceRecord:", error)
  return !error
}
