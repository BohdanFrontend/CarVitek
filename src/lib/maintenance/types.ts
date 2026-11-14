import { cache } from "react"

import type { Enums } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { maintenanceName } from "./names"

export type MaintenanceType = {
  id: string
  code: string | null
  /** Назва для інтерфейсу (англійська для системних типів) */
  name: string
  interval_km: number | null
  interval_months: number | null
  engine_types: Enums<"engine_type">[] | null
  sort_order: number
  /** Власний тип користувача (owner_id не NULL) */
  isCustom: boolean
}

/** Довідник робіт: системні + власні типи користувача (RLS), з англійськими назвами. */
export const getMaintenanceTypes = cache(async (): Promise<MaintenanceType[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("maintenance_types")
    .select("id, code, name, interval_km, interval_months, engine_types, sort_order, owner_id")
    .order("sort_order")
    .order("name")
  if (error) throw new Error(`Failed to load maintenance types: ${error.message}`)
  return data.map(({ owner_id, ...t }) => ({
    ...t,
    name: maintenanceName(t.code, t.name),
    isCustom: owner_id != null,
  }))
})

/** Роботи, що підходять для двигуна авто (engine_types NULL = для всіх). */
export const typesForEngine = (types: MaintenanceType[], engine: Enums<"engine_type">) =>
  types.filter((t) => t.engine_types == null || t.engine_types.includes(engine))
