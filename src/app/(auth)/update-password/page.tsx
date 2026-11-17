"use client"

import { Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { useActionState } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { AuthHeader } from "@/components/auth/auth-header"
import { authCardClass, authFormClass } from "@/components/auth/auth-styles"
import { AuthSubmit } from "@/components/auth/auth-submit"
import { FormAlert } from "@/components/auth/form-alert"
import { updatePassword, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

/** Сюди веде посилання з листа відновлення (через /auth/callback, уже з сесією). */
export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState)
  const t = useTranslations("auth")

  return (
    <>
      <AuthHeader title={t("update.title")} subtitle={t("update.subtitle")} />
      <div className={authCardClass}>
        <form action={formAction} className={authFormClass} noValidate>
          {state.status === "error" && <FormAlert status="error" message={state.message} />}
          <AuthField
            name="password"
            type="password"
            label={t("update.newPassword")}
            icon={Lock}
            autoComplete="new-password"
            errors={state.fieldErrors?.password}
            autoFocus
          />
          <AuthField
            name="confirmPassword"
            type="password"
            label={t("confirmPassword")}
            icon={Lock}
            autoComplete="new-password"
            errors={state.fieldErrors?.confirmPassword}
          />
          <AuthSubmit pending={pending}>{t("update.submit")}</AuthSubmit>
        </form>
      </div>
    </>
  )
}
