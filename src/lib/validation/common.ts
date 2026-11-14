import { z } from "zod"

import { todayInKyiv } from "@/lib/dates"
import { formatKm } from "@/lib/format"
import { MAX_MILEAGE } from "@/lib/validation/car"

export const MAX_MONEY = 99_999_999.99

/** Дата "YYYY-MM-DD", не в майбутньому (за київським часом). */
export const pastDate = z
  .string({ error: "Select a date" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a date")
  .refine((v) => v <= todayInKyiv(), { message: "Date can't be in the future" })
  .refine((v) => v >= "1950-01-01", { message: "Date is too far in the past" })

export const mileageNumber = z
  .number({ error: "Enter the mileage" })
  .int("Mileage must be a whole number")
  .min(0, "Mileage can't be negative")
  .max(MAX_MILEAGE, `At most ${formatKm(MAX_MILEAGE)}`)

export const moneyNumber = z
  .number({ error: "Enter an amount" })
  .min(0, "Amount can't be negative")
  .max(MAX_MONEY, "Amount is too large")
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, {
    message: "At most 2 decimal places",
  })

/** Поле форми з пробігом (рядок → число). */
export const mileageString = z
  .string()
  .trim()
  .min(1, "Enter the mileage")
  .regex(/^\d+$/, "Use digits only")
  .transform(Number)
  .pipe(mileageNumber)

/** Поле форми з сумою: "60", "60.5", "60,50" → число; порожнє → 0 (якщо optional). */
export const moneyString = ({ required = false }: { required?: boolean } = {}) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => (required ? v !== "" : true), { message: "Enter an amount" })
    .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), {
      message: "Enter an amount like 60.50",
    })
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(moneyNumber)

/** Необов'язковий текст: порожній рядок → null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `At most ${max} characters`)
    .transform((v) => v || null)
