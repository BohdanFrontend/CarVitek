"use client"

import { Eye, EyeOff, type LucideIcon } from "lucide-react"
import { useId, useState } from "react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthFieldProps = {
  name: string
  label: string
  icon: LucideIcon
  type?: "text" | "email" | "password"
  autoComplete?: string
  defaultValue?: string
  errors?: string[]
  autoFocus?: boolean
}

/** Поле форми з іконкою зліва, як на макеті; для пароля — кнопка «показати». */
export function AuthField({
  name,
  label,
  icon: Icon,
  type = "text",
  autoComplete,
  defaultValue,
  errors,
  autoFocus,
}: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [visible, setVisible] = useState(false)
  const isPassword = type === "password"
  const hasError = Boolean(errors?.length)

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          placeholder={label}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn("h-12 rounded-xl pl-11 text-base md:text-base", isPassword && "pr-11")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={visible ? "Приховати пароль" : "Показати пароль"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hasError && (
        <p id={errorId} className="text-sm text-destructive">
          {errors![0]}
        </p>
      )}
    </div>
  )
}
