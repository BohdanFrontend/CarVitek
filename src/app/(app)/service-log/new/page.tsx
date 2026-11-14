import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { BackLink } from "@/components/common/back-link"
import { NoCarState } from "@/components/common/empty-state"
import { ServiceRecordForm } from "@/components/service-log/service-record-form"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getMaintenanceTypes, typesForEngine } from "@/lib/maintenance/types"
import { getStationSuggestions } from "@/lib/service-log/queries"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Add service record" }

export default async function NewServiceRecordPage({ searchParams }: PageProps<"/service-log/new">) {
  const { type } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect("/login")

  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCarState title="Add service record" what="service history" />

  const [types, stations] = await Promise.all([getMaintenanceTypes(), getStationSuggestions()])
  const workTypes = typesForEngine(types, activeCar.engine_type).map(({ id, code, name }) => ({ id, code, name }))
  // ?type=<id> з планувальника («Mark as done»): лише якщо така робота доступна для авто
  const presetTypeId = typeof type === "string" && workTypes.some((t) => t.id === type) ? type : undefined

  return (
    <div className="mx-auto max-w-[880px] 3xl:max-w-[1040px]">
      <BackLink href="/service-log" label="Back to Service Log" />
      <ServiceRecordForm
        userId={userId}
        car={{ id: activeCar.id, label: carLabel(activeCar), current_mileage: activeCar.current_mileage }}
        workTypes={workTypes}
        stations={stations}
        presetTypeId={presetTypeId}
      />
    </div>
  )
}
