"use client"

import { Car, ChevronDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { setActiveCar } from "@/app/(app)/garage/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { carLabel } from "@/lib/cars/format"

export type SwitcherCar = { id: string; make: string; model: string; year: number | null }

/** Селектор активного авто у верхній панелі. */
export function CarSwitcher({
  cars,
  activeCarId,
  className,
}: {
  cars: SwitcherCar[]
  activeCarId: string | null
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [optimisticId, setOptimisticId] = useOptimistic(activeCarId)
  const active = cars.find((c) => c.id === optimisticId)

  const select = (id: string) => {
    if (id === optimisticId) return
    startTransition(async () => {
      setOptimisticId(id)
      const res = await setActiveCar(id)
      if (!res.ok) toast.error(res.message)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-12 min-w-0 items-center gap-3 rounded-[14px] border border-[#E5E9F0] bg-white px-4 text-left text-[15px] font-semibold text-[#0B1220] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-colors outline-none hover:bg-[#F8FAFF] focus-visible:border-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/20 data-popup-open:border-[#1766F2] lg:text-base",
          className
        )}
        aria-label={active ? `Active car: ${carLabel(active)}` : "Choose a car"}
      >
        <Car className="size-5 shrink-0" strokeWidth={1.9} aria-hidden />
        <span className={cn("min-w-0 flex-1 truncate", pending && "opacity-60")}>
          {active ? carLabel(active) : "No cars yet"}
        </span>
        <ChevronDown className="size-4.5 shrink-0 text-[#5B6475]" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={8} className="min-w-72 rounded-xl p-1.5">
        {cars.length > 0 && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2.5 text-xs font-semibold tracking-wide text-[#5B6475] uppercase">
                My cars
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={optimisticId ?? ""} onValueChange={select}>
                {cars.map((car) => (
                  <DropdownMenuRadioItem key={car.id} value={car.id} className="h-10 text-[15px]">
                    <span className="truncate">{carLabel(car)}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() => router.push("/garage/new")}
          className="h-10 gap-2 px-2.5 text-[15px] font-semibold text-[#1766F2] data-highlighted:text-[#1766F2]"
        >
          <Plus className="size-4.5 text-[#1766F2]" aria-hidden />
          Add car
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
