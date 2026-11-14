import { CalendarClock, Info, SlidersHorizontal } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { secondaryButtonClass } from "@/components/common/buttons"
import { EmptyState, NoCarState } from "@/components/common/empty-state"
import { FilterChips } from "@/components/common/filter-chips"
import { PageHeader } from "@/components/common/page-header"
import { STATUS_STYLES } from "@/components/maintenance/status-badge"
import { PlanItemCard } from "@/components/planner/plan-item-card"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getMaintenancePlan, getMileageEntries } from "@/lib/dashboard/get-dashboard-data"
import { todayInKyiv } from "@/lib/dates"
import { averageKmPerDayDetailed, planSummary, type MaintenanceStatus } from "@/lib/maintenance/plan"

export const metadata: Metadata = { title: "Maintenance Planner" }

const FILTERS: { value: MaintenanceStatus; label: string }[] = [
  { value: "overdue", label: "Overdue" },
  { value: "soon", label: "Due soon" },
  { value: "ok", label: "On track" },
  { value: "no_data", label: "No data" },
]

export default async function PlannerPage({ searchParams }: PageProps<"/planner">) {
  const { status } = await searchParams
  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCarState title="Maintenance Planner" what="maintenance schedule" />

  const today = todayInKyiv()
  const [plan, entries] = await Promise.all([getMaintenancePlan(activeCar.id), getMileageEntries(activeCar.id)])
  const summary = planSummary(plan)
  const avg = averageKmPerDayDetailed(entries, today)

  const filter = FILTERS.find((f) => f.value === status)?.value ?? null
  const items = filter ? plan.filter((i) => i.status === filter) : plan

  const summaryParts = [
    { count: summary.overdue, label: "overdue", status: "overdue" as const },
    { count: summary.soon, label: "due soon", status: "soon" as const },
    { count: summary.ok, label: "on track", status: "ok" as const },
    { count: summary.noData, label: "no data", status: "no_data" as const },
  ].filter((p) => p.count > 0)

  return (
    <div>
      <PageHeader
        title="Maintenance Planner"
        description={carLabel(activeCar)}
        action={
          <Link href="/planner/intervals" className={secondaryButtonClass}>
            <SlidersHorizontal className="size-4.5" aria-hidden />
            Edit intervals
          </Link>
        }
      />

      {summaryParts.length > 0 && (
        <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold text-[#0B1220]">
          {summaryParts.map((p, i) => (
            <span key={p.status} className="inline-flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-[#CBD5E1]">·</span>}
              <span aria-hidden className={`size-2.5 rounded-full ${STATUS_STYLES[p.status].dot}`} />
              {p.count} {p.label}
            </span>
          ))}
        </p>
      )}

      <div className="mb-4">
        <FilterChips
          label="Filter by status"
          param="status"
          active={filter}
          options={[{ value: null, label: "All" }, ...FILTERS]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={plan.length === 0 ? "No maintenance tasks" : "Nothing here"}
          description={
            plan.length === 0
              ? "All tasks are turned off for this car. Turn them back on in Edit intervals."
              : "No tasks with this status right now."
          }
        />
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2 xl:gap-4">
          {items.map((item) => (
            <PlanItemCard key={item.typeId} item={item} currentMileage={activeCar.current_mileage} today={today} />
          ))}
        </ul>
      )}

      <p className="mt-6 flex items-start gap-2 text-sm text-[#5B6475]">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {avg
          ? `Forecast uses your average of ${Math.round(avg.kmPerDay)} km/day ${
              avg.basis === "last90days" ? "over the last 90 days" : "over your whole mileage history"
            }.`
          : "Not enough mileage history for a date forecast — dates are based on time intervals only."}
      </p>
    </div>
  )
}
