"use server"

import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { z } from "zod"

import { LOCALE_COOKIE, isLocale, localeCookieOptions } from "@/i18n/config"
import { getMessageText, translateFieldErrors } from "@/i18n/server-messages"
import { authErrorKey } from "@/lib/supabase/auth-errors"
import { createClient } from "@/lib/supabase/server"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth"

export type AuthFormState = {
  status: "idle" | "error" | "success"
  /** Загальне повідомлення над формою (уже перекладене) */
  message?: string
  /** Помилки окремих полів (уже перекладені) */
  fieldErrors?: Record<string, string[] | undefined>
  /** Значення, які повертаємо у форму після помилки (без паролів) */
  values?: Record<string, string>
}

const formValues = (formData: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]))

/** Дозволяємо редірект лише на внутрішні шляхи. */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : ""
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
}

async function siteOrigin() {
  const h = await headers()
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

/** Помилки zod → перекладені повідомлення полів. */
const invalid = async (error: z.ZodError, values?: Record<string, string>): Promise<AuthFormState> => ({
  status: "error",
  fieldErrors: await translateFieldErrors(z.flattenError(error).fieldErrors),
  values,
})

const failure = async (key: string, values?: Record<string, string>): Promise<AuthFormState> => ({
  status: "error",
  message: (await getMessageText())(key),
  values,
})

/**
 * Після входу мова інтерфейсу береться зі збережених налаштувань (якщо вони є),
 * а якщо налаштувань ще немає — поточна мова зберігається в них.
 */
async function syncLocale(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("user_settings").select("language").eq("user_id", userId).maybeSingle()
  const cookieStore = await cookies()
  if (data && isLocale(data.language)) {
    cookieStore.set(LOCALE_COOKIE, data.language, localeCookieOptions)
  } else {
    await supabase.from("user_settings").upsert({ user_id: userId, language: await getLocale() })
  }
}

// ---------------------------------------------------------------- Вхід
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = formValues(formData, ["email"])
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return failure(authErrorKey(error), values)

  await syncLocale(supabase, data.user.id)
  revalidatePath("/", "layout")
  redirect(safeNext(formData.get("next")))
}

// ---------------------------------------------------------------- Реєстрація
export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = formValues(formData, ["fullName", "email"])
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, values)

  const { email, password, fullName } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard`,
    },
  })
  if (error) return failure(authErrorKey(error), values)

  // Якщо email уже зайнятий і підтвердження ввімкнене, Supabase не повертає помилку,
  // а віддає користувача без identities (захист від перебору адрес).
  if (data.user && data.user.identities?.length === 0) return failure("auth.register.emailTaken", values)

  // Підтвердження email вимкнене → сесія вже є, одразу заходимо (мову зберігаємо в налаштування)
  if (data.session && data.user) {
    await syncLocale(supabase, data.user.id)
    revalidatePath("/", "layout")
    redirect("/dashboard")
  }

  const text = await getMessageText()
  return { status: "success", message: text(`auth.register.checkEmail|${JSON.stringify({ email })}`) }
}

// ---------------------------------------------------------------- Забули пароль
export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = formValues(formData, ["email"])
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/update-password`,
  })
  if (error) return failure(authErrorKey(error), values)

  // Не кажемо, чи існує акаунт, щоб не розкривати зареєстровані адреси
  return { status: "success", message: (await getMessageText())("auth.forgot.sent") }
}

// ---------------------------------------------------------------- Новий пароль
export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return failure(authErrorKey(error))

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

// ---------------------------------------------------------------- Вихід
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
