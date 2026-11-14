"use client"

import { Lock, Mail } from "lucide-react"
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

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <div className={authCardClass}>
      <form action={formAction} className={authFormClass} noValidate>
        {linkError && state.status === "idle" && (
          <FormAlert
            status="error"
            message="This email link is invalid or has expired. Please try again."
          />
        )}
        {state.status === "error" && <FormAlert status="error" message={state.message} />}

        {next && <input type="hidden" name="next" value={next} />}

        <AuthField
          name="email"
          type="email"
          label="Email address"
          icon={Mail}
          autoComplete="email"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
          autoFocus
        />
        <AuthField
          name="password"
          type="password"
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          errors={state.fieldErrors?.password}
        />

        <AuthSubmit pending={pending}>Log in</AuthSubmit>
      </form>

      <div className={authLinkRowClass}>
        <Link href="/forgot-password" className={authLinkClass}>
          Forgot password?
        </Link>
      </div>

      <div className={authDividerClass}>
        <span className={authDividerLineClass} />
        or
        <span className={authDividerLineClass} />
      </div>

      <p className={authFooterClass}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className={authFooterLinkClass}>
          Sign up
        </Link>
      </p>
    </div>
  )
}
