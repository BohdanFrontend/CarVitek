import { Check, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "cn"

import { cardClass } from "@/components/common/buttons"
import { STATUS_STYLES, StatusBadge } from "@/components/maintenance/status-badge"
import { WorkTypeIcon } from "@/components/maintenance/work-type-icon"
import { formatDate, type ISODate } from "@/lib/dates"
import { formatKm } from "@/lib/format"
import { describeDue, describeInterval, describeNext } from "@/lib/maintenance/describe"
import { intervalProgress, type MaintenanceItem } from "@/lib/maintenance/plan"

const actionClass =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"

/** Робота з плану ТО: статус, останнє виконання, наступне, прогрес інтервалу. */
export function PlanItemCard({
  item,
  currentMileage,
  today,
}: {
  item: MaintenanceItem
  currentMileage: number
  today: ISODate
}) {
  const progress = intervalProgress(item, currentMileage, today)
  const next = describeNext(item)
  const href = `/service-log/new?type=${item.typeId}`

  return (
    <li className={cn(cardClass, "p-4 lg:p-5")}>
      <div className="flex items-start gap-3.5">
        <WorkTypeIcon code={item.code} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[17px] font-bold text-[#0B1220]">{item.name}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-0.5 text-sm text-[#5B6475]">
            Interval: {describeInterval(item.intervalKm, item.intervalMonths)}
          </p>

          {item.last ? (
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-1.5">
                <dt className="text-[#5B6475]">Last:</dt>
                <dd className="font-medium text-[#0B1220]">
                  {formatDate(item.last.date)} · {formatKm(item.last.mileage)}
                </dd>
              </div>
              {next && (
                <div className="flex gap-1.5">
                  <dt className="text-[#5B6475]">Next:</dt>
                  <dd className="font-medium text-[#0B1220]">{next}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-[#5B6475]">
              Add the last time this was done to get a forecast.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 sm:flex-nowrap">
        {item.last && (
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-sm font-semibold text-[#0B1220]">{describeDue(item, today, { withDays: true })}</p>
            {progress != null && (
              <div
                role="progressbar"
                aria-label={`${item.name}: ${Math.round(progress * 100)}% of the interval used`}
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-[#EEF1F6]"
              >
                <div
                  className={cn("h-full rounded-full", STATUS_STYLES[item.status].bar)}
                  style={{ width: `${Math.max(3, progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
        {item.last ? (
          <Link href={href} className={cn(actionClass, "ml-auto border border-[#D9DEE7] bg-white text-[#0B1220] hover:bg-[#F5F7FB]")}>
            <Check className="size-4" aria-hidden />
            Mark as done
          </Link>
        ) : (
          <Link href={href} className={cn(actionClass, "bg-[#1766F2] text-white hover:bg-[#0F55D6]")}>
            <Plus className="size-4" aria-hidden />
            Add last service
          </Link>
        )}
      </div>
    </li>
  )
}
