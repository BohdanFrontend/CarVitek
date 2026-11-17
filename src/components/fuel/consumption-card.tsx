"use client"

import { Fuel, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "cn"

import { useReducedMotion } from "@/components/dashboard/use-reduced-motion"
import { ChartContainer } from "@/components/ui/chart"
import type { ConsumptionPeriod, ConsumptionPoint, Granularity } from "@/lib/fuel/consumption"
import { useFormat } from "@/i18n/format-client"

export type ConsumptionStats = {
  points: ConsumptionPoint[]
  /** month — точка на місяць; day — на кожну заправку (коли дані в межах одного місяця) */
  granularity: Granularity
  average: number | null
  change: number | null
  min: number | null
  max: number | null
}

const PERIODS = [
  { value: "6m", long: "over6m" },
  { value: "1y", long: "over1y" },
  { value: "all", long: "overAll" },
] as const satisfies readonly { value: ConsumptionPeriod; long: string }[]

const BLUE = "#1766F2"
const GRID = "#EEF2F7"
const MUTED = "#5B6475"

/** Межі осі Y: [floor(min) − 1, ceil(max) + 1], не нижче 0, крок 1 або 2 (4–5 поділок). */
function yAxis(min: number, max: number) {
  let lo = Math.max(0, Math.floor(min) - 1)
  let hi = Math.ceil(max) + 1
  // Крок 1 або 2 для звичайних значень; для великого розкиду — більший, щоб лишалось ≤ 6 поділок
  const step = [1, 2, 5, 10, 20, 50].find((s) => Math.ceil((hi - lo) / s) <= 5) ?? 100
  lo = Math.floor(lo / step) * step
  hi = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += step) ticks.push(v)
  return { domain: [lo, hi] as [number, number], ticks }
}

/** Картка «Fuel consumption, L/100 km»: середнє за період, зміна і помісячний графік. */
export function ConsumptionCard({
  unit,
  period,
  stats,
  hasSegments,
  onAdd,
}: {
  unit: "L" | "kWh"
  period: ConsumptionPeriod
  stats: ConsumptionStats
  /** Чи є хоч один сегмент «від повного до повного» за всю історію */
  hasSegments: boolean
  onAdd: () => void
}) {
  const reduced = useReducedMotion()
  const electric = unit === "kWh"
  const t = useTranslations("fuel")
  const f = useFormat()
  const per100 = t("per100", { unit: f.units[unit] })
  const { points, granularity, average, change, min, max } = stats
  const periodText = t(`chart.${PERIODS.find((p) => p.value === period)!.long}`)

  // Підписи осі X: «Jan» або «Jan '26», якщо точки охоплюють різні роки
  const multiYear = new Set(points.map((p) => p.key.slice(0, 4))).size > 1
  const data = points.map((p) => ({
    ...p,
    value: Math.round(p.value * 100) / 100,
    label: granularity === "day" ? f.dayMonth(p.key) : f.monthShort(p.key, multiYear),
  }))
  const axis = min != null && max != null ? yAxis(min, max) : null

  return (
    <section
      aria-labelledby="consumption-title"
      className="flex min-w-0 flex-col rounded-[20px] border border-[#E5E9F0] bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] lg:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="consumption-title" className="text-lg font-bold text-[#0B1220]">
          {t(electric ? "chart.titleElectric" : "chart.title", { per100 })}
        </h2>
        {hasSegments && (
          <nav aria-label={t("chart.period")} className="inline-flex rounded-[10px] bg-[#F1F4F9] p-0.5">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={p.value === "6m" ? "?" : `?period=${p.value}`}
                scroll={false}
                aria-current={p.value === period ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-[8px] px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
                  p.value === period ? "bg-white text-[#0B1220] shadow-sm" : "text-[#5B6475] hover:text-[#0B1220]"
                )}
              >
                {t(`chart.${p.value}`)}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {!hasSegments ? (
        // Менше двох повних заправок — розрахувати нічого
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
            <Fuel className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-bold text-[#0B1220]">{t("chart.notEnoughTitle")}</p>
          <p className="mt-1 max-w-xs text-sm text-[#5B6475]">
            {t(electric ? "chart.notEnoughTextElectric" : "chart.notEnoughText")}
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#1766F2] px-5 text-[15px] font-semibold text-white outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
          >
            <Plus className="size-4.5" aria-hidden />
            {electric ? t("addElectric") : t("add")}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[32px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220] tabular-nums">
              {average != null ? f.number(average, 1) : "—"}
              <span className="ml-1.5 text-[15px] font-semibold">{per100}</span>
            </p>
            {change != null && Math.abs(change) >= 0.05 && (
              <p className={cn("text-sm font-semibold tabular-nums", change < 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
                <span aria-hidden>{change < 0 ? "↓ " : "↑ "}</span>
                {change < 0 ? "−" : "+"}
                {f.number(Math.abs(change), 1)}
                <span className="sr-only"> {t("chart.vsPrevious", { per100 })}</span>
              </p>
            )}
          </div>

          {points.length === 0 ? (
            <p className="mt-6 flex-1 text-sm text-[#5B6475]">
              {t("chart.noSegments", { period: periodText })}
            </p>
          ) : (
            <>
              <ChartContainer
                aria-hidden
                config={{ value: { label: t("chart.consumption"), color: BLUE } }}
                initialDimension={{ width: 560, height: 280 }}
                className="mt-4 aspect-auto h-[220px] w-full lg:h-[280px] 3xl:h-[340px]"
              >
                <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="fuel-consumption-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} strokeDasharray="0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 13, fill: MUTED }}
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <YAxis
                    domain={axis?.domain}
                    ticks={axis?.ticks}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    tick={{ fontSize: 13, fill: MUTED }}
                  />
                  {average != null && (
                    <ReferenceLine
                      y={Math.round(average * 100) / 100}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      label={{ value: t("chart.avg", { value: f.number(average, 1) }), position: "insideTopRight", fill: MUTED, fontSize: 12 }}
                    />
                  )}
                  <Tooltip content={<ConsumptionTooltip unit={unit} granularity={granularity} per100={per100} />} cursor={{ stroke: "#CBD5E1" }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={BLUE}
                    strokeWidth={3}
                    fill="url(#fuel-consumption-fill)"
                    // #FFFFFF, а не #fff: ChartContainer ховає обводку точок зі stroke="#fff"
                    dot={{ r: 5, fill: BLUE, stroke: "#FFFFFF", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: BLUE, stroke: "#FFFFFF", strokeWidth: 2 }}
                    isAnimationActive={!reduced}
                  />
                </AreaChart>
              </ChartContainer>
              {average != null && min != null && max != null && (
                <p className="sr-only">
                  {t(electric ? "chart.srSummaryElectric" : "chart.srSummary", { value: f.number(average, 1), per100, period: periodText })}
                  {points.length > 1 ? t("chart.srRange", { min: f.number(min, 1), max: f.number(max, 1) }) : ""}
                </p>
              )}
              {granularity === "day" && (
                <p className="mt-2 text-sm text-[#5B6475]">
                  {t(electric ? "chart.perRefuelingElectric" : "chart.perRefueling")}
                </p>
              )}
              {points.length === 1 && (
                <p className="mt-2 text-sm text-[#5B6475]">
                  {t(electric ? "chart.onePointElectric" : "chart.onePoint")}
                </p>
              )}
            </>
          )}

          <p className="mt-auto pt-3 text-[13px] text-[#5B6475]">
            {t(electric ? "chart.noteElectric" : "chart.note")}
          </p>
        </>
      )}
    </section>
  )
}

type TooltipProps = {
  active?: boolean
  payload?: { payload: ConsumptionPoint }[]
  unit: "L" | "kWh"
  granularity: Granularity
  per100: string
}

/** Підказка: «Mar 2026», «6.8 L/100 km», «1 240 km · 84.3 L». */
function ConsumptionTooltip({ active, payload, unit, granularity, per100 }: TooltipProps) {
  const f = useFormat()
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  return (
    <div className="rounded-[12px] border border-[#E5E9F0] bg-white px-3 py-2 text-[13px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      <p className="font-semibold text-[#0B1220]">{granularity === "day" ? f.date(p.key) : f.monthYear(p.key)}</p>
      <p className="mt-0.5 text-[15px] font-bold text-[#1766F2] tabular-nums">
        {f.number(p.value, 1)} {per100}
      </p>
      <p className="text-[#5B6475] tabular-nums">
        {f.km(p.distance)} · {f.number(p.liters, 1)} {f.units[unit]}
      </p>
    </div>
  )
}
