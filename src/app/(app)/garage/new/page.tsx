import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

import { BackToGarage } from "@/components/cars/back-link"
import { CarForm } from "@/components/cars/car-form"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("garage.form"))("addTitle") }
}

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
