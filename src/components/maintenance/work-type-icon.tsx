import {
  BatteryCharging,
  Cog,
  Crosshair,
  CircleDot,
  Disc,
  Droplet,
  Droplets,
  Filter,
  Settings2,
  Thermometer,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { createElement } from "react"
import { cn } from "cn"

const ICONS: Record<string, LucideIcon> = {
  engine_oil: Droplet,
  air_filter: Filter,
  cabin_filter: Filter,
  fuel_filter: Filter,
  lpg_filters: Filter,
  spark_plugs: Zap,
  brake_pads: Disc,
  brake_fluid: Droplets,
  coolant: Thermometer,
  timing_belt: Cog,
  gearbox_oil: Settings2,
  tire_rotation: CircleDot,
  wheel_alignment: Crosshair,
  battery: BatteryCharging,
}

/** Колір плитки іконки за кодом — щоб роботи легко розрізнялися в списках. */
const TONES: Record<string, string> = {
  engine_oil: "bg-[#FEF3C7] text-[#B45309]",
  gearbox_oil: "bg-[#FEF3C7] text-[#B45309]",
  brake_pads: "bg-[#FEE2E2] text-[#DC2626]",
  brake_fluid: "bg-[#FEE2E2] text-[#DC2626]",
  coolant: "bg-[#E0F2FE] text-[#0284C7]",
  battery: "bg-[#DCFCE7] text-[#15803D]",
  spark_plugs: "bg-[#EDE9FE] text-[#7C3AED]",
}

export const workTypeIcon = (code: string | null): LucideIcon => (code && ICONS[code]) || Wrench

/** Іконка типу роботи ТО в кольоровій плитці; власні типи — Wrench. */
export function WorkTypeIcon({
  code,
  size = "md",
  className,
}: {
  code: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}) {

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-[10px]",
        (code && TONES[code]) || "bg-[#EEF3FE] text-[#1766F2]",
        size === "sm" && "size-7 rounded-[8px]",
        size === "md" && "size-9",
        size === "lg" && "size-11 rounded-[12px]",
        className
      )}
    >
      {createElement(workTypeIcon(code), {
        className: size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5",
        strokeWidth: 2,
      })}
    </span>
  )
}
