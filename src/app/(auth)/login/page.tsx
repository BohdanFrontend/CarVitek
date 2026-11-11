import type { Metadata } from "next"

import { AuthHeader } from "@/components/auth/auth-header"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Вхід" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = typeof params.next === "string" ? params.next : undefined
  const linkError = params.error === "link"

  return (
    <>
      <AuthHeader title="З поверненням" subtitle="Увійдіть у свій акаунт" />
      <LoginForm next={next} linkError={linkError} />
    </>
  )
}
