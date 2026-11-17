import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AuthHeader } from "@/components/auth/auth-header"
import { RegisterForm } from "./register-form"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.register"))("metaTitle") }
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register")
  return (
    <>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />
      <RegisterForm />
    </>
  )
}
