import { z } from "zod"

const intervalKm = z
  .number({ error: "Enter kilometres" })
  .int("Use whole kilometres")
  .min(100, "At least 100 km")
  .max(1_000_000, "At most 1 000 000 km")
  .nullable()

const intervalMonths = z
  .number({ error: "Enter months" })
  .int("Use whole months")
  .min(1, "At least 1 month")
  .max(240, "At most 240 months")
  .nullable()

const atLeastOne = (d: { interval_km: number | null; interval_months: number | null }) =>
  d.interval_km != null || d.interval_months != null
const atLeastOneError = { message: "Set a distance or a time interval", path: ["interval_km"] }

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
    name: z.string().trim().min(1, "Enter a name").max(100, "At most 100 characters"),
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
