"use client"

import { Lock, Mail, User } from "lucide-react"
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

  // Лист для підтвердження надіслано — форму більше не показуємо
  if (state.status === "success") {
    return (
      <div className={cn(authCardClass, "grid gap-6")}>
        <FormAlert status="success" message={state.message} />
        <Link href="/login" className={cn(authLinkClass, "justify-self-center")}>
          Back to log in
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
          label="Full name"
          icon={User}
          autoComplete="name"
          defaultValue={state.values?.fullName}
          errors={state.fieldErrors?.fullName}
          autoFocus
        />
        <AuthField
          name="email"
          type="email"
          label="Email address"
          icon={Mail}
          autoComplete="email"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
        />
        <AuthField
          name="password"
          type="password"
          label="Password (min. 8 chars, a letter and a digit)"
          icon={Lock}
          autoComplete="new-password"
          errors={state.fieldErrors?.password}
        />
        <AuthField
          name="confirmPassword"
          type="password"
          label="Confirm password"
          icon={Lock}
          autoComplete="new-password"
          errors={state.fieldErrors?.confirmPassword}
        />

        <AuthSubmit pending={pending}>Sign up</AuthSubmit>
      </form>

      <div className={authDividerClass}>
        <span className={authDividerLineClass} />
        or
        <span className={authDividerLineClass} />
      </div>

      <p className={authFooterClass}>
        Already have an account?{" "}
        <Link href="/login" className={authFooterLinkClass}>
          Log in
        </Link>
      </p>
    </div>
  )
}
