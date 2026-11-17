import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import type { BellItem } from "@/lib/notifications"
import { CarSwitcher, type SwitcherCar } from "./car-switcher"
import { MobileHeader } from "./mobile-header"
import { NotificationsBell } from "./notifications-bell"
import { UserMenu, type ShellUser } from "./user-menu"

type TopbarProps = {
  user: ShellUser
  cars: SwitcherCar[]
  activeCarId: string | null
  /** Роботи ТО (прострочені / скоро) і документи (прострочені / скоро) активного авто */
  alerts: BellItem[]
}

/**
 * Верхня панель.
 * Десктоп (lg+): 72px — селектор авто зліва, дзвіночок і аватар справа.
 * Мобільний: 60px — логотип, дзвіночок і аватар, під ними селектор авто на всю ширину
 * (на /settings і /documents — «← Назва 🔔», див. MobileHeader).
 */
export async function Topbar({ user, cars, activeCarId, alerts }: TopbarProps) {
  const t = await getTranslations("nav")
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E9F0] bg-white pt-[env(safe-area-inset-top)]">
      {/* Десктоп */}
      <div className="hidden h-[72px] items-center justify-between gap-6 px-8 lg:flex 3xl:h-20 3xl:px-10 4xl:h-24 4xl:px-12">
        <CarSwitcher cars={cars} activeCarId={activeCarId} className="w-full max-w-[360px] 3xl:h-14 3xl:max-w-[440px] 3xl:text-lg 4xl:h-16 4xl:max-w-[500px] 4xl:text-xl" />
        <div className="flex items-center gap-3">
          <NotificationsBell items={alerts} />
          <UserMenu user={user} />
        </div>
      </div>

      {/* Мобільний */}
      <div className="lg:hidden">
        <MobileHeader bell={<NotificationsBell items={alerts} />}>
          <div className="flex h-[60px] items-center justify-between px-4">
            <Link
              href="/dashboard"
              aria-label={t("logoHome")}
              className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
            >
              <Logo className="text-[28px]" />
            </Link>
            <div className="flex items-center gap-1.5">
              <NotificationsBell items={alerts} />
              <UserMenu user={user} />
            </div>
          </div>
          <div className="px-4 pb-3">
            <CarSwitcher cars={cars} activeCarId={activeCarId} className="w-full" />
          </div>
        </MobileHeader>
      </div>
    </header>
  )
}

