"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { LOCALE_COOKIE, isLocale, localeCookieOptions } from "./config"

/** Перемикач EN | UA на сторінках входу: лише ставить cookie мови. */
export async function setLocaleCookie(locale: string) {
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, localeCookieOptions)
  revalidatePath("/", "layout")
}
