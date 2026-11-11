import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./database.types"

/**
 * Supabase-клієнт для Server Components, Server Actions і Route Handlers.
 * Створюється заново на кожен запит — не кешуй його в модулі.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Виклик із Server Component: там cookies змінювати не можна.
            // Це безпечно, бо сесію оновлює proxy.ts на кожному запиті.
          }
        },
      },
    }
  )
}
