"use client"

import { Lock, Mail, User } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useActionState } from "react"
import { cn } from "cn"

import { AuthField } from "@/components/auth/auth-field"
import {
  authCardClass,
  authDividerClass,
  authDividerLineClass,
  authFooterClass,
  authFooterLinkClass,
  authFormClass,
  authLinkClass,
} from "@/components/auth/auth-styles"
import { AuthSubmit } from "@/components/auth/auth-submit"
import { FormAlert } from "@/components/auth/form-alert"
import { signUp, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)
  const t = useTranslations("auth")

  // Лист для підтвердження надіслано — форму більше не показуємо
  if (state.status === "success") {
    return (
      <div className={cn(authCardClass, "grid gap-6")}>
        <FormAlert status="success" message={state.message} />
        <Link href="/login" className={cn(authLinkClass, "justify-self-center")}>
          {t("backToLogin")}
        </Link>
      </div>
    )
  }

  return (
    <div className={authCardClass}>
      <form action={formAction} className={authFormClass} noValidate>
        {state.status === "error" && <FormAlert status="error" message={state.message} />}

        <AuthField
          name="fullName"
          label={t("register.fullName")}
          icon={User}
          autoComplete="name"
          defaultValue={state.values?.fullName}
          errors={state.fieldErrors?.fullName}
          autoFocus
        />
        <AuthField
          name="email"
          type="email"
          label={t("email")}
          icon={Mail}
          autoComplete="email"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
        />
        <AuthField
          name="password"
          type="password"
          label={t("register.passwordHint")}
          icon={Lock}
          autoComplete="new-password"
          errors={state.fieldErrors?.password}
        />
        <AuthField
          name="confirmPassword"
          type="password"
          label={t("confirmPassword")}
          icon={Lock}
          autoComplete="new-password"
          errors={state.fieldErrors?.confirmPassword}
        />

        <AuthSubmit pending={pending}>{t("register.submit")}</AuthSubmit>
      </form>

      <div className={authDividerClass}>
        <span className={authDividerLineClass} />
        {t("or")}
        <span className={authDividerLineClass} />
      </div>

      <p className={authFooterClass}>
        {t("register.haveAccount")}{" "}
        <Link href="/login" className={authFooterLinkClass}>
          {t("register.logIn")}
        </Link>
      </p>
    </div>
  )
}
