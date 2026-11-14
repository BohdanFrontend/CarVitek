"use client"

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useReducedMotion } from "@/components/dashboard/use-reduced-motion"
import { formatMoney } from "@/lib/format"

/** Кільцева діаграма за категоріями; підпис у центрі — HTML поверх SVG. */
export function DonutChart({
  data,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  centerValue: string
}) {
  const reduced = useReducedMotion()
  return (
    <div className="relative mx-auto size-[220px] shrink-0 3xl:size-[280px]">
      <div aria-hidden className="size-full">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 220, height: 220 }}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={!reduced}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, name) => [formatMoney(Number(v)), String(name)]}
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E9F0", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tracking-[-0.02em] text-[#0B1220] 3xl:text-3xl">{centerValue}</span>
        <span className="text-sm text-[#5B6475]">Total</span>
      </div>
    </div>
  )
}

/** Витрати по місяцях року: стовпчики, поточний місяць насиченіший. */
export function MonthBars({
  data,
  highlight,
}: {
  data: { month: string; label: string; total: number }[]
  highlight: string | null
}) {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden className="h-56 w-full 3xl:h-72">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 220 }}>
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="24%">
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5B6475" }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#5B6475" }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: "#F1F4F9" }}
            formatter={(v) => [formatMoney(Number(v)), "Spent"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E9F0", fontSize: 13 }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={!reduced}>
            {data.map((d) => (
              <Cell key={d.month} fill="#1766F2" fillOpacity={!highlight || d.month === highlight ? 1 : 0.45} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
