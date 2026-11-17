import { z } from "zod"

import { todayInKyiv } from "@/lib/dates"
import { msg } from "@/i18n/messages"
import { MAX_MILEAGE } from "@/lib/validation/car"

export const MAX_MONEY = 99_999_999.99

/** Дата "YYYY-MM-DD", не в майбутньому (за київським часом). */
export const pastDate = z
  .string({ error: "validation.selectDate" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "validation.selectDate")
  .refine((v) => v <= todayInKyiv(), { message: "validation.dateFuture" })
  .refine((v) => v >= "1950-01-01", { message: "validation.datePast" })

export const mileageNumber = z
  .number({ error: "validation.enterMileage" })
  .int("validation.mileageWhole")
  .min(0, "validation.mileageNegative")
  .max(MAX_MILEAGE, msg("validation.mileageMax", { km: MAX_MILEAGE }))

export const moneyNumber = z
  .number({ error: "validation.enterAmount" })
  .min(0, "validation.amountNegative")
  .max(MAX_MONEY, "validation.amountTooLarge")
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, {
    message: "validation.twoDecimals",
  })

/** Поле форми з пробігом (рядок → число). */
export const mileageString = z
  .string()
  .trim()
  .min(1, "validation.enterMileage")
  .regex(/^\d+$/, "validation.digitsOnly")
  .transform(Number)
  .pipe(mileageNumber)

/** Поле форми з сумою: "60", "60.5", "60,50" → число; порожнє → 0 (якщо optional). */
export const moneyString = ({ required = false }: { required?: boolean } = {}) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => (required ? v !== "" : true), { message: "validation.enterAmount" })
    .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), {
      message: "validation.amountFormat",
    })
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(moneyNumber)

/** Необов'язковий текст: порожній рядок → null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, msg("validation.maxChars", { max }))
    .transform((v) => v || null)
