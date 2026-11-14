import { Car, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { HeroCard } from "@/components/dashboard/hero-card"
import { SparklineBars } from "@/components/dashboard/sparkline-bars"
import { SparklineLine } from "@/components/dashboard/sparkline-line"
import { StatCard } from "@/components/dashboard/stat-card"
import { UpcomingMaintenance } from "@/components/dashboard/upcoming-maintenance"
import { dashboardCardClass } from "@/components/dashboard/card-styles"
import { getActiveCar } from "@/lib/cars/active-car"
import { getCarPhotoUrls } from "@/lib/cars/photos"
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data"
import { todayInKyiv } from "@/lib/dates"
import { formatMoney } from "@/lib/format"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCars />

  const [data, photoUrls] = await Promise.all([
    getDashboardData(activeCar),
    getCarPhotoUrls([activeCar.photo_path]),
  ])
  const photoUrl = activeCar.photo_path ? (photoUrls.get(activeCar.photo_path) ?? null) : null
  const electric = activeCar.engine_type === "electric"

  const hasSpending = data.monthlySeries.some((m) => m.total > 0)
  const change =
    data.spentPrevMonth > 0
      ? Math.round(((data.spentThisMonth - data.spentPrevMonth) / data.spentPrevMonth) * 100)
      : null

  return (
    <div className="grid gap-4 lg:gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12">
      <h1 className="sr-only">Dashboard</h1>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12">
        <HeroCard car={activeCar} photoUrl={photoUrl} avgConsumption={data.avgConsumption} />
        <UpcomingMaintenance plan={data.plan} today={todayInKyiv()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12">
        <StatCard
          title="Spent this month"
          value={hasSpending ? formatMoney(data.spentThisMonth) : null}
          sub={change != null && <SpendingChange percent={change} />}
          chart={<SparklineBars values={data.monthlySeries.map((m) => m.total)} color="#5B8DEF" />}
          chartLabel="Monthly spending over the last 8 months"
          emptyHint="Add fuel, service or expense records"
        />
        <StatCard
          title="Fuel consumption"
          value={
            !electric && data.avgConsumption != null ? (
              <>
                {data.avgConsumption.toFixed(1)}
                <span className="ml-1.5 text-lg font-semibold 3xl:text-2xl 4xl:text-[28px]">L/100 km</span>
              </>
            ) : null
          }
          chart={
            data.consumptionSeries.length >= 2 ? (
              <SparklineLine values={data.consumptionSeries} color="#10B981" />
            ) : undefined
          }
          chartLabel="Fuel consumption for recent full-tank refills"
          emptyHint={
            electric
              ? "Fuel consumption isn't tracked for electric cars"
              : "Add at least two full-tank fuel records"
          }
        />
        <StatCard
          title="Cost per 1 km"
          // без витрат «₴ 0.00» вводить в оману — показуємо порожній стан
          value={hasSpending && data.costPerKm != null ? formatMoney(data.costPerKm) : null}
          chart={<SparklineBars values={data.costPerKmSeries} color="#8B5CF6" />}
          chartLabel="Cost per kilometre by month over the last 8 months"
          emptyHint="Add expenses and keep your mileage up to date"
        />
      </div>
    </div>
  )
}

/** Зміна витрат до минулого місяця: зросли — червоним, зменшились — зеленим. */
function SpendingChange({ percent }: { percent: number }) {
  if (percent === 0) return <span className="text-[#5B6475]">Same as last month</span>
  const up = percent > 0
  return (
    <span className={up ? "text-[#DC2626]" : "text-[#16A34A]"}>
      <span aria-hidden>{up ? "↑" : "↓"} </span>
      {up ? "+" : "−"}
      {Math.abs(percent)}%<span className="sr-only"> vs last month</span>
    </span>
  )
}

function NoCars() {
  return (
    <div className={`${dashboardCardClass} flex flex-col items-center px-6 py-16 text-center lg:py-20`}>
      <h1 className="sr-only">Dashboard</h1>
      <span className="grid size-20 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
        <Car className="size-9" strokeWidth={1.8} aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-bold text-[#0B1220]">Add your first car</h2>
      <p className="mt-1.5 max-w-sm text-[15px] text-[#5B6475]">
        Your dashboard will show mileage, upcoming maintenance and spending once you add a car
      </p>
      <Link
        href="/garage/new"
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#1766F2] px-6 text-base font-semibold text-white transition-colors outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
      >
        <Plus className="size-5" aria-hidden />
        Add car
      </Link>
    </div>
  )
}
