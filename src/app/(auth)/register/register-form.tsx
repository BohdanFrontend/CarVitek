"use client"

import { Loader2, Lock, Mail, User } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { signUp, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  // Лист для підтвердження надіслано — форму більше не показуємо
  if (state.status === "success") {
    return (
      <div className="grid gap-6">
        <FormAlert status="success" message={state.message} />
        <Link
          href="/login"
          className="text-center text-sm font-semibold text-primary hover:underline"
        >
          Повернутися до входу
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state.status === "error" && <FormAlert status="error" message={state.message} />}

      <AuthField
        name="fullName"
        label="Ім'я"
        icon={User}
        autoComplete="name"
        defaultValue={state.values?.fullName}
        errors={state.fieldErrors?.fullName}
        autoFocus
      />
      <AuthField
        name="email"
        type="email"
        label="Email"
        icon={Mail}
        autoComplete="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <AuthField
        name="password"
        type="password"
        label="Пароль (мін. 8 символів, літера й цифра)"
        icon={Lock}
        autoComplete="new-password"
        errors={state.fieldErrors?.password}
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
        Зареєструватися
      </Button>

      <p className="mt-2 text-center text-sm text-muted-foreground">
        Вже маєте акаунт?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Увійти
        </Link>
      </p>
    </form>
  )
}
