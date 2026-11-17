import type { Enums } from "@/lib/supabase/database.types"

export type EngineType = Enums<"engine_type">

export const ENGINE_TYPES = ["petrol", "diesel", "lpg", "hybrid", "electric"] as const satisfies readonly EngineType[]

/** "Volkswagen Golf" */
export const carName = (car: { make: string; model: string }) => `${car.make} ${car.model}`

/** "Volkswagen Golf, 2016" — для селектора активного авто */
export const carLabel = (car: { make: string; model: string; year: number | null }) =>
  car.year ? `${carName(car)}, ${car.year}` : carName(car)
