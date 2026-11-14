import { cookies } from "next/headers"
import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type Car = Tables<"cars">

export const ACTIVE_CAR_COOKIE = "cv_active_car"

export const activeCarCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 рік
} as const

/**
 * Авто поточного користувача (RLS віддає лише власні), від найстарішого.
 * cache() — щоб layout і сторінка в межах одного запиту ходили в БД один раз.
 */
export const getUserCars = cache(async (): Promise<Car[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw new Error(`Failed to load cars: ${error.message}`)
  return data
})

/**
 * Активне авто: з cookie cv_active_car, якщо воно належить користувачу,
 * інакше — перше додане. null, якщо авто ще немає.
 */
export const getActiveCar = cache(async () => {
  const [cars, cookieStore] = await Promise.all([getUserCars(), cookies()])
  const id = cookieStore.get(ACTIVE_CAR_COOKIE)?.value
  const activeCar = cars.find((c) => c.id === id) ?? cars[0] ?? null
  return { cars, activeCar }
})
