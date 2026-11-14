import { ChevronRight, ClipboardList, Wrench } from "lucide-react"
import Link from "next/link"
import { cn } from "cn"

import { formatDays, formatKm } from "@/lib/format"
import type { MaintenanceItem, MaintenanceStatus } from "@/lib/maintenance/plan"
import { dashboardCardClass } from "./card-styles"

const MAX_ITEMS = 3

const DOT: Record<Exclude<MaintenanceStatus, "no_data">, string> = {
  overdue: "bg-[#EF4444]",
  soon: "bg-[#F59E0B]",
  ok: "bg-[#22C55E]",
}

const STATUS_LABEL: Record<Exclude<MaintenanceStatus, "no_data">, string> = {
  overdue: "Overdue",
  soon: "Due soon",
  ok: "On track",
}

/** Текст під назвою роботи: колір крапки — не єдиний носій статусу. */
function describe(item: MaintenanceItem, today: string): string {
  const { remainingKm, daysLeft, status, dueDateByTime } = item

  if (status === "overdue") {
    if (remainingKm != null && remainingKm < 0) return `${formatKm(-remainingKm)} overdue`
    // прострочено за часом: nextDate ≤ dueDateByTime < today, тож daysLeft від'ємний
    if (dueDateByTime && dueDateByTime < today && daysLeft != null && daysLeft < 0) {
      return `${formatDays(-daysLeft)} overdue`
    }
    return "Due now"
  }

  if (remainingKm != null) {
    const km = `in ${formatKm(remainingKm)}`
    return status === "soon" && daysLeft != null ? `${km} (~${formatDays(daysLeft)})` : km
  }
  return daysLeft != null ? `due in ${formatDays(daysLeft)}` : "Scheduled"
}

export function UpcomingMaintenance({ plan, today }: { plan: MaintenanceItem[]; today: string }) {
  const tracked = plan.filter((i) => i.status !== "no_data")
  const withoutHistory = plan.length - tracked.length
  const items = tracked.slice(0, MAX_ITEMS)

  return (
    <section
      aria-labelledby="upcoming-title"
      className={cn(dashboardCardClass, "flex flex-col p-5 lg:p-6 2xl:p-8 3xl:p-10 4xl:p-12")}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="upcoming-title" className="flex items-center gap-2.5 text-xl font-bold text-[#0B1220] 2xl:text-[24px] 3xl:text-[30px] 4xl:text-[34px]">
          <Wrench className="size-5.5 lg:hidden" strokeWidth={2} aria-hidden />
          Upcoming maintenance
        </h2>
        <Link
          href="/planner"
          aria-label="Open maintenance planner"
          className="grid size-9 shrink-0 place-items-center rounded-full text-[#0B1220] 3xl:size-11 transition-colors outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
        >
          <ChevronRight className="size-5.5 3xl:size-7" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
            <ClipboardList className="size-6" aria-hidden />
          </span>
          <p className="mt-3 font-bold text-[#0B1220] 2xl:text-lg 3xl:text-[22px] 4xl:text-[26px]">No service history yet</p>
          <p className="mt-1 max-w-xs text-sm text-[#5B6475] 2xl:max-w-sm 2xl:text-[15px] 3xl:max-w-md 3xl:text-lg">
            Add your last service to get maintenance forecasts
          </p>
          <Link
            href="/service-log"
            className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-[#1766F2] px-4 text-sm font-semibold text-white transition-colors outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
          >
            Add service record
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 grid gap-4 lg:mt-5 2xl:mt-7 2xl:gap-6 3xl:mt-9 3xl:gap-8 4xl:gap-10">
            {items.map((item) => {
              const status = item.status as Exclude<MaintenanceStatus, "no_data">
              return (
                <li key={item.typeId} className="flex items-start gap-3.5">
                  <span
                    className={cn("mt-1.5 size-3 shrink-0 rounded-full 2xl:mt-2 2xl:size-3.5 3xl:mt-2.5 3xl:size-4 4xl:mt-3 4xl:size-5", DOT[status])}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0B1220] 2xl:text-lg 3xl:text-[22px] 4xl:text-[26px]">
                      {item.name}
                      <span className="sr-only"> — {STATUS_LABEL[status]}</span>
                    </p>
                    <p className="text-sm text-[#5B6475] 2xl:mt-0.5 2xl:text-base 3xl:mt-1 3xl:text-lg 4xl:text-xl">{describe(item, today)}</p>
                  </div>
                  {status === "overdue" && (
                    <span aria-hidden className="shrink-0 rounded-full bg-[#FDECEC] px-2.5 py-1 text-[13px] font-semibold text-[#DC2626] 2xl:px-3 2xl:text-sm 3xl:px-4 3xl:py-1.5 3xl:text-base 4xl:text-lg">
                      Overdue
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          {withoutHistory > 0 && (
            <p className="mt-auto border-t border-[#E5E9F0] pt-3 text-sm text-[#5B6475] [&:not(:first-child)]:mt-5 2xl:pt-4 2xl:text-[15px] 3xl:pt-5 3xl:text-lg 4xl:text-xl">
              {withoutHistory === 1 ? "1 task has" : `${withoutHistory} tasks have`} no service history
            </p>
          )}
        </>
      )}
    </section>
  )
}
