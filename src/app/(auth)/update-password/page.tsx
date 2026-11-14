"use client"

import { Lock } from "lucide-react"
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

  return (
    <>
      <AuthHeader title="New password" subtitle="Choose a new password for your account" />
      <div className={authCardClass}>
        <form action={formAction} className={authFormClass} noValidate>
          {state.status === "error" && <FormAlert status="error" message={state.message} />}
          <AuthField
            name="password"
            type="password"
            label="New password"
            icon={Lock}
            autoComplete="new-password"
            errors={state.fieldErrors?.password}
            autoFocus
          />
          <AuthField
            name="confirmPassword"
            type="password"
            label="Confirm password"
            icon={Lock}
            autoComplete="new-password"
            errors={state.fieldErrors?.confirmPassword}
          />
          <AuthSubmit pending={pending}>Save password</AuthSubmit>
        </form>
      </div>
    </>
  )
}
