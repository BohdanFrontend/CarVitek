import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { BackToGarage } from "@/components/cars/back-link"
import { CarForm } from "@/components/cars/car-form"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Add a car" }

export default async function NewCarPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect("/login")

  return (
    <div className="mx-auto max-w-[880px]">
      <BackToGarage />
      <CarForm userId={userId} />
    </div>
  )
}
