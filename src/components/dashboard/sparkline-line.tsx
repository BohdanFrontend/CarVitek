"use client"

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts"

import { sparklineBoxClass } from "./sparkline-size"
import { useReducedMotion } from "./use-reduced-motion"

/** Плавна міні-лінія без осей і підписів. */
export function SparklineLine({ values, color }: { values: number[]; color: string }) {
  const reduced = useReducedMotion()
  const data = values.map((v) => ({ v }))

  return (
    <div aria-hidden className={sparklineBoxClass}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 140, height: 56 }}>
        <LineChart data={data} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            dot={false}
            isAnimationActive={!reduced}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
