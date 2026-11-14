import {
  CircleEllipsis,
  Droplets,
  Fuel,
  Hammer,
  Landmark,
  ParkingMeter,
  ShieldCheck,
  Siren,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { createElement } from "react"

import { CATEGORY_COLORS, type SpendCategory } from "@/lib/stats/categories"

const ICONS: Record<SpendCategory, LucideIcon> = {
  fuel: Fuel,
  maintenance: Wrench,
  repair: Hammer,
  insurance: ShieldCheck,
  wash: Droplets,
  parking: ParkingMeter,
  tax: Landmark,
  fine: Siren,
  other: CircleEllipsis,
}

/** Іконка категорії витрат у плитці кольору категорії. */
export function CategoryIcon({ category, size = "md" }: { category: SpendCategory; size?: "sm" | "md" }) {
  const color = CATEGORY_COLORS[category]
  return (
    <span
      aria-hidden
      className={size === "sm" ? "grid size-7 shrink-0 place-items-center rounded-[8px]" : "grid size-9 shrink-0 place-items-center rounded-[10px]"}
      style={{ backgroundColor: `${color}1F`, color }}
    >
      {createElement(ICONS[category], { className: size === "sm" ? "size-4" : "size-5", strokeWidth: 2 })}
    </span>
  )
}
