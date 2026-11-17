import { z } from "zod"

import { msg } from "@/i18n/messages"

const intervalKm = z
  .number({ error: "validation.enterKm" })
  .int("validation.wholeKm")
  .min(100, msg("validation.kmMin", { km: 100 }))
  .max(1_000_000, msg("validation.mileageMax", { km: 1_000_000 }))
  .nullable()

const intervalMonths = z
  .number({ error: "validation.enterMonths" })
  .int("validation.wholeMonths")
  .min(1, "validation.monthsMin")
  .max(240, "validation.monthsMax")
  .nullable()

const atLeastOne = (d: { interval_km: number | null; interval_months: number | null }) =>
  d.interval_km != null || d.interval_months != null
const atLeastOneError = { message: "validation.intervalRequired", path: ["interval_km"] }

/**
 * Індивідуальний інтервал роботи для авто. NULL = «як у довіднику» (так задано схемою БД),
 * тож порожнє поле означає типове значення; хоча б один інтервал гарантує сам довідник.
 */
export const intervalRuleSchema = z.object({
  interval_km: intervalKm,
  interval_months: intervalMonths,
  is_enabled: z.boolean(),
})

export type IntervalRuleInput = z.input<typeof intervalRuleSchema>

/** Власна робота користувача. */
export const customTaskSchema = z
  .object({
    name: z.string().trim().min(1, "validation.enterName").max(100, msg("validation.maxChars", { max: 100 })),
    interval_km: intervalKm,
    interval_months: intervalMonths,
  })
  .refine(atLeastOne, atLeastOneError)

export type CustomTaskInput = z.input<typeof customTaskSchema>

/** "10000" → 10000, "" → null, інше → NaN (зловить zod). */
export const optionalIntFromString = (v: string) => {
  const t = v.trim().replace(/\s/g, "")
  return t === "" ? null : /^\d+$/.test(t) ? Number(t) : Number.NaN
}
