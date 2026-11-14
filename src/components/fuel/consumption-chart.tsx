"use client"

import { format, parseISO } from "date-fns"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useReducedMotion } from "@/components/dashboard/use-reduced-motion"

/** Витрата по сегментах «від повного до повного»: площа з легким градієнтом, вісь X — дати. */
export function ConsumptionChart({ data, unit }: { data: { date: string; value: number }[]; unit: string }) {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden className="h-48 w-full lg:h-56 3xl:h-72">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 200 }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="consumption-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#EEF1F6" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => (d ? format(parseISO(d), "d MMM") : "")}
            tick={{ fontSize: 12, fill: "#5B6475" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fontSize: 12, fill: "#5B6475" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(2)} ${unit}/100 km`, "Consumption"]}
            labelFormatter={(d) => (typeof d === "string" && d ? format(parseISO(d), "d MMM yyyy") : "")}
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E9F0", fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10B981"
            strokeWidth={3}
            fill="url(#consumption-fill)"
            dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!reduced}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
