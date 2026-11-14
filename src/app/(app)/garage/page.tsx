import { Car, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { PageTitle } from "@/components/app-shell/page-title"
import { AddCarButton, CarCard } from "@/components/cars/car-card"
import { getActiveCar } from "@/lib/cars/active-car"
import { getCarPhotoUrls } from "@/lib/cars/photos"
import { getMaintenancePlan } from "@/lib/dashboard/get-dashboard-data"
import { healthScore } from "@/lib/maintenance/plan"

export const metadata: Metadata = { title: "My Garage" }

export default async function GaragePage() {
  const { cars, activeCar } = await getActiveCar()

  if (!cars.length) {
    return (
      <div>
        <PageTitle>My Garage</PageTitle>
        <EmptyGarage />
      </div>
    )
  }

  // План ТО кожного авто (кешується за id) — для кругового індикатора стану
  const [photoUrls, plans] = await Promise.all([
    getCarPhotoUrls(cars.map((c) => c.photo_path)),
    Promise.all(cars.map((c) => getMaintenancePlan(c.id))),
  ])

  return (
    <div>
      <PageTitle>My Garage</PageTitle>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
        {cars.map((car, i) => (
          <CarCard
            key={car.id}
            active={car.id === activeCar?.id}
            car={{
              id: car.id,
              make: car.make,
              model: car.model,
              year: car.year,
              engine_type: car.engine_type,
              current_mileage: car.current_mileage,
              photoUrl: car.photo_path ? (photoUrls.get(car.photo_path) ?? null) : null,
              health: healthScore(plans[i]),
            }}
          />
        ))}
      </div>
      <div className="mt-5 lg:mt-6">
        <AddCarButton />
      </div>
    </div>
  )
}

function EmptyGarage() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-[20px] border border-[rgba(15,23,42,0.04)] bg-white px-6 py-16 text-center shadow-[0_10px_40px_rgba(15,23,42,0.08)] lg:py-20">
      <span className="grid size-20 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
        <Car className="size-9" strokeWidth={1.8} aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-bold text-[#0B1220]">No cars yet</h2>
      <p className="mt-1.5 max-w-sm text-[15px] text-[#5B6475]">
        Add your first car to start tracking its maintenance
      </p>
      <Link
        href="/garage/new"
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#1766F2] px-6 text-base font-semibold text-white transition-colors outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
      >
        <Plus className="size-5" aria-hidden />
        Add car
      </Link>
    </div>
  )
}
