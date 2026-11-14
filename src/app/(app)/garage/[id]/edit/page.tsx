import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { z } from "zod"

import { BackToGarage } from "@/components/cars/back-link"
import { CarForm } from "@/components/cars/car-form"
import { getCarPhotoUrls } from "@/lib/cars/photos"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Edit car" }

export default async function EditCarPage({ params }: PageProps<"/garage/[id]/edit">) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect("/login")

  // RLS поверне авто лише власнику
  const { data: car } = await supabase.from("cars").select("*").eq("id", id).maybeSingle()
  if (!car) notFound()

  const photoUrls = await getCarPhotoUrls([car.photo_path])

  return (
    <div className="mx-auto max-w-[880px]">
      <BackToGarage />
      <CarForm
        userId={userId}
        car={{
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          engine_type: car.engine_type,
          current_mileage: car.current_mileage,
          plate_number: car.plate_number,
          vin: car.vin,
          photo_path: car.photo_path,
          photoUrl: car.photo_path ? (photoUrls.get(car.photo_path) ?? null) : null,
        }}
      />
    </div>
  )
}
