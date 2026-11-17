"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { CURRENCIES, LOCALES, LOCALE_COOKIE, localeCookieOptions } from "@/i18n/config"
import { NOT_SIGNED_IN, type MutationResult } from "@/lib/server/auth"
import { removeUserFiles } from "@/lib/server/storage-cleanup"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { changePasswordSchema, fullNameSchema } from "@/lib/validation/auth"

const settingsPatchSchema = z
  .object({
    language: z.enum(LOCALES),
    currency: z.enum(CURRENCIES),
    email_reminders: z.boolean(),
    browser_notifications: z.boolean(),
    remind_when: z.enum(["due_soon", "overdue"]),
  })
  .partial()
  .strict()

async function currentUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return { supabase, claims: data?.claims ?? null }
}

/** Зберігає одне чи кілька налаштувань (upsert). Мова — ще й у cookie. */
export async function saveSettings(patch: z.input<typeof settingsPatchSchema>): Promise<MutationResult> {
  const parsed = settingsPatchSchema.safeParse(patch)
  if (!parsed.success || Object.keys(parsed.data).length === 0) return { ok: false, message: "errors.invalidRequest" }

  const { supabase, claims } = await currentUser()
  if (!claims) return NOT_SIGNED_IN

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: claims.sub, ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
  if (error) {
    console.error("saveSettings:", error.message)
    return { ok: false, message: "errors.settingsSaveFailed" }
  }

  if (parsed.data.language) (await cookies()).set(LOCALE_COOKIE, parsed.data.language, localeCookieOptions)
  // Мова й валюта впливають на весь застосунок
  if (parsed.data.language || parsed.data.currency) revalidatePath("/", "layout")
  return { ok: true }
}

/** Змінює ім'я в user_metadata.full_name. */
export async function updateFullName(name: string): Promise<MutationResult> {
  const parsed = fullNameSchema.safeParse(name)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const { supabase, claims } = await currentUser()
  if (!claims) return NOT_SIGNED_IN

  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data } })
  if (error) {
    console.error("updateFullName:", error.message)
    return { ok: false, message: "errors.saveChangesFailed" }
  }
  // Новий JWT з оновленим user_metadata — інакше каркас покаже старе ім'я до наступного оновлення токена
  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) console.error("updateFullName refresh:", refreshError.message)
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Зміна пароля: спершу перевіряємо поточний (signInWithPassword), потім оновлюємо. */
export async function changePassword(input: {
  currentPassword: string
  password: string
  confirmPassword: string
}): Promise<MutationResult> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "errors.checkFields", fieldErrors: z.flattenError(parsed.error).fieldErrors }

  const { supabase, claims } = await currentUser()
  if (!claims?.email) return NOT_SIGNED_IN

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: claims.email,
    password: parsed.data.currentPassword,
  })
  if (signInError) {
    return { ok: false, message: "errors.checkFields", fieldErrors: { currentPassword: ["errors.wrongPassword"] } }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    const code = error.code === "same_password" || error.code === "weak_password" ? error.code : "generic"
    return { ok: false, message: "errors.checkFields", fieldErrors: { password: [`auth.errors.${code}`] } }
  }
  return { ok: true }
}

/**
 * Видалення облікового запису: файли в Storage (car-photos, receipts, documents),
 * потім користувач в Auth (таблиці видаляються каскадом), вихід і редірект.
 */
export async function deleteAccount(confirmation: string): Promise<MutationResult> {
  if (confirmation !== "DELETE") return { ok: false, message: "validation.typeDelete" }

  const { supabase, claims } = await currentUser()
  if (!claims) return NOT_SIGNED_IN
  const userId = claims.sub

  try {
    const admin = createAdminClient()
    await removeUserFiles(admin, "car-photos", userId)
    await removeUserFiles(admin, "receipts", userId)
    await removeUserFiles(admin, "documents", userId)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) throw new Error(error.message)
  } catch (e) {
    console.error("deleteAccount:", e instanceof Error ? e.message : e)
    return { ok: false, message: "errors.deleteAccountFailed" }
  }

  // Сесія вже недійсна — лише прибираємо cookie
  await supabase.auth.signOut({ scope: "local" })
  redirect("/login?deleted=1")
}
