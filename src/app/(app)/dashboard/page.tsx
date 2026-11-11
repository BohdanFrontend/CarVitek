import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { signOut } from "@/app/(auth)/actions"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Головна" }

/** Тимчасова головна: перевірка, що вхід працює. Замінимо на дашборд з макета. */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) redirect("/login")

  const meta = claims.user_metadata as { full_name?: string } | undefined
  const name = meta?.full_name ?? claims.email

  const { count } = await supabase
    .from("maintenance_types")
    .select("*", { count: "exact", head: true })

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="text-3xl font-bold tracking-tight">Вітаємо, {name}!</h1>
      <p className="text-muted-foreground">
        Вхід працює. Довідник містить {count ?? 0} типових робіт ТО — база даних підключена.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline" className="h-10 px-5">
          Вийти
        </Button>
      </form>
    </main>
  )
}
