"use client"

import { Loader2, Lock } from "lucide-react"
import { useActionState } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { AuthHeader } from "@/components/auth/auth-header"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { updatePassword, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

/** Сюди веде посилання з листа відновлення (через /auth/callback, уже з сесією). */
export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState)

  return (
    <>
      <AuthHeader title="Новий пароль" subtitle="Придумайте новий пароль для акаунта" />
      <form action={formAction} className="grid gap-4" noValidate>
        {state.status === "error" && <FormAlert status="error" message={state.message} />}
        <AuthField
          name="password"
          type="password"
          label="Новий пароль"
          icon={Lock}
          autoComplete="new-password"
          errors={state.fieldErrors?.password}
          autoFocus
        />
        <AuthField
          name="confirmPassword"
          type="password"
          label="Повторіть пароль"
          icon={Lock}
          autoComplete="new-password"
          errors={state.fieldErrors?.confirmPassword}
        />
        <Button type="submit" disabled={pending} className="mt-2 h-12 rounded-xl text-base">
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Зберегти пароль
        </Button>
      </form>
    </>
  )
}
