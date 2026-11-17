import { cache } from "react"

import { getSignedUrls } from "@/lib/cars/photos"
import { todayInKyiv } from "@/lib/dates"
import { createClient } from "@/lib/supabase/server"
import { documentStatus, sortDocuments, type DocumentStatus, type DocumentType } from "./status"

export type CarDocument = {
  id: string
  type: DocumentType
  title: string | null
  number: string | null
  issued_by: string | null
  start_date: string | null
  expiry_date: string | null
  cost: number | null
  file_path: string | null
  remind_days: number | null
  note: string | null
  status: DocumentStatus
  daysLeft: number | null
}

const COLUMNS = "id, type, title, number, issued_by, start_date, expiry_date, cost, file_path, remind_days, note"

/** Документи авто зі статусом, у порядку: прострочені → скоро → дійсні → безстрокові. */
export const getCarDocuments = cache(async (carId: string): Promise<CarDocument[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("car_documents").select(COLUMNS).eq("car_id", carId)
  if (error) throw new Error(`Failed to load documents: ${error.message}`)
  const today = todayInKyiv()
  return sortDocuments(
    data.map((d) => ({
      ...d,
      cost: d.cost == null ? null : Number(d.cost),
      ...documentStatus({ expiryDate: d.expiry_date, remindDays: d.remind_days, today }),
    }))
  )
})

/** Signed URL файлів документів (відкриваються в новій вкладці). */
export const getDocumentFileUrls = (docs: Pick<CarDocument, "file_path">[]) =>
  getSignedUrls(
    "documents",
    docs.map((d) => d.file_path)
  )

/** Документи, що потребують уваги: прострочені й ті, що скоро закінчуються. */
export const getDocumentAlerts = cache(async (carId: string) =>
  (await getCarDocuments(carId)).filter((d) => d.status === "expired" || d.status === "expiring")
)
