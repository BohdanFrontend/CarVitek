import { cn } from "cn"

import { dashboardCardClass } from "@/components/dashboard/card-styles"

const bone = "animate-pulse rounded-[10px] bg-[#EEF1F6] motion-reduce:animate-none"

/** Скелетон дашборду поки вантажаться дані. */
export default function DashboardLoading() {
  return (
    <div className="grid gap-4 lg:gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <div className={cn(dashboardCardClass, "p-3 lg:p-5")}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-7">
            <div className={cn(bone, "aspect-video rounded-[14px] lg:aspect-[4/3]")} />
            <div className="grid content-center gap-3 px-2 pb-2 lg:px-0">
              <div className={cn(bone, "h-5 w-40")} />
              <div className={cn(bone, "h-11 w-56")} />
              <div className={cn(bone, "h-12 w-36")} />
              <div className={cn(bone, "h-12 w-48")} />
            </div>
          </div>
        </div>
        <div className={cn(dashboardCardClass, "grid content-start gap-5 p-5 lg:p-6")}>
          <div className={cn(bone, "h-6 w-56")} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(bone, "size-3 rounded-full")} />
              <div className="grid flex-1 gap-1.5">
                <div className={cn(bone, "h-4 w-32")} />
                <div className={cn(bone, "h-3.5 w-48")} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(dashboardCardClass, "flex min-h-[132px] items-end justify-between p-5 lg:p-6")}>
            <div className="grid gap-3">
              <div className={cn(bone, "h-4 w-32")} />
              <div className={cn(bone, "h-8 w-28")} />
            </div>
            <div className={cn(bone, "h-14 w-[140px]")} />
          </div>
        ))}
      </div>
    </div>
  )
}
