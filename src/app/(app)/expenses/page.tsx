import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "cn"

import { NoCarState } from "@/components/common/empty-state"
import { LoadMore, parseLimit } from "@/components/common/load-more"
import { PageHeader } from "@/components/common/page-header"
import { ExpenseRecords } from "@/components/expenses/expense-records"
import { ExpensesOverview } from "@/components/expenses/overview"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { todayInKyiv } from "@/lib/dates"
import { getExpenseOverview, listExpenses } from "@/lib/expenses/queries"
import type { Period } from "@/lib/stats/costs"

export const metadata: Metadata = { title: "Expenses" }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Період з query: ?period=month&month=2026-11 або ?period=year&year=2026 (за замовчуванням — поточний місяць). */
function parsePeriod(sp: Record<string, string | string[] | undefined>, today: string): Period {
  const thisMonth = today.slice(0, 7)
  if (one(sp.period) === "year") {
    const year = Number(one(sp.year))
    const max = Number(today.slice(0, 4))
    return { kind: "year", year: Number.isInteger(year) && year >= 1950 && year <= max ? year : max }
  }
  const month = one(sp.month)
  return { kind: "month", month: month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && month <= thisMonth ? month : thisMonth }
}

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const sp = await searchParams
  const { activeCar } = await getActiveCar()
  if (!activeCar) return <NoCarState title="Expenses" what="expenses" />

  const tab = one(sp.tab) === "records" ? "records" : "overview"
  const today = todayInKyiv()

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex h-11 items-center border-b-2 px-1 text-[15px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
      active ? "border-[#1766F2] text-[#1766F2]" : "border-transparent text-[#5B6475] hover:text-[#0B1220]"
    )

  return (
    <div>
      <PageHeader title="Expenses" description={carLabel(activeCar)} />
      <nav aria-label="Expenses sections" className="mb-5 flex gap-6 border-b border-[#E5E9F0] lg:mb-6">
        <Link href="?tab=overview" aria-current={tab === "overview" ? "page" : undefined} className={tabClass(tab === "overview")}>
          Overview
        </Link>
        <Link href="?tab=records" aria-current={tab === "records" ? "page" : undefined} className={tabClass(tab === "records")}>
          Records
        </Link>
      </nav>

      {tab === "overview" ? (
        <OverviewTab carId={activeCar.id} period={parsePeriod(sp, today)} today={today} />
      ) : (
        <RecordsTab carId={activeCar.id} limit={parseLimit(sp.limit)} />
      )}
    </div>
  )
}

async function OverviewTab({ carId, period, today }: { carId: string; period: Period; today: string }) {
  const data = await getExpenseOverview(carId, period, today)
  return <ExpensesOverview data={data} period={period} today={today} />
}

async function RecordsTab({ carId, limit }: { carId: string; limit: number }) {
  const { rows, total, hasMore } = await listExpenses(carId, limit)
  return (
    <ExpenseRecords
      carId={carId}
      rows={rows}
      total={total}
      loadMore={<LoadMore hasMore={hasMore} limit={limit} params={{ tab: "records" }} />}
    />
  )
}
