import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AccountCard } from "@/components/settings/account-card"
import { ExportCard } from "@/components/settings/export-card"
import { NotificationsCard, PreferencesCard } from "@/components/settings/preferences-cards"
import { ProfileCard } from "@/components/settings/profile-card"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getExchangeRates } from "@/lib/exchange-rates"
import { getUserSettings } from "@/lib/settings"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settings"))("title") }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const [{ data }, settings, { cars, activeCar }, t, rates] = await Promise.all([
    supabase.auth.getClaims(),
    getUserSettings(),
    getActiveCar(),
    getTranslations("settings"),
    getExchangeRates(),
  ])
  const claims = data?.claims
  const meta = claims?.user_metadata as { full_name?: string } | undefined

  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-4 lg:gap-5">
      {/* На мобільному заголовок — у верхній панелі */}
      <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220] max-lg:sr-only">
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <ProfileCard name={meta?.full_name?.trim() ?? ""} email={claims?.email ?? ""} />
        <PreferencesCard settings={settings} rates={rates} />
        <NotificationsCard settings={settings} />
        <ExportCard cars={cars.map((c) => ({ id: c.id, label: carLabel(c) }))} activeCarId={activeCar?.id ?? null} />
        <AccountCard />
      </div>
    </div>
  )
}
