import { createClient } from "@/lib/supabase/server"

/**
 * Клієнт Supabase і id поточного користувача (перевірка JWT) для Server Actions.
 * Явно перевіряє, що авто належить користувачу (на додачу до RLS).
 */
export async function getActionContext(carId?: string) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { supabase, userId: null, car: null } as const

  if (!carId) return { supabase, userId, car: null } as const
  const { data: car } = await supabase
    .from("cars")
    .select("id, owner_id, current_mileage, engine_type")
    .eq("id", carId)
    .maybeSingle()
  return { supabase, userId, car: car && car.owner_id === userId ? car : null } as const
}

export type FieldErrors = Record<string, string[] | undefined>
export type MutationResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors }

export const NOT_SIGNED_IN = { ok: false, message: "You're not signed in." } as const
export const CAR_NOT_FOUND = { ok: false, message: "This car doesn't exist or was deleted." } as const

/** Чи шлях файлу лежить у теці користувача і авто: <user_id>/<car_id>/<файл>. */
export function isOwnedPath(path: string, userId: string, carId: string) {
  const prefix = `${userId}/${carId}/`
  return path.startsWith(prefix) && path.length > prefix.length && !path.includes("..")
}
