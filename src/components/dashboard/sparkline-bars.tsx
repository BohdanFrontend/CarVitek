"use client"

import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts"

import { sparklineBoxClass } from "./sparkline-size"
import { useReducedMotion } from "./use-reduced-motion"

/** Міні-стовпчики без осей і підписів; останній (поточний місяць) — насиченіший. */
export function SparklineBars({ values, color }: { values: number[]; color: string }) {
  const reduced = useReducedMotion()
  const data = values.map((v) => ({ v }))

  return (
    <div aria-hidden className={sparklineBoxClass}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 140, height: 56 }}>
        <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
          <Bar dataKey="v" radius={[3, 3, 0, 0]} minPointSize={3} isAnimationActive={!reduced}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={i === data.length - 1 ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
