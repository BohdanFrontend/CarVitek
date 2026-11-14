import type { Metadata } from "next"

import { NoCarState } from "@/components/common/empty-state"
import { LoadMore, parseLimit } from "@/components/common/load-more"
import { FuelLog } from "@/components/fuel/fuel-log"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getFuelLog } from "@/lib/fuel/queries"

export const metadata: Metadata = { title: "Fuel Log" }

export default async function FuelPage({ searchParams }: PageProps<"/fuel">) {
  const sp = await searchParams
  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCarState title="Fuel Log" what="fuel consumption" />

  const limit = parseLimit(sp.limit)
  const log = await getFuelLog(activeCar.id, limit)

  return (
    <FuelLog
      carId={activeCar.id}
      carLabel={carLabel(activeCar)}
      unit={activeCar.engine_type === "electric" ? "kWh" : "L"}
      currentMileage={activeCar.current_mileage}
      rows={log.rows}
      total={log.total}
      average={log.average}
      chart={log.chart}
      history={log.history}
      loadMore={<LoadMore hasMore={log.hasMore} limit={limit} params={{}} />}
    />
  )
}
