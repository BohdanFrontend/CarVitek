import { ChevronLeft, ChevronRight, PieChart as PieIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { cn } from "cn"

import { cardClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { SparklineLine } from "@/components/dashboard/sparkline-line"
import type { getExpenseOverview } from "@/lib/expenses/queries"
import { getFormat } from "@/i18n/format-server"
import type { Formatter } from "@/lib/format"
import { CATEGORY_COLORS, type SpendCategory } from "@/lib/stats/categories"
import { shiftPeriod, type Period } from "@/lib/stats/costs"
import { CategoryIcon } from "./category-icon"
import { DonutChart, MonthBars } from "./charts"

type Overview = Awaited<ReturnType<typeof getExpenseOverview>>

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

/** «November 2026» / «Листопад 2026» або «2026» */
const periodLabel = (p: Period, f: Formatter) => (p.kind === "month" ? capitalize(f.monthYearLong(p.month)) : String(p.year))

const periodHref = (p: Period) =>
  p.kind === "month" ? `?tab=overview&period=month&month=${p.month}` : `?tab=overview&period=year&year=${p.year}`

const segmentClass = (active: boolean) =>
  cn(
    "inline-flex h-9 items-center rounded-full px-4 text-[15px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
    active ? "bg-[#1766F2] text-white" : "text-[#0B1220] hover:bg-[#EEF3FE]"
  )

/** Перемикач Month / Year і вибір періоду стрілками. */
async function PeriodControls({ period, label, today }: { period: Period; label: string; today: string }) {
  const t = await getTranslations("expenses")
  const thisMonth = today.slice(0, 7)
  const thisYear = Number(today.slice(0, 4))
  const prev = shiftPeriod(period, -1)
  const next = shiftPeriod(period, 1)
  const nextDisabled = period.kind === "month" ? period.month >= thisMonth : period.year >= thisYear
  const arrow =
    "grid size-9 place-items-center rounded-full border border-[#E1E7F0] bg-white text-[#0B1220] outline-none hover:bg-[#EEF3FE] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label={t("period")} className="inline-flex rounded-full border border-[#E1E7F0] bg-white p-1">
        <Link
          href={periodHref({ kind: "month", month: period.kind === "month" ? period.month : thisMonth })}
          aria-current={period.kind === "month" ? "page" : undefined}
          className={segmentClass(period.kind === "month")}
          scroll={false}
        >
          {t("month")}
        </Link>
        <Link
          href={periodHref({ kind: "year", year: period.kind === "year" ? period.year : thisYear })}
          aria-current={period.kind === "year" ? "page" : undefined}
          className={segmentClass(period.kind === "year")}
          scroll={false}
        >
          {t("year")}
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href={periodHref(prev)} scroll={false} aria-label={t("previousPeriod")} className={arrow}>
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <span className="min-w-36 text-center text-[17px] font-bold text-[#0B1220]">{label}</span>
        {nextDisabled ? (
          <span aria-hidden className={cn(arrow, "pointer-events-none opacity-40")}>
            <ChevronRight className="size-5" />
          </span>
        ) : (
          <Link href={periodHref(next)} scroll={false} aria-label={t("nextPeriod")} className={arrow}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}

export async function ExpensesOverview({ data, period, today }: { data: Overview; period: Period; today: string }) {
  const [t, f] = await Promise.all([getTranslations("expenses"), getFormat()])
  const catName = (c: string) => t(`categories.${c as SpendCategory}`)
  const donut = data.categories.map((c) => ({
    name: catName(c.category),
    value: c.total,
    color: CATEGORY_COLORS[c.category as SpendCategory] ?? "#94A3B8",
  }))
  const trend = data.costPerKmTrend.map((t) => t.value ?? 0)
  const change = data.costPerKmChange

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-6">
      <PeriodControls period={period} label={periodLabel(period, f)} today={today} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        {/* Розподіл за категоріями */}
        <section aria-labelledby="by-category" className={cn(cardClass, "p-5 lg:p-6")}>
          <h2 id="by-category" className="text-[17px] font-bold text-[#0B1220]">
            {t("byCategory")}
          </h2>
          {data.total > 0 ? (
            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <DonutChart data={donut} centerValue={f.money(data.total, { decimals: 0 })} centerLabel={t("spent")} />
              <ul className="grid w-full gap-2.5">
                {data.categories.map((c) => {
                  const cat = c.category as SpendCategory
                  const pct = Math.round((c.total / data.total) * 100)
                  return (
                    <li key={c.category} className="flex items-center gap-3">
                      <CategoryIcon category={cat} size="sm" />
                      {/* Мобільний: сума під назвою (рядок не ширший за картку); lg+ — в один рядок */}
                      <span className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
                        <span className="block truncate font-medium text-[#0B1220] lg:flex-1">{catName(cat)}</span>
                        <span className="block text-sm whitespace-nowrap text-[#5B6475]">{f.money(c.total)}</span>
                      </span>
                      <span className="w-11 shrink-0 text-right font-semibold text-[#0B1220]">{pct}%</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title={t("noExpensesTitle")}
              description={t("noExpensesText")}
              className="mt-4 border-0 shadow-none"
            />
          )}
        </section>

        {/* Вартість 1 км */}
        <section aria-labelledby="cost-per-km" className={cn(cardClass, "flex flex-col p-5 lg:p-6")}>
          <h2 id="cost-per-km" className="text-[17px] font-bold text-[#0B1220]">
            {t("costPerKm")}
          </h2>
          {data.costPerKm != null ? (
            <>
              <p className="mt-2 text-[34px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220]">
                {f.money(data.costPerKm)}
              </p>
              {change != null && (
                <p className={cn("text-sm font-semibold", change > 0 ? "text-[#DC2626]" : change < 0 ? "text-[#16A34A]" : "text-[#5B6475]")}>
                  <span aria-hidden>{change > 0 ? "↑ " : change < 0 ? "↓ " : ""}</span>
                  {t("vsPrevious", { change: `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change)}`, period: periodLabel(shiftPeriod(period, -1), f) })}
                </p>
              )}
              <div className="mt-auto flex items-end justify-between gap-4 pt-4">
                <p className="text-sm text-[#5B6475]">{t("trend")}</p>
                {trend.filter((v) => v > 0).length >= 2 && <SparklineLine values={trend} color="#8B5CF6" />}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-[#5B6475]">
              {t("noMileage")}
            </p>
          )}
        </section>
      </div>

      {/* По місяцях */}
      <section aria-labelledby="by-month" className={cn(cardClass, "p-5 lg:p-6")}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="by-month" className="text-[17px] font-bold text-[#0B1220]">
            {t("inYear", { year: data.year })}
          </h2>
          <p className="text-sm text-[#5B6475]">
            {t("spent")}: <span className="font-semibold text-[#0B1220]">{f.money(data.byMonth.reduce((s, m) => s + m.total, 0))}</span>
          </p>
        </div>
        <div className="mt-4">
          <MonthBars
            data={data.byMonth.map((m) => ({ ...m, label: f.monthShort(m.month) }))}
            highlight={period.kind === "month" ? period.month : null}
            seriesLabel={t("spent")}
          />
        </div>
        <p className="sr-only">
          {data.byMonth.map((m) => `${f.monthShort(m.month)}: ${f.money(m.total)}`).join("; ")}
        </p>
      </section>
    </div>
  )
}
