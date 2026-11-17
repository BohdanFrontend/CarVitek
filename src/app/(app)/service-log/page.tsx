import { Plus, Wrench } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { cardClass, primaryButtonClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { NoCarState } from "@/components/common/no-car-state"
import { FilterChips } from "@/components/common/filter-chips"
import { LoadMore, parseLimit } from "@/components/common/load-more"
import { PageHeader } from "@/components/common/page-header"
import { ServiceRecordsList } from "@/components/service-log/service-records-list"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getFormat } from "@/i18n/format-server"
import { WORK_GROUPS, isWorkGroup } from "@/lib/maintenance/groups"
import { listServiceRecords } from "@/lib/service-log/queries"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("serviceLog"))("title") }
}

export default async function ServiceLogPage({ searchParams }: PageProps<"/service-log">) {
  const sp = await searchParams
  const [{ activeCar }, t, f] = await Promise.all([getActiveCar(), getTranslations("serviceLog"), getFormat()])
  if (!activeCar) return <NoCarState title={t("title")} what={t("noCarWhat")} />

  const group = isWorkGroup(sp.group) ? sp.group : null
  const limit = parseLimit(sp.limit)
  const { rows, total, totalSpent, hasMore } = await listServiceRecords(activeCar.id, { group, limit })

  const addButton = (
    <Link href="/service-log/new" className={primaryButtonClass}>
      <Plus className="size-5" aria-hidden />
      {t("addRecord")}
    </Link>
  )

  return (
    <div>
      <PageHeader title={t("title")} description={carLabel(activeCar)} action={addButton} />

      {/* Мобільний: чипи (власний горизонтальний скрол) і під ними картка підсумку.
          Десктоп: чипи й підсумок в одному рядку, як раніше. */}
      <div className="mb-4 grid grid-cols-1 gap-3 lg:flex lg:flex-wrap lg:items-center lg:justify-between">
        <FilterChips
          label={t("filterLabel")}
          param="group"
          active={group}
          options={[
            { value: null, label: t("all") },
            ...WORK_GROUPS.map((g) => ({ value: g, label: t(`groups.${g}`) })),
          ]}
        />
        {total > 0 && (
          <>
            <div className={`${cardClass} rounded-[16px] px-4 py-3 lg:hidden`}>
              <p className="text-[13px] text-[#5B6475]">{t("totalSpent")}</p>
              <p className="text-[22px] leading-tight font-extrabold text-[#0B1220]">{f.moneyShort(totalSpent)}</p>
              <p className="text-[13px] text-[#5B6475]">
                {t("records", { count: total })}
              </p>
            </div>
            <p className="hidden text-[15px] text-[#5B6475] lg:block">
              {t("totalSpent")}:{" "}
              <span className="font-bold text-[#0B1220]">{f.money(totalSpent)}</span>
              <span className="ml-1">({t("records", { count: total })})</span>
            </p>
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={group ? t("emptyFilteredTitle") : t("emptyTitle")}
          description={group ? t("emptyFilteredText") : t("emptyText")}
          action={addButton}
        />
      ) : (
        <>
          <ServiceRecordsList rows={rows} f={f} />
          <LoadMore hasMore={hasMore} limit={limit} params={{ group: group ?? undefined }} />
        </>
      )}
    </div>
  )
}
