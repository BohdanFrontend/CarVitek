import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

import { getStoredSettings } from "@/lib/settings"
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config"

/**
 * next-intl без i18n-маршрутизації.
 * Мова: для увійшовшого користувача — з user_settings (джерело правди, однакова на всіх пристроях),
 * інакше — з cookie cv_locale (перемикач EN | UA на сторінках входу).
 */
export default getRequestConfig(async () => {
  const [stored, cookieStore] = await Promise.all([getStoredSettings(), cookies()])
  const value = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = stored?.language ?? (isLocale(value) ? value : DEFAULT_LOCALE)
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Europe/Kyiv",
  }
})
