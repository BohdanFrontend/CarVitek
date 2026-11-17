import { CalendarClock, Info, SlidersHorizontal } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { secondaryButtonClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { NoCarState } from "@/components/common/no-car-state"
import { FilterChips } from "@/components/common/filter-chips"
import { PageHeader } from "@/components/common/page-header"
import { STATUS_STYLES } from "@/components/maintenance/status-badge"
import { PlanItemCard } from "@/components/planner/plan-item-card"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getMaintenancePlan, getMileageEntries } from "@/lib/dashboard/get-dashboard-data"
import { getFormat } from "@/i18n/format-server"
import { todayInKyiv } from "@/lib/dates"
import { averageKmPerDayDetailed, planSummary, type MaintenanceStatus } from "@/lib/maintenance/plan"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("planner"))("title") }
}

const FILTERS: MaintenanceStatus[] = ["overdue", "soon", "ok", "no_data"]

export default async function PlannerPage({ searchParams }: PageProps<"/planner">) {
  const { status } = await searchParams
  const [{ activeCar }, t, f] = await Promise.all([getActiveCar(), getTranslations("planner"), getFormat()])
  if (!activeCar) return <NoCarState title={t("title")} what={t("noCarWhat")} />

  const today = todayInKyiv()
  const [plan, entries] = await Promise.all([getMaintenancePlan(activeCar.id), getMileageEntries(activeCar.id)])
  const summary = planSummary(plan)
  const avg = averageKmPerDayDetailed(entries, today)

  const filter = FILTERS.find((s) => s === status) ?? null
  const items = filter ? plan.filter((i) => i.status === filter) : plan

  const summaryParts = [
    { count: summary.overdue, status: "overdue" as const },
    { count: summary.soon, status: "soon" as const },
    { count: summary.ok, status: "ok" as const },
    { count: summary.noData, status: "no_data" as const },
  ].filter((p) => p.count > 0)

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={carLabel(activeCar)}
        action={
          <Link href="/planner/intervals" className={secondaryButtonClass}>
            <SlidersHorizontal className="size-4.5" aria-hidden />
            {t("editIntervals")}
          </Link>
        }
      />

      {summaryParts.length > 0 && (
        <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold text-[#0B1220]">
          {summaryParts.map((p, i) => (
            <span key={p.status} className="inline-flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-[#CBD5E1]">·</span>}
              <span aria-hidden className={`size-2.5 rounded-full ${STATUS_STYLES[p.status].dot}`} />
              {t(`summary.${p.status}`, { count: p.count })}
            </span>
          ))}
        </p>
      )}

      <div className="mb-4">
        <FilterChips
          label={t("filterLabel")}
          param="status"
          active={filter}
          options={[{ value: null, label: t("all") }, ...FILTERS.map((s) => ({ value: s, label: t(`status.${s}`) }))]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={plan.length === 0 ? t("noTasksTitle") : t("nothingHereTitle")}
          description={plan.length === 0 ? t("noTasksText") : t("nothingHereText")}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:gap-4">
          {items.map((item) => (
            <PlanItemCard key={item.typeId} item={item} currentMileage={activeCar.current_mileage} today={today} />
          ))}
        </ul>
      )}

      <p className="mt-6 flex items-start gap-2 text-sm text-[#5B6475]">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {avg
          ? t(avg.basis === "last90days" ? "forecastNote90" : "forecastNoteAll", { km: f.km(avg.kmPerDay) })
          : t("forecastNoteNone")}
      </p>
    </div>
  )
}
