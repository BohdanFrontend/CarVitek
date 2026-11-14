import type { Metadata } from "next"

import { AuthHeader } from "@/components/auth/auth-header"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Log in" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = typeof params.next === "string" ? params.next : undefined
  const linkError = params.error === "link"

  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Sign in to your account" />
      <LoginForm next={next} linkError={linkError} />
    </>
  )
}
