import { ChevronLeft, ChevronRight, PieChart as PieIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "cn"

import { cardClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { SparklineLine } from "@/components/dashboard/sparkline-line"
import type { getExpenseOverview } from "@/lib/expenses/queries"
import { formatMoney } from "@/lib/format"
import { CATEGORY_COLORS, CATEGORY_LABELS, type SpendCategory } from "@/lib/stats/categories"
import { shiftPeriod, type Period } from "@/lib/stats/costs"
import { CategoryIcon } from "./category-icon"
import { DonutChart, MonthBars } from "./charts"

type Overview = Awaited<ReturnType<typeof getExpenseOverview>>

const periodHref = (p: Period) =>
  p.kind === "month" ? `?tab=overview&period=month&month=${p.month}` : `?tab=overview&period=year&year=${p.year}`

const segmentClass = (active: boolean) =>
  cn(
    "inline-flex h-9 items-center rounded-full px-4 text-[15px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
    active ? "bg-[#1766F2] text-white" : "text-[#0B1220] hover:bg-[#EEF3FE]"
  )

/** Перемикач Month / Year і вибір періоду стрілками. */
function PeriodControls({ period, label, today }: { period: Period; label: string; today: string }) {
  const thisMonth = today.slice(0, 7)
  const thisYear = Number(today.slice(0, 4))
  const prev = shiftPeriod(period, -1)
  const next = shiftPeriod(period, 1)
  const nextDisabled = period.kind === "month" ? period.month >= thisMonth : period.year >= thisYear
  const arrow =
    "grid size-9 place-items-center rounded-full border border-[#E1E7F0] bg-white text-[#0B1220] outline-none hover:bg-[#EEF3FE] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label="Period" className="inline-flex rounded-full border border-[#E1E7F0] bg-white p-1">
        <Link
          href={periodHref({ kind: "month", month: period.kind === "month" ? period.month : thisMonth })}
          aria-current={period.kind === "month" ? "page" : undefined}
          className={segmentClass(period.kind === "month")}
          scroll={false}
        >
          Month
        </Link>
        <Link
          href={periodHref({ kind: "year", year: period.kind === "year" ? period.year : thisYear })}
          aria-current={period.kind === "year" ? "page" : undefined}
          className={segmentClass(period.kind === "year")}
          scroll={false}
        >
          Year
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href={periodHref(prev)} scroll={false} aria-label="Previous period" className={arrow}>
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <span className="min-w-36 text-center text-[17px] font-bold text-[#0B1220]">{label}</span>
        {nextDisabled ? (
          <span aria-hidden className={cn(arrow, "pointer-events-none opacity-40")}>
            <ChevronRight className="size-5" />
          </span>
        ) : (
          <Link href={periodHref(next)} scroll={false} aria-label="Next period" className={arrow}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}

export function ExpensesOverview({ data, period, today }: { data: Overview; period: Period; today: string }) {
  const donut = data.categories.map((c) => ({
    name: CATEGORY_LABELS[c.category as SpendCategory] ?? c.category,
    value: c.total,
    color: CATEGORY_COLORS[c.category as SpendCategory] ?? "#94A3B8",
  }))
  const trend = data.costPerKmTrend.map((t) => t.value ?? 0)
  const change = data.costPerKmChange

  return (
    <div className="grid gap-4 lg:gap-6">
      <PeriodControls period={period} label={data.label} today={today} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        {/* Розподіл за категоріями */}
        <section aria-labelledby="by-category" className={cn(cardClass, "p-5 lg:p-6")}>
          <h2 id="by-category" className="text-[17px] font-bold text-[#0B1220]">
            Expenses by category
          </h2>
          {data.total > 0 ? (
            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <DonutChart data={donut} centerValue={formatMoney(data.total, { decimals: 0 })} />
              <ul className="grid w-full gap-2.5">
                {data.categories.map((c) => {
                  const cat = c.category as SpendCategory
                  const pct = Math.round((c.total / data.total) * 100)
                  return (
                    <li key={c.category} className="flex items-center gap-3">
                      <CategoryIcon category={cat} size="sm" />
                      <span className="flex-1 font-medium text-[#0B1220]">{CATEGORY_LABELS[cat]}</span>
                      <span className="text-sm text-[#5B6475]">{formatMoney(c.total)}</span>
                      <span className="w-11 text-right font-semibold text-[#0B1220]">{pct}%</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title="No expenses in this period"
              description="Fuel, service records and other expenses for this period will appear here"
              className="mt-4 border-0 shadow-none"
            />
          )}
        </section>

        {/* Вартість 1 км */}
        <section aria-labelledby="cost-per-km" className={cn(cardClass, "flex flex-col p-5 lg:p-6")}>
          <h2 id="cost-per-km" className="text-[17px] font-bold text-[#0B1220]">
            Cost per 1 km
          </h2>
          {data.costPerKm != null ? (
            <>
              <p className="mt-2 text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220]">
                {formatMoney(data.costPerKm)}
              </p>
              {change != null && (
                <p className={cn("text-sm font-semibold", change > 0 ? "text-[#DC2626]" : change < 0 ? "text-[#16A34A]" : "text-[#5B6475]")}>
                  <span aria-hidden>{change > 0 ? "↑ " : change < 0 ? "↓ " : ""}</span>
                  {change > 0 ? "+" : change < 0 ? "−" : ""}
                  {Math.abs(change)}% vs {data.previousLabel}
                </p>
              )}
              <div className="mt-auto flex items-end justify-between gap-4 pt-4">
                <p className="text-sm text-[#5B6475]">Trend over the last 8 months</p>
                {trend.filter((v) => v > 0).length >= 2 && <SparklineLine values={trend} color="#8B5CF6" />}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-[#5B6475]">
              No mileage recorded in this period — update your mileage or log fuel to see the cost per kilometre.
            </p>
          )}
        </section>
      </div>

      {/* По місяцях */}
      <section aria-labelledby="by-month" className={cn(cardClass, "p-5 lg:p-6")}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="by-month" className="text-[17px] font-bold text-[#0B1220]">
            Expenses in {data.year}
          </h2>
          <p className="text-sm text-[#5B6475]">
            Total: <span className="font-semibold text-[#0B1220]">{formatMoney(data.byMonth.reduce((s, m) => s + m.total, 0))}</span>
          </p>
        </div>
        <div className="mt-4">
          <MonthBars data={data.byMonth} highlight={period.kind === "month" ? period.month : null} />
        </div>
        <p className="sr-only">
          {data.byMonth.map((m) => `${m.label}: ${formatMoney(m.total)}`).join("; ")}
        </p>
      </section>
    </div>
  )
}
