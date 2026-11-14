import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "cn"

/** Поле вводу застосунку (48px, radius 12px). З іконкою зліва — pl-12, без неї — додай pl-4. */
export const inputClass =
  "h-12 w-full rounded-[12px] border border-[#D9DEE7] bg-white pr-4 pl-12 text-base text-[#0B1220] transition-colors outline-none placeholder:text-[#8A93A3] focus-visible:border-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/20 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20"

/** Багаторядкове поле (коментар). */
export const textareaClass = cn(
  inputClass,
  "h-auto min-h-24 resize-y py-3 pl-4 leading-relaxed"
)

/** Атрибути доступності для поля з помилкою/підказкою. */
export const fieldA11y = (id: string, error?: string, hint?: boolean) => ({
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
})

/** Підпис, поле (з іконкою зліва, якщо передано icon), підказка або помилка. */
export function Field({
  id,
  label,
  icon: Icon,
  optional,
  hint,
  error,
  asGroup,
  className,
  children,
}: {
  className?: string
  icon?: LucideIcon
  id: string
  label: string
  optional?: boolean
  hint?: ReactNode
  error?: string
  /** Для групи (radiogroup): підпис — не <label>, а заголовок, на який посилається aria-labelledby */
  asGroup?: boolean
  children: ReactNode
}) {
  const labelContent = (
    <>
      {label}
      {optional && <span className="font-normal text-[#5B6475]"> (optional)</span>}
    </>
  )
  return (
    <div className={cn("grid content-start gap-2", className)}>
      {asGroup ? (
        <span id={`${id}-label`} className="text-[15px] font-semibold text-[#0B1220]">
          {labelContent}
        </span>
      ) : (
        <label htmlFor={id} className="text-[15px] font-semibold text-[#0B1220]">
          {labelContent}
        </label>
      )}
      {Icon ? (
        // Іконка поверх поля, але не перехоплює кліки (pointer-events-none)
        <div className="relative">
          {children}
          <Icon
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#5B6475]"
            strokeWidth={1.9}
            aria-hidden
          />
        </div>
      ) : (
        children
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[13px] text-[#5B6475]">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
