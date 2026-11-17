"use client"

import { ArrowLeft, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useActionState } from "react"
import { cn } from "cn"

import { AuthField } from "@/components/auth/auth-field"
import { AuthHeader } from "@/components/auth/auth-header"
import { authCardClass, authFormClass, authLinkClass } from "@/components/auth/auth-styles"
import { AuthSubmit } from "@/components/auth/auth-submit"
import { FormAlert } from "@/components/auth/form-alert"
import { requestPasswordReset, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState)
  const t = useTranslations("auth")

  return (
    <>
      <AuthHeader title={t("forgot.title")} subtitle={t("forgot.subtitle")} />

      <div className={authCardClass}>
        {state.status === "success" ? (
          <FormAlert status="success" message={state.message} />
        ) : (
          <form action={formAction} className={authFormClass} noValidate>
            {state.status === "error" && <FormAlert status="error" message={state.message} />}
            <AuthField
              name="email"
              type="email"
              label={t("email")}
              icon={Mail}
              autoComplete="email"
              defaultValue={state.values?.email}
              errors={state.fieldErrors?.email}
              autoFocus
            />
            <AuthSubmit pending={pending}>{t("forgot.submit")}</AuthSubmit>
          </form>
        )}

        <div className="mt-3.5 flex justify-center lg:mt-6">
          <Link href="/login" className={cn(authLinkClass, "inline-flex items-center gap-2")}>
            <ArrowLeft className="size-5" aria-hidden />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </>
  )
}
