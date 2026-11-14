import { z } from "zod"

import { ENGINE_TYPES, formatMileage } from "@/lib/cars/format"

export const MIN_YEAR = 1950
export const MAX_MILEAGE = 2_000_000
export const maxCarYear = () => new Date().getFullYear() + 1

/** 17 символів, латиниця без I, O, Q і цифри (стандарт ISO 3779). */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/

const make = z
  .string()
  .trim()
  .min(1, "Enter the make")
  .max(50, "At most 50 characters")
const model = z
  .string()
  .trim()
  .min(1, "Enter the model")
  .max(50, "At most 50 characters")
const year = z
  .number({ error: "Select a year" })
  .int("Select a year")
  .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later`)
  .refine((y) => y <= maxCarYear(), { message: "Year can't be in the future" })
const engineType = z.enum(ENGINE_TYPES, { error: "Choose an engine type" })
const mileage = z
  .number({ error: "Enter the current mileage" })
  .int("Mileage must be a whole number")
  .min(0, "Mileage can't be negative")
  .max(MAX_MILEAGE, `At most ${formatMileage(MAX_MILEAGE)}`)
const plate = z
  .string()
  .trim()
  .max(15, "At most 15 characters")
  .transform((v) => v || null)
const vin = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => v === "" || VIN_REGEX.test(v), {
    message: "VIN must be 17 characters: digits and letters except I, O, Q",
  })
  .transform((v) => v || null)

/** Дані авто, як їх приймає сервер (Server Actions). */
export const carSchema = z.object({
  make,
  model,
  year,
  engine_type: engineType,
  current_mileage: mileage,
  plate_number: plate,
  vin,
})

export type CarInput = z.input<typeof carSchema>
export type CarData = z.output<typeof carSchema>

/**
 * Схема форми: рік і пробіг у полях — рядки, тож перетворюємо їх на числа
 * і далі перевіряємо тими самими правилами, що й на сервері.
 */
export const carFormSchema = carSchema.extend({
  year: z.string().min(1, "Select a year").transform(Number).pipe(year),
  current_mileage: z
    .string()
    .trim()
    .min(1, "Enter the current mileage")
    .regex(/^\d+$/, "Use digits only")
    .transform(Number)
    .pipe(mileage),
})

export type CarFormValues = z.input<typeof carFormSchema>

export const mileageTooLowMessage = (current: number) =>
  `Mileage can't be lower than the current value (${formatMileage(current)})`
