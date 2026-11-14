"use client"

import { Car, Check, CircleCheck, EllipsisVertical, Gauge, Pencil, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { deleteCar, setActiveCar } from "@/app/(app)/garage/actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { EngineType } from "@/lib/cars/format"
import { carName, formatMileage } from "@/lib/cars/format"
import { EngineBadge } from "./engine-badge"
import { HealthRing } from "./health-ring"

export type GarageCar = {
  id: string
  make: string
  model: string
  year: number | null
  engine_type: EngineType
  current_mileage: number
  photoUrl: string | null
  /** Оцінка стану ТО (0–100); null — робіт з історією ще немає */
  health: number | null
}

/** Біла картка з тінню як у картки входу. */
const cardClass =
  "rounded-[20px] border border-[rgba(15,23,42,0.04)] bg-white p-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] lg:rounded-[24px] lg:p-4"

export function CarCard({ car, active }: { car: GarageCar; active: boolean }) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, startDelete] = useTransition()
  const [activating, startActivate] = useTransition()
  const name = carName(car)

  const makeActive = () =>
    startActivate(async () => {
      const res = await setActiveCar(car.id)
      if (res.ok) toast.success(`${name} is now your active car`)
      else toast.error(res.message)
    })

  const remove = () =>
    startDelete(async () => {
      const res = await deleteCar(car.id)
      if (res.ok) {
        setConfirmOpen(false)
        toast.success(`${name} was deleted`)
      } else {
        toast.error(res.message)
      }
    })

  return (
    <article
      className={cn(
        cardClass,
        "relative transition-opacity",
        active && "outline-2 -outline-offset-1 outline-[#1766F2]",
        (deleting || activating) && "opacity-70"
      )}
      aria-label={active ? `${name} (active)` : name}
    >
      <div className="relative aspect-[12/5] overflow-hidden rounded-[14px] bg-[#EAF1FE] md:aspect-[16/10] lg:aspect-[3/2] lg:rounded-[16px]">
        {car.photoUrl ? (
          <Image
            src={car.photoUrl}
            alt={name}
            fill
            sizes="(min-width: 1280px) 520px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-[#8FB2F5]">
            <Car className="size-12 md:size-16 lg:size-20" strokeWidth={1.4} aria-hidden />
          </div>
        )}

        {active && (
          <span className="absolute top-2.5 left-2.5 inline-flex h-6 items-center gap-1 rounded-full bg-[#1766F2] px-2.5 text-xs font-semibold text-white shadow-sm lg:top-3 lg:left-3 lg:h-7 lg:px-3 lg:text-[13px]">
            <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
            Active
          </span>
        )}

        {/* Десктоп: ⋮ у кутку фото */}
        {actionsMenu(
          "absolute top-3 right-3 hidden size-10 rounded-full bg-white/92 shadow-[0_2px_8px_rgba(15,23,42,0.15)] backdrop-blur hover:bg-white lg:grid"
        )}
      </div>

      <div className="px-1.5 pt-3 pb-1 lg:px-2 lg:pt-4 lg:pb-2">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 truncate text-[17px] leading-snug font-bold text-[#0B1220] lg:text-[20px]">
            {name}
            {/* Мобільний: рік в одному рядку з назвою — картка нижча */}
            {car.year && <span className="lg:hidden"> · {car.year}</span>}
          </h2>
          {/* Мобільний: ⋮ праворуч від назви, під фото */}
          {actionsMenu("-mt-1 -mr-1.5 grid size-9 shrink-0 rounded-full hover:bg-[#F1F4F9] lg:hidden")}
        </div>
        <p className="hidden text-base text-[#5B6475] lg:mt-0.5 lg:block">{car.year ?? "—"}</p>
        <div className="mt-2 flex items-center gap-3 lg:mt-4">
          <EngineBadge type={car.engine_type} className="lg:h-8 lg:px-3 lg:text-sm" />
          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0B1220] lg:text-[17px]">
            <Gauge className="size-4 text-[#5B6475] lg:size-[18px]" aria-hidden />
            {formatMileage(car.current_mileage)}
          </span>
          {car.health != null && (
            <span className="-my-2 ml-auto">
              <HealthRing score={car.health} />
            </span>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !deleting && setConfirmOpen(open)}>
        <AlertDialogContent className="rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#0B1220]">
              Delete {name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] text-[#5B6475]">
              All service records, fuel logs and expenses for this car will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={remove}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )

  /** Меню дій картки; кнопка-тригер стоїть у різних місцях на мобільному і десктопі. */
  function actionsMenu(triggerClassName: string) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "place-items-center text-[#0B1220] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/40",
            triggerClassName
          )}
          aria-label={`Actions for ${name}`}
        >
          <EllipsisVertical className="size-5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
          <DropdownMenuItem
            onClick={() => router.push(`/garage/${car.id}/edit`)}
            className="h-10 gap-2.5 px-2.5 text-[15px]"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={active}
            onClick={makeActive}
            className="h-10 gap-2.5 px-2.5 text-[15px]"
          >
            <CircleCheck className="size-4" aria-hidden />
            Set as active
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="h-10 gap-2.5 px-2.5 text-[15px]"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
}

/** Горизонтальна кнопка «+ Add car» на всю ширину під сіткою карток (як у макеті). */
export function AddCarButton() {
  return (
    <Link
      href="/garage/new"
      className="flex h-16 items-center justify-center gap-2.5 rounded-[16px] border-2 border-dashed border-[#B9C7E6] text-lg font-bold text-[#1766F2] transition-colors outline-none hover:border-[#1766F2] hover:bg-[#EEF4FF]/60 focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 lg:h-[72px] lg:text-xl"
    >
      <Plus className="size-6 lg:size-7" strokeWidth={2.4} aria-hidden />
      Add car
    </Link>
  )
}
