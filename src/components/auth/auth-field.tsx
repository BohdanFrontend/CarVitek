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
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#0B1220] lg:size-6"
          strokeWidth={1.75}
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
          className={cn(
            // мобільний: 52px, радіус 14px, текст 16px (не менше 16px — інакше iOS зумить)
            "h-[52px] rounded-[14px] border-[#D9E2F0] bg-[#F8FAFF] pr-4 pl-12 text-base text-[#0B1220] placeholder:text-[#6B7280] focus-visible:border-[#1766F2] focus-visible:ring-[3px] focus-visible:ring-[rgba(23,102,242,0.2)] md:text-base",
            // десктоп
            "lg:h-16 lg:rounded-[12px] lg:border-[#D9DEE7] lg:bg-white lg:pl-14 lg:text-[18px] lg:placeholder:text-[#5B6475] xl:h-[68px]",
            "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
            isPassword && "pr-14"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-1.5 grid size-11 -translate-y-1/2 lg:right-3 lg:size-10 place-items-center rounded-lg text-[#5B6475] transition-colors hover:text-[#0B1220] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
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
