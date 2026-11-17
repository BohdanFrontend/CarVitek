/** Мови інтерфейсу. Мова зберігається в cookie (без префіксів у URL) і в user_settings. */
export const LOCALES = ["en", "uk"] as const
export type AppLocale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "en"
export const LOCALE_COOKIE = "cv_locale"

export const isLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value)

/** Локаль для Intl. Для англійської — en-GB, щоб дата була «14 Sep 2026», а не «Sep 14, 2026». */
export const INTL_LOCALE: Record<AppLocale, string> = { en: "en-GB", uk: "uk-UA" }

export const localeCookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const

/** Валюти (символ змінюється, суми не конвертуються). */
export const CURRENCIES = ["UAH", "USD", "EUR"] as const
export type AppCurrency = (typeof CURRENCIES)[number]
export const isCurrency = (value: unknown): value is AppCurrency =>
  typeof value === "string" && (CURRENCIES as readonly string[]).includes(value)
export const CURRENCY_SYMBOLS: Record<AppCurrency, string> = { UAH: "₴", USD: "$", EUR: "€" }
