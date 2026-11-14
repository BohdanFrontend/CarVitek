import { z } from "zod"

import {
  mileageNumber,
  mileageString,
  moneyNumber,
  moneyString,
  optionalText,
  pastDate,
} from "./common"

const typeIds = z
  .array(z.uuid("Invalid work type"))
  .min(1, "Select at least one work type")
  .max(20, "Too many work types")

/** Запис ТО, як його приймає сервер. */
export const serviceRecordSchema = z.object({
  performed_at: pastDate,
  mileage: mileageNumber,
  type_ids: typeIds,
  labor_cost: moneyNumber,
  parts_cost: moneyNumber,
  service_station: optionalText(120),
  comment: optionalText(1000),
})

export type ServiceRecordData = z.output<typeof serviceRecordSchema>
/** Що клієнт передає в Server Action (null у текстах — це «порожньо»). */
export type ServiceRecordInput = z.input<typeof serviceRecordSchema>

/** Схема форми: пробіг і суми — рядки з полів вводу. */
export const serviceRecordFormSchema = serviceRecordSchema.extend({
  mileage: mileageString,
  labor_cost: moneyString(),
  parts_cost: moneyString(),
})

export type ServiceRecordFormValues = z.input<typeof serviceRecordFormSchema>
