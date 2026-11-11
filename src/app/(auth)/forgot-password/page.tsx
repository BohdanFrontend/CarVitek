"use client"

import { ArrowLeft, Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { AuthHeader } from "@/components/auth/auth-header"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { requestPasswordReset, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState)

  return (
    <>
      <AuthHeader
        title="Відновлення пароля"
        subtitle="Вкажіть email — надішлемо посилання для зміни пароля"
      />

      {state.status === "success" ? (
        <FormAlert status="success" message={state.message} />
      ) : (
        <form action={formAction} className="grid gap-4" noValidate>
          {state.status === "error" && <FormAlert status="error" message={state.message} />}
          <AuthField
            name="email"
            type="email"
            label="Email"
            icon={Mail}
            autoComplete="email"
            defaultValue={state.values?.email}
            errors={state.fieldErrors?.email}
            autoFocus
          />
          <Button type="submit" disabled={pending} className="mt-2 h-12 rounded-xl text-base">
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Надіслати посилання
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Повернутися до входу
      </Link>
    </>
  )
}
