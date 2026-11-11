"use client"

import { Loader2, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { signIn, type AuthFormState } from "../actions"

const initialState: AuthFormState = { status: "idle" }

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {linkError && state.status === "idle" && (
        <FormAlert
          status="error"
          message="Посилання з листа недійсне або застаріло. Спробуйте ще раз."
        />
      )}
      {state.status === "error" && <FormAlert status="error" message={state.message} />}

      {next && <input type="hidden" name="next" value={next} />}

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
      <AuthField
        name="password"
        type="password"
        label="Пароль"
        icon={Lock}
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
      />

      <Button type="submit" disabled={pending} className="mt-2 h-12 rounded-xl text-base">
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Увійти
      </Button>

      <Link
        href="/forgot-password"
        className="justify-self-center rounded text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Забули пароль?
      </Link>

      <div className="my-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        або
        <span className="h-px flex-1 bg-border" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Ще немає акаунта?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Зареєструватися
        </Link>
      </p>
    </form>
  )
}
