import { BatteryCharging, Flame, Fuel, Zap, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { ENGINE_LABELS, type EngineType } from "@/lib/cars/format"

/** Іконки типів двигуна — спільні для бейджа на картці й вибору у формі. */
export const ENGINE_ICONS: Record<EngineType, LucideIcon> = {
  petrol: Fuel,
  diesel: Fuel,
  lpg: Flame,
  hybrid: BatteryCharging,
  electric: Zap,
}

/** Тип двигуна з іконкою; електро — зеленим. */
export function EngineBadge({ type, className }: { type: EngineType; className?: string }) {
  const electric = type === "electric"
  const Icon = ENGINE_ICONS[type]

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold",
        electric ? "bg-[#E7F8EF] text-[#15803D]" : "bg-[#EEF4FF] text-[#1766F2]",
        className
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      {ENGINE_LABELS[type]}
    </span>
  )
}
