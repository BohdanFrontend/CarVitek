import { cache } from "react"

import { isCurrency, isLocale, type AppCurrency, type AppLocale } from "@/i18n/config"
import { createClient } from "@/lib/supabase/server"

export type RemindWhen = "due_soon" | "overdue"

export type UserSettings = {
  language: AppLocale
  currency: AppCurrency
  email_reminders: boolean
  browser_notifications: boolean
  remind_when: RemindWhen
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: "en",
  currency: "UAH",
  email_reminders: true,
  browser_notifications: false,
  remind_when: "due_soon",
}

/**
 * Збережені налаштування поточного користувача або null (не увійшов / рядка ще немає).
 * cache() — один запит на рендер (його ділять i18n/request.ts, layout і сторінки).
 */
export const getStoredSettings = cache(async (): Promise<UserSettings | null> => {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return null

  const { data, error } = await supabase
    .from("user_settings")
    .select("language, currency, email_reminders, browser_notifications, remind_when")
    .eq("user_id", auth.claims.sub)
    .maybeSingle()
  if (error) console.error("getStoredSettings:", error.message)
  if (!data) return null

  return {
    language: isLocale(data.language) ? data.language : DEFAULT_SETTINGS.language,
    currency: isCurrency(data.currency) ? data.currency : DEFAULT_SETTINGS.currency,
    email_reminders: data.email_reminders,
    browser_notifications: data.browser_notifications,
    remind_when: data.remind_when === "overdue" ? "overdue" : "due_soon",
  }
})

/** Налаштування поточного користувача; без збереженого рядка — значення за замовчуванням. */
export const getUserSettings = cache(async (): Promise<UserSettings> => (await getStoredSettings()) ?? DEFAULT_SETTINGS)
