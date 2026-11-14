import { z } from "zod"

import { mileageNumber, optionalText, pastDate } from "./common"

const twoDecimals = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6

/** Заправка (або зарядка електромобіля — тоді «літри» це кВт·год). */
export const fuelRecordSchema = z.object({
  filled_at: pastDate,
  mileage: mileageNumber,
  liters: z
    .number({ error: "Enter the amount" })
    .gt(0, "Amount must be greater than 0")
    .max(1000, "At most 1000")
    .refine(twoDecimals, { message: "At most 2 decimal places" }),
  price_per_liter: z
    .number({ error: "Enter the price" })
    .min(0, "Price can't be negative")
    .max(10_000, "Price is too large")
    .refine(twoDecimals, { message: "At most 2 decimal places" }),
  is_full_tank: z.boolean(),
  station: optionalText(120),
})

export type FuelRecordInput = z.input<typeof fuelRecordSchema>
export type FuelRecordData = z.output<typeof fuelRecordSchema>

/** "45,5" → 45.5; "" → NaN (тоді zod покаже «Enter …»). */
export const decimalFromString = (v: string) => {
  const t = v.trim().replace(",", ".")
  return t === "" || !/^\d+(\.\d+)?$/.test(t) ? Number.NaN : Number(t)
}

/** Ціна з суми: total / amount, округлена до копійок. */
export const priceFromTotal = (total: number, amount: number) =>
  amount > 0 ? Math.round((total / amount) * 100) / 100 : Number.NaN

/** Сума з ціни (як рахує БД: round(liters × price, 2)). */
export const totalFromPrice = (price: number, amount: number) => Math.round(amount * price * 100) / 100
