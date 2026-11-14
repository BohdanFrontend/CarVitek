import { z } from "zod"

import { EXPENSE_CATEGORIES } from "@/lib/stats/categories"
import { mileageNumber, moneyNumber, optionalText, pastDate } from "./common"

/** Інша витрата (страховка, мийка, штраф…). Пробіг — необов'язковий. */
export const expenseSchema = z.object({
  spent_at: pastDate,
  category: z.enum(EXPENSE_CATEGORIES, { error: "Choose a category" }),
  amount: moneyNumber.refine((v) => v > 0, { message: "Amount must be greater than 0" }),
  mileage: mileageNumber.nullable(),
  comment: optionalText(500),
})

export type ExpenseInput = z.input<typeof expenseSchema>
