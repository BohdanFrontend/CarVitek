import type { Viewport } from "next"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { MobileNav } from "@/components/app-shell/mobile-nav"
import { Sidebar } from "@/components/app-shell/sidebar"
import { Topbar } from "@/components/app-shell/topbar"
import { Toaster } from "@/components/ui/sonner"
import { getActiveCar } from "@/lib/cars/active-car"
import { getAttentionCount } from "@/lib/dashboard/get-dashboard-data"
import { createClient } from "@/lib/supabase/server"

export const viewport: Viewport = { themeColor: "#FFFFFF" }

/**
 * Каркас застосунку для увійшовшого користувача.
 * Десктоп (lg+): бічне меню 260px + верхня панель 72px + контент.
 * Мобільний: верхня панель із селектором авто + нижня таб-панель.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) redirect("/login")

  const meta = claims.user_metadata as { full_name?: string } | undefined
  const user = { name: meta?.full_name?.trim() ?? "", email: claims.email ?? "" }

  const { cars, activeCar } = await getActiveCar()
  const switcherCars = cars.map(({ id, make, model, year }) => ({ id, make, model, year }))
  // План ТО кешується в межах запиту — дашборд не рахує його вдруге
  const alertCount = activeCar ? await getAttentionCount(activeCar.id) : 0

  return (
    <div className="flex w-full flex-1 bg-[#F5F7FB]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          cars={switcherCars}
          activeCarId={activeCar?.id ?? null}
          alertCount={alertCount}
        />
        {/* Нижній відступ на мобільному — під таб-панель (64px + safe area) */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 2xl:max-w-[1560px] 3xl:max-w-[1880px] 4xl:max-w-[2280px] px-4 pt-5 pb-[calc(64px+env(safe-area-inset-bottom)+24px)] lg:p-8 3xl:p-10 4xl:p-12">
          {children}
        </main>
      </div>

      <MobileNav />
      <Toaster theme="light" position="top-center" richColors />
    </div>
  )
}
