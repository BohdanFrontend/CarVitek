"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { cn } from "cn"

import { setLocaleCookie } from "@/i18n/actions"
import type { AppLocale } from "@/i18n/config"

const OPTIONS: { value: AppLocale; label: string; full: string }[] = [
  { value: "en", label: "EN", full: "English" },
  { value: "uk", label: "UA", full: "Українська" },
]

/** Маленький перемикач EN | UA на сторінках входу: лише ставить cookie мови. */
export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale()
  const t = useTranslations("auth")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const change = (next: AppLocale) => {
    if (next === locale) return
    startTransition(async () => {
      await setLocaleCookie(next)
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("inline-flex rounded-full border border-[#D9E2F0] bg-white/80 p-0.5 backdrop-blur", pending && "opacity-60", className)}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          onClick={() => change(o.value)}
          aria-pressed={o.value === locale}
          aria-label={o.full}
          className={cn(
            "h-8 min-w-11 rounded-full px-2.5 text-[13px] font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
            o.value === locale ? "bg-[#1766F2] text-white" : "text-[#5B6475] hover:text-[#0B1220]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
