import { z } from "zod"

import { msg } from "@/i18n/messages"
import { ENGINE_TYPES } from "@/lib/cars/format"

export const MIN_YEAR = 1950
export const MAX_MILEAGE = 2_000_000
export const maxCarYear = () => new Date().getFullYear() + 1

/** 17 символів, латиниця без I, O, Q і цифри (стандарт ISO 3779). */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/

const make = z
  .string()
  .trim()
  .min(1, "validation.enterMake")
  .max(50, msg("validation.maxChars", { max: 50 }))
const model = z
  .string()
  .trim()
  .min(1, "validation.enterModel")
  .max(50, msg("validation.maxChars", { max: 50 }))
const year = z
  .number({ error: "validation.selectYear" })
  .int("validation.selectYear")
  .min(MIN_YEAR, msg("validation.yearMin", { year: String(MIN_YEAR) }))
  .refine((y) => y <= maxCarYear(), { message: "validation.yearFuture" })
const engineType = z.enum(ENGINE_TYPES, { error: "validation.chooseEngine" })
const mileage = z
  .number({ error: "validation.enterCurrentMileage" })
  .int("validation.mileageWhole")
  .min(0, "validation.mileageNegative")
  .max(MAX_MILEAGE, msg("validation.mileageMax", { km: MAX_MILEAGE }))
const plate = z
  .string()
  .trim()
  .max(15, msg("validation.maxChars", { max: 15 }))
  .transform((v) => v || null)
const vin = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => v === "" || VIN_REGEX.test(v), {
    message: "validation.vinFormat",
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
  year: z.string().min(1, "validation.selectYear").transform(Number).pipe(year),
  current_mileage: z
    .string()
    .trim()
    .min(1, "validation.enterCurrentMileage")
    .regex(/^\d+$/, "validation.digitsOnly")
    .transform(Number)
    .pipe(mileage),
})

export type CarFormValues = z.input<typeof carFormSchema>

export const mileageTooLowMessage = (current: number) =>
  msg("validation.mileageTooLow", { km: current })
