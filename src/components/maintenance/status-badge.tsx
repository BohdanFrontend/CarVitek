import { cn } from "cn"

import { STATUS_LABELS } from "@/lib/maintenance/describe"
import type { MaintenanceStatus } from "@/lib/maintenance/plan"

export const STATUS_STYLES: Record<MaintenanceStatus, { badge: string; bar: string; dot: string }> = {
  overdue: { badge: "bg-[#FDECEC] text-[#DC2626]", bar: "bg-[#EF4444]", dot: "bg-[#EF4444]" },
  soon: { badge: "bg-[#FEF3C7] text-[#B45309]", bar: "bg-[#F59E0B]", dot: "bg-[#F59E0B]" },
  ok: { badge: "bg-[#DCFCE7] text-[#15803D]", bar: "bg-[#22C55E]", dot: "bg-[#22C55E]" },
  no_data: { badge: "bg-[#EEF1F6] text-[#5B6475]", bar: "bg-[#CBD5E1]", dot: "bg-[#CBD5E1]" },
}

/** Статусний бейдж роботи ТО: текст завжди поруч із кольором. */
export function StatusBadge({ status, className }: { status: MaintenanceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap",
        STATUS_STYLES[status].badge,
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
