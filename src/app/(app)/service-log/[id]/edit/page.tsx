import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { z } from "zod"

import { BackLink } from "@/components/common/back-link"
import { ServiceRecordForm } from "@/components/service-log/service-record-form"
import { getUserCars } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getSignedUrls } from "@/lib/cars/photos"
import { getMaintenanceTypes, typesForEngine } from "@/lib/maintenance/types"
import { getServiceRecord, getStationSuggestions } from "@/lib/service-log/queries"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Edit service record" }

export default async function EditServiceRecordPage({ params }: PageProps<"/service-log/[id]/edit">) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect("/login")

  // RLS поверне запис лише власнику авто; авто запису може бути й не активним
  const [record, cars, types, stations] = await Promise.all([
    getServiceRecord(id),
    getUserCars(),
    getMaintenanceTypes(),
    getStationSuggestions(),
  ])
  const car = record && cars.find((c) => c.id === record.car_id)
  if (!record || !car) notFound()

  const recordTypeIds = record.service_record_items.map((i) => i.maintenance_type_id)
  // роботи для двигуна + ті, що вже є в записі (навіть якщо не підходять)
  const workTypes = types
    .filter((t) => typesForEngine([t], car.engine_type).length || recordTypeIds.includes(t.id))
    .map(({ id, code, name }) => ({ id, code, name }))
  const receiptUrl = record.receipt_path
    ? ((await getSignedUrls("receipts", [record.receipt_path])).get(record.receipt_path) ?? null)
    : null

  return (
    <div className="mx-auto max-w-[880px] 3xl:max-w-[1040px]">
      <BackLink href="/service-log" label="Back to Service Log" />
      <ServiceRecordForm
        userId={userId}
        car={{ id: car.id, label: carLabel(car), current_mileage: car.current_mileage }}
        workTypes={workTypes}
        stations={stations}
        record={{
          id: record.id,
          performed_at: record.performed_at,
          mileage: record.mileage,
          type_ids: recordTypeIds,
          labor_cost: Number(record.labor_cost),
          parts_cost: Number(record.parts_cost),
          service_station: record.service_station,
          comment: record.comment,
          receipt_path: record.receipt_path,
          receiptUrl,
        }}
      />
    </div>
  )
}
