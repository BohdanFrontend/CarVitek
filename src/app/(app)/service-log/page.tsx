import { Plus, Wrench } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { primaryButtonClass } from "@/components/common/buttons"
import { EmptyState, NoCarState } from "@/components/common/empty-state"
import { FilterChips } from "@/components/common/filter-chips"
import { LoadMore, parseLimit } from "@/components/common/load-more"
import { PageHeader } from "@/components/common/page-header"
import { ServiceRecordsList } from "@/components/service-log/service-records-list"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { formatMoney } from "@/lib/format"
import { WORK_GROUPS, WORK_GROUP_LABELS, isWorkGroup } from "@/lib/maintenance/groups"
import { listServiceRecords } from "@/lib/service-log/queries"

export const metadata: Metadata = { title: "Service Log" }

export default async function ServiceLogPage({ searchParams }: PageProps<"/service-log">) {
  const sp = await searchParams
  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCarState title="Service Log" what="service history" />

  const group = isWorkGroup(sp.group) ? sp.group : null
  const limit = parseLimit(sp.limit)
  const { rows, total, totalSpent, hasMore } = await listServiceRecords(activeCar.id, { group, limit })

  const addButton = (
    <Link href="/service-log/new" className={primaryButtonClass}>
      <Plus className="size-5" aria-hidden />
      Add record
    </Link>
  )

  return (
    <div>
      <PageHeader title="Service Log" description={carLabel(activeCar)} action={addButton} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Filter by work type"
          param="group"
          active={group}
          options={[
            { value: null, label: "All" },
            ...WORK_GROUPS.map((g) => ({ value: g, label: WORK_GROUP_LABELS[g] })),
          ]}
        />
        {total > 0 && (
          <p className="text-[15px] text-[#5B6475]">
            Total spent:{" "}
            <span className="font-bold text-[#0B1220]">{formatMoney(totalSpent)}</span>
            <span className="ml-1">({total} {total === 1 ? "record" : "records"})</span>
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={group ? "No records in this category" : "No service records yet"}
          description={
            group
              ? "Try another filter or add a new service record"
              : "Add your past services to get maintenance forecasts"
          }
          action={addButton}
        />
      ) : (
        <>
          <ServiceRecordsList rows={rows} />
          <LoadMore hasMore={hasMore} limit={limit} params={{ group: group ?? undefined }} />
        </>
      )}
    </div>
  )
}
