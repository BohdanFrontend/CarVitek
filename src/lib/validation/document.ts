import { z } from "zod"

import { DOCUMENT_TYPES } from "@/lib/documents/status"
import { MAX_MONEY, optionalText } from "./common"

export const REMIND_OPTIONS = [7, 14, 30, 60] as const

/** Необов'язкова дата "YYYY-MM-DD": порожньо → null. */
const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= "1950-01-01" && v <= "2100-12-31"), {
    message: "validation.selectDate",
  })
  .transform((v) => v || null)

/** Необов'язкова вартість: "1 250,50" → 1250.5; порожньо → null. */
const optionalCost = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, "").replace(",", "."))
  .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), { message: "validation.amountFormat" })
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v == null || v <= MAX_MONEY, { message: "validation.amountTooLarge" })

/**
 * Документ авто. Поля форми — рядки; на виході — значення для БД.
 * Для «Other» назва обов'язкова; дата закінчення обов'язкова для всіх, крім техпаспорта.
 */
export const documentSchema = z
  .object({
    type: z.enum(DOCUMENT_TYPES, { error: "validation.chooseDocType" }),
    title: optionalText(100),
    number: optionalText(50),
    issued_by: optionalText(100),
    start_date: optionalDate,
    expiry_date: optionalDate,
    cost: optionalCost,
    remind: z.boolean(),
    remind_days: z.enum(["7", "14", "30", "60"]),
    note: optionalText(1000),
  })
  .superRefine((d, ctx) => {
    if (d.type === "other" && !d.title) ctx.addIssue({ code: "custom", path: ["title"], message: "validation.enterTitle" })
    if (d.type !== "registration" && !d.expiry_date) {
      ctx.addIssue({ code: "custom", path: ["expiry_date"], message: "validation.expiryRequired" })
    }
    if (d.start_date && d.expiry_date && d.expiry_date < d.start_date) {
      ctx.addIssue({ code: "custom", path: ["expiry_date"], message: "validation.expiryBeforeStart" })
    }
  })
  .transform(({ remind, remind_days, ...d }) => ({
    ...d,
    title: d.type === "other" ? d.title : null,
    remind_days: remind ? Number(remind_days) : null,
  }))

export type DocumentFormValues = z.input<typeof documentSchema>
export type DocumentData = z.output<typeof documentSchema>
