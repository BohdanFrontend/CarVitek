import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AuthHeader } from "@/components/auth/auth-header"
import { LoginForm } from "./login-form"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.login"))("metaTitle") }
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = typeof params.next === "string" ? params.next : undefined
  const linkError = params.error === "link"
  const deleted = params.deleted === "1"
  const t = await getTranslations("auth.login")

  return (
    <>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />
      <LoginForm next={next} linkError={linkError} deleted={deleted} />
    </>
  )
}
