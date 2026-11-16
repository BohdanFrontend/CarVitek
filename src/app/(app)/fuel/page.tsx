import type { Metadata } from "next"

import { NoCarState } from "@/components/common/empty-state"
import { LoadMore, PAGE_SIZE, parseLimit } from "@/components/common/load-more"
import { FuelLog } from "@/components/fuel/fuel-log"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { todayInKyiv } from "@/lib/dates"
import { consumptionForPeriod, type ConsumptionPeriod } from "@/lib/fuel/consumption"
import { getFuelLog } from "@/lib/fuel/queries"

export const metadata: Metadata = { title: "Fuel Log" }

const PERIODS: ConsumptionPeriod[] = ["6m", "1y", "all"]

export default async function FuelPage({ searchParams }: PageProps<"/fuel">) {
  const sp = await searchParams
  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCarState title="Fuel Log" what="fuel consumption" />

  const limit = parseLimit(sp.limit)
  const period = PERIODS.find((p) => p === sp.period) ?? "6m"
  const log = await getFuelLog(activeCar.id, limit)
  const stats = consumptionForPeriod(log.segments, period, todayInKyiv())

  return (
    <FuelLog
      carId={activeCar.id}
      carLabel={carLabel(activeCar)}
      unit={activeCar.engine_type === "electric" ? "kWh" : "L"}
      currentMileage={activeCar.current_mileage}
      rows={log.rows}
      total={log.total}
      hasSegments={log.segments.length > 0}
      period={period}
      stats={stats}
      history={log.history}
      // мобільний список — окремі картки з «Load more» на всю ширину
      loadMore={<LoadMore hasMore={log.hasMore} limit={limit} params={{ period: sp.period ? period : undefined }} />}
      nextLimitHref={log.hasMore ? `?${new URLSearchParams({ ...(sp.period ? { period } : {}), limit: String(limit + PAGE_SIZE) })}` : null}
    />
  )
}
