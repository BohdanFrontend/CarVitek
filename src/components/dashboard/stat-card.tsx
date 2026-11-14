import type { ReactNode } from "react"
import { cn } from "cn"

import { dashboardCardClass } from "./card-styles"

type StatCardProps = {
  title: string
  /** Головне значення; null — порожній стан */
  value: ReactNode | null
  /** Рядок під значенням (зміна до минулого місяця тощо) */
  sub?: ReactNode
  /** Міні-графік праворуч (aria-hidden усередині) */
  chart?: ReactNode
  /** Опис графіка для скрінрідерів */
  chartLabel?: string
  /** Підказка для порожнього стану */
  emptyHint: string
}

/** Картка показника: назва, значення ліворуч, міні-графік праворуч. */
export function StatCard({ title, value, sub, chart, chartLabel, emptyHint }: StatCardProps) {
  const empty = value == null

  return (
    <section
      className={cn(
        dashboardCardClass,
        "flex min-h-[132px] flex-col p-5 lg:p-6 xl:min-h-[150px] 2xl:min-h-[176px] 2xl:p-8 3xl:min-h-[220px] 3xl:p-10 4xl:min-h-[260px] 4xl:p-12"
      )}
    >
      <h2 className="text-base font-bold text-[#0B1220] lg:text-[17px] 2xl:text-[19px] 3xl:text-[23px] 4xl:text-[27px]">{title}</h2>
      {empty ? (
        <div className="mt-2 2xl:mt-3 3xl:mt-4">
          <p className="text-xl font-bold text-[#8A93A3] 2xl:text-2xl 3xl:text-[28px] 4xl:text-[32px]">No data yet</p>
          <p className="mt-1 text-sm text-[#5B6475] 2xl:text-[15px] 3xl:text-lg 4xl:text-xl">{emptyHint}</p>
        </div>
      ) : (
        <div className="mt-auto flex items-end justify-between gap-4 pt-2">
          <div className="shrink-0">
            <p className="text-[30px] leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap text-[#0B1220] lg:text-[32px] 2xl:text-[38px] 3xl:text-[44px] 4xl:text-[54px]">
              {value}
            </p>
            {sub && <div className="mt-0.5 text-sm font-semibold 2xl:text-[15px] 3xl:text-lg 4xl:text-xl">{sub}</div>}
          </div>
          {chart}
          {chart && chartLabel && <p className="sr-only">{chartLabel}</p>}
        </div>
      )}
    </section>
  )
}
