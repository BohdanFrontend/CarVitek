"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"

import { ACTIVE_CAR_COOKIE, activeCarCookieOptions } from "@/lib/cars/active-car"
import { createClient } from "@/lib/supabase/server"
import { carSchema, mileageTooLowMessage, type CarInput } from "@/lib/validation/car"

const BUCKET = "car-photos"

export type CarActionResult =
  | { ok: true; carId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> }

const carIdSchema = z.uuid("Invalid car id")

/** Поточний користувач або null. Перевіряє JWT, а не просто читає cookie. */
async function getUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  return { supabase, userId: userId ?? null }
}

/** Фото авто можна зберігати лише у «своїй» теці: <user_id>/<car_id>/<файл>. */
function isValidPhotoPath(path: string, userId: string, carId: string) {
  const prefix = `${userId}/${carId}/`
  return path.startsWith(prefix) && path.length > prefix.length && !path.includes("..")
}

const notSignedIn = { ok: false, message: "You're not signed in." } as const

const invalidData = (error: z.ZodError): CarActionResult => ({
  ok: false,
  message: "Please check the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors,
})

async function setActiveCookie(carId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_CAR_COOKIE, carId, activeCarCookieOptions)
}

// ---------------------------------------------------------------- Додати авто
export async function createCar(
  carId: string,
  input: CarInput,
  photoPath: string | null
): Promise<CarActionResult> {
  const { supabase, userId } = await getUser()
  if (!userId) return notSignedIn

  if (!carIdSchema.safeParse(carId).success) return { ok: false, message: "Invalid car id." }
  const parsed = carSchema.safeParse(input)
  if (!parsed.success) return invalidData(parsed.error)
  if (photoPath && !isValidPhotoPath(photoPath, userId, carId)) {
    return { ok: false, message: "Invalid photo." }
  }

  // Чи є в користувача інші авто — перше додане одразу стає активним
  const { count } = await supabase.from("cars").select("id", { count: "exact", head: true })

  // Початковий пробіг у mileage_entries додає тригер cars_log_initial_mileage
  const { error } = await supabase
    .from("cars")
    .insert({ id: carId, ...parsed.data, photo_path: photoPath })
  if (error) {
    console.error("createCar:", error)
    return { ok: false, message: "Couldn't save the car. Please try again." }
  }

  if (!count) await setActiveCookie(carId)

  revalidatePath("/", "layout")
  return { ok: true, carId }
}

// ---------------------------------------------------------------- Редагувати авто
export async function updateCar(
  carId: string,
  input: CarInput,
  photoPath: string | null
): Promise<CarActionResult> {
  const { supabase, userId } = await getUser()
  if (!userId) return notSignedIn

  if (!carIdSchema.safeParse(carId).success) return { ok: false, message: "Invalid car id." }
  const parsed = carSchema.safeParse(input)
  if (!parsed.success) return invalidData(parsed.error)

  const { data: car } = await supabase
    .from("cars")
    .select("id, current_mileage, photo_path")
    .eq("id", carId)
    .maybeSingle()
  if (!car) return { ok: false, message: "This car doesn't exist or was deleted." }

  const { current_mileage: newMileage, ...fields } = parsed.data
  if (newMileage < car.current_mileage) {
    const message = mileageTooLowMessage(car.current_mileage)
    return { ok: false, message, fieldErrors: { current_mileage: [message] } }
  }

  const photoChanged = photoPath !== car.photo_path
  if (photoChanged && photoPath && !isValidPhotoPath(photoPath, userId, carId)) {
    return { ok: false, message: "Invalid photo." }
  }

  // Спершу пробіг: cars.current_mileage піднімає тригер mileage_entries_sync_car.
  // Якщо далі впаде оновлення авто, нове фото ще ніде не використовується
  // і клієнт може безпечно його видалити.
  if (newMileage > car.current_mileage) {
    const { error: mileageError } = await supabase
      .from("mileage_entries")
      .insert({ car_id: carId, mileage: newMileage, source: "manual" })
    if (mileageError) {
      console.error("updateCar mileage:", mileageError)
      return { ok: false, message: "Couldn't save the changes. Please try again." }
    }
  }

  const { error } = await supabase
    .from("cars")
    .update({ ...fields, photo_path: photoPath })
    .eq("id", carId)
  if (error) {
    console.error("updateCar:", error)
    return { ok: false, message: "Couldn't save the changes. Please try again." }
  }

  // Старе фото більше ніде не використовується
  if (photoChanged && car.photo_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([car.photo_path])
    if (removeError) console.error("updateCar remove old photo:", removeError)
  }

  revalidatePath("/", "layout")
  return { ok: true, carId }
}

// ---------------------------------------------------------------- Видалити авто
export async function deleteCar(carId: string): Promise<CarActionResult> {
  const { supabase, userId } = await getUser()
  if (!userId) return notSignedIn
  if (!carIdSchema.safeParse(carId).success) return { ok: false, message: "Invalid car id." }

  // Записи ТО, заправки, витрати й пробіг видаляються каскадно (on delete cascade)
  const { data: deleted, error } = await supabase
    .from("cars")
    .delete()
    .eq("id", carId)
    .select("id")
  if (error || !deleted?.length) {
    if (error) console.error("deleteCar:", error)
    return { ok: false, message: "Couldn't delete the car. Please try again." }
  }

  // Усі файли авто в Storage: <user_id>/<car_id>/*
  const folder = `${userId}/${carId}`
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 1000 })
  if (listError) console.error("deleteCar list photos:", listError)
  if (files?.length) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(files.map((f) => `${folder}/${f.name}`))
    if (removeError) console.error("deleteCar remove photos:", removeError)
  }

  const cookieStore = await cookies()
  if (cookieStore.get(ACTIVE_CAR_COOKIE)?.value === carId) cookieStore.delete(ACTIVE_CAR_COOKIE)

  revalidatePath("/", "layout")
  return { ok: true, carId }
}

// ---------------------------------------------------------------- Активне авто
export async function setActiveCar(carId: string): Promise<CarActionResult> {
  const { supabase, userId } = await getUser()
  if (!userId) return notSignedIn
  if (!carIdSchema.safeParse(carId).success) return { ok: false, message: "Invalid car id." }

  // RLS поверне рядок лише для власного авто
  const { data: car } = await supabase.from("cars").select("id").eq("id", carId).maybeSingle()
  if (!car) return { ok: false, message: "This car doesn't exist or was deleted." }

  await setActiveCookie(carId)
  revalidatePath("/", "layout")
  return { ok: true, carId }
}
