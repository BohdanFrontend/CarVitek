"use client"

import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"

/** Сторінки з власною мобільною шапкою «← Назва 🔔» замість логотипа й селектора авто. */
const PAGE_TITLES = { "/settings": "settings", "/documents": "documents" } as const

/** Мобільна шапка: звичайна (children) або «назад + заголовок + дзвіночок» для окремих сторінок. */
export function MobileHeader({ bell, children }: { bell: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("nav")
  const ts = useTranslations("settings")
  const key = PAGE_TITLES[pathname as keyof typeof PAGE_TITLES]
  if (!key) return children

  const back = () => {
    // Назад в історії, якщо прийшли зі сторінки застосунку; інакше — на головну
    const internal = document.referrer && new URL(document.referrer).origin === location.origin
    if (internal && window.history.length > 1) router.back()
    else router.push("/dashboard")
  }

  return (
    <div className="grid h-[60px] grid-cols-[44px_1fr_44px] items-center px-2">
      <button
        type="button"
        onClick={back}
        aria-label={ts("back")}
        className="grid size-11 place-items-center rounded-full text-[#0B1220] outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
      >
        <ArrowLeft className="size-5.5" aria-hidden />
      </button>
      <p className="truncate text-center text-lg font-bold text-[#0B1220]">{t(key)}</p>
      {bell}
    </div>
  )
}
