import { Bell } from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { CarSwitcher, type SwitcherCar } from "./car-switcher"
import { UserMenu, type ShellUser } from "./user-menu"

type TopbarProps = {
  user: ShellUser
  cars: SwitcherCar[]
  activeCarId: string | null
  /** Кількість робіт ТО зі статусом «прострочено» або «скоро» для активного авто */
  alertCount: number
}

/**
 * Верхня панель.
 * Десктоп (lg+): 72px — селектор авто зліва, дзвіночок і аватар справа.
 * Мобільний: 60px — логотип, дзвіночок і аватар, під ними селектор авто на всю ширину.
 */
export function Topbar({ user, cars, activeCarId, alertCount }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E9F0] bg-white pt-[env(safe-area-inset-top)]">
      {/* Десктоп */}
      <div className="hidden h-[72px] items-center justify-between gap-6 px-8 lg:flex 3xl:h-20 3xl:px-10 4xl:h-24 4xl:px-12">
        <CarSwitcher cars={cars} activeCarId={activeCarId} className="w-full max-w-[360px] 3xl:h-14 3xl:max-w-[440px] 3xl:text-lg 4xl:h-16 4xl:max-w-[500px] 4xl:text-xl" />
        <div className="flex items-center gap-3">
          <NotificationsBell count={alertCount} />
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
          <div className="flex items-center gap-1.5">
            <NotificationsBell count={alertCount} />
            <UserMenu user={user} />
          </div>
        </div>
        <div className="px-4 pb-3">
          <CarSwitcher cars={cars} activeCarId={activeCarId} className="w-full" />
        </div>
      </div>
    </header>
  )
}

/** Дзвіночок з червоним бейджем; веде до планувальника ТО. */
function NotificationsBell({ count }: { count: number }) {
  const label =
    count > 0
      ? `Notifications: ${count} maintenance ${count === 1 ? "task needs" : "tasks need"} attention`
      : "Notifications"
  return (
    <Link
      href="/planner"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-full text-[#0B1220] transition-colors outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
    >
      <Bell className="size-5.5" strokeWidth={1.9} aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#EF4444] px-1 text-[11px] leading-none font-bold text-white ring-2 ring-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}
