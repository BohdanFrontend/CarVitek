"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { authErrorMessage } from "@/lib/supabase/auth-errors"
import { createClient } from "@/lib/supabase/server"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth"

export type AuthFormState = {
  status: "idle" | "error" | "success"
  /** Загальне повідомлення над формою */
  message?: string
  /** Помилки окремих полів */
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

// ---------------------------------------------------------------- Вхід
export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const values = formValues(formData, ["email"])
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { status: "error", message: authErrorMessage(error), values }

  revalidatePath("/", "layout")
  redirect(safeNext(formData.get("next")))
}

// ---------------------------------------------------------------- Реєстрація
export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const values = formValues(formData, ["fullName", "email"])
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  }

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
  if (error) return { status: "error", message: authErrorMessage(error), values }

  // Якщо email уже зайнятий і підтвердження ввімкнене, Supabase не повертає помилку,
  // а віддає користувача без identities (захист від перебору адрес).
  if (data.user && data.user.identities?.length === 0) {
    return {
      status: "error",
      message: "Користувач із таким email уже зареєстрований.",
      values,
    }
  }

  // Підтвердження email вимкнене → сесія вже є, одразу заходимо
  if (data.session) {
    revalidatePath("/", "layout")
    redirect("/dashboard")
  }

  return {
    status: "success",
    message: `Ми надіслали лист на ${email}. Перейдіть за посиланням у ньому, щоб підтвердити акаунт.`,
  }
}

// ---------------------------------------------------------------- Забули пароль
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const values = formValues(formData, ["email"])
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/update-password`,
  })
  if (error) return { status: "error", message: authErrorMessage(error), values }

  // Не кажемо, чи існує акаунт, щоб не розкривати зареєстровані адреси
  return {
    status: "success",
    message: "Якщо акаунт із цим email існує, ми надіслали на нього посилання для зміни пароля.",
  }
}

// ---------------------------------------------------------------- Новий пароль
export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { status: "error", message: authErrorMessage(error) }

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
