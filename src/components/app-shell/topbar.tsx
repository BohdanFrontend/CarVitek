import { Bell } from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { CarSwitcher, type SwitcherCar } from "./car-switcher"
import { UserMenu, type ShellUser } from "./user-menu"

type TopbarProps = { user: ShellUser; cars: SwitcherCar[]; activeCarId: string | null }

/**
 * Верхня панель.
 * Десктоп (lg+): 72px — селектор авто зліва, дзвіночок і аватар справа.
 * Мобільний: 60px — логотип і аватар, під ними селектор авто на всю ширину.
 */
export function Topbar({ user, cars, activeCarId }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E9F0] bg-white pt-[env(safe-area-inset-top)]">
      {/* Десктоп */}
      <div className="hidden h-[72px] items-center justify-between gap-6 px-8 lg:flex">
        <CarSwitcher cars={cars} activeCarId={activeCarId} className="w-full max-w-[360px]" />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-[#0B1220] transition-colors outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
            aria-label="Notifications"
          >
            <Bell className="size-5.5" strokeWidth={1.9} aria-hidden />
          </button>
          <UserMenu user={user} />
        </div>
      </div>

      {/* Мобільний */}
      <div className="lg:hidden">
        <div className="flex h-[60px] items-center justify-between px-4">
          <Link
            href="/dashboard"
            aria-label="CarVitex — Dashboard"
            className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
          >
            <Logo className="text-[28px]" />
          </Link>
          <UserMenu user={user} />
        </div>
        <div className="px-4 pb-3">
          <CarSwitcher cars={cars} activeCarId={activeCarId} className="w-full" />
        </div>
      </div>
    </header>
  )
}
