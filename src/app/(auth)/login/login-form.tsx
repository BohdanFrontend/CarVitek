"use client"

import { Lock, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useActionState } from "react"

import { AuthField } from "@/components/auth/auth-field"
import {
  authCardClass,
  authDividerClass,
  authDividerLineClass,
  authFooterClass,
  authFooterLinkClass,
  authFormClass,
  authLinkClass,
  authLinkRowClass,
} from "@/components/auth/auth-styles"
import { AuthSubmit } from "@/components/auth/auth-submit"
import { FormAlert } from "@/components/auth/form-alert"
import { signIn, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

export function LoginForm({ next, linkError, deleted }: { next?: string; linkError?: boolean; deleted?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)
  const t = useTranslations("auth")

  return (
    <div className={authCardClass}>
      <form action={formAction} className={authFormClass} noValidate>
        {linkError && state.status === "idle" && (
          <FormAlert
            status="error"
            message={t("login.linkError")}
          />
        )}
        {deleted && state.status === "idle" && (
          <FormAlert status="success" message={t("login.accountDeleted")} />
        )}
        {state.status === "error" && <FormAlert status="error" message={state.message} />}

        {next && <input type="hidden" name="next" value={next} />}

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
        <AuthField
          name="password"
          type="password"
          label={t("password")}
          icon={Lock}
          autoComplete="current-password"
          errors={state.fieldErrors?.password}
        />

        <AuthSubmit pending={pending}>{t("login.submit")}</AuthSubmit>
      </form>

      <div className={authLinkRowClass}>
        <Link href="/forgot-password" className={authLinkClass}>
          {t("login.forgot")}
        </Link>
      </div>

      <div className={authDividerClass}>
        <span className={authDividerLineClass} />
        {t("or")}
        <span className={authDividerLineClass} />
      </div>

      <p className={authFooterClass}>
        {t("login.noAccount")}{" "}
        <Link href="/register" className={authFooterLinkClass}>
          {t("login.signUp")}
        </Link>
      </p>
    </div>
  )
}
