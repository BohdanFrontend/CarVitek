import type { Enums } from "@/lib/supabase/database.types"

export type EngineType = Enums<"engine_type">

export const ENGINE_TYPES = ["petrol", "diesel", "lpg", "hybrid", "electric"] as const satisfies readonly EngineType[]

export const ENGINE_LABELS: Record<EngineType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  lpg: "LPG",
  hybrid: "Hybrid",
  electric: "Electric",
}

/** 93000 → "93 000 km" (тисячі через нерозривний пробіл, щоб число не переносилось). */
export function formatMileage(km: number, withUnit = true) {
  const digits = Math.round(km)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return withUnit ? `${digits} km` : digits
}

/** "Volkswagen Golf" */
export const carName = (car: { make: string; model: string }) => `${car.make} ${car.model}`

/** "Volkswagen Golf, 2016" — для селектора активного авто */
export const carLabel = (car: { make: string; model: string; year: number | null }) =>
  car.year ? `${carName(car)}, ${car.year}` : carName(car)
