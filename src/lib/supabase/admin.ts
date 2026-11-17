import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

/**
 * Адмін-клієнт Supabase (secret key, обходить RLS).
 * Лише для сервера — видалення облікового запису та файлів користувача.
 * Ніколи не імпортуй у клієнтський код ("server-only" зламає збірку).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set")
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
