"use client"

import { Check, KeyRound, Loader2, Lock, Pencil, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useId, useRef, useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { changePassword, updateFullName } from "@/app/(app)/settings/actions"
import { Field, fieldA11y, inputClass } from "@/components/forms/field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMessageText } from "@/i18n/use-message"
import { changePasswordSchema, fullNameSchema } from "@/lib/validation/auth"
import { settingsCardClass, settingsTitleClass, outlineButtonClass } from "./styles"

/** «Ivan Petrenko» → «IP»; без імені — перша літера email. */
function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length ? parts.slice(0, 2).map((p) => p[0]) : [email[0] ?? "?"]
  return letters.join("").toUpperCase()
}

/** Профіль: аватар з ініціалами, ім'я (редагується на місці), email і «Change password». */
export function ProfileCard({ name, email }: { name: string; email: string }) {
  const t = useTranslations("settings.profile")
  const text = useMessageText()
  const router = useRouter()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [passwordOpen, setPasswordOpen] = useState(false)
  // Нове ім'я показуємо одразу, не чекаючи оновлення JWT і каркаса
  const [savedName, setSavedName] = useState<string | null>(null)
  const shownName = savedName ?? name

  const startEdit = () => {
    setDraft(shownName)
    setError(null)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const parsed = fullNameSchema.safeParse(draft)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    if (parsed.data === shownName) return setEditing(false)
    startTransition(async () => {
      const res = await updateFullName(parsed.data)
      if (!res.ok) return setError(res.message)
      setSavedName(parsed.data)
      setEditing(false)
      toast.success(t("nameSaved"))
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="profile-title" className={settingsCardClass}>
      <h2 id="profile-title" className={settingsTitleClass}>
        {t("title")}
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full bg-[#E8F0FE] text-xl font-bold text-[#1766F2] lg:size-[72px] lg:text-2xl"
        >
          {initials(editing ? draft : shownName, email)}
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={save} noValidate className="grid gap-1.5">
              <label htmlFor={inputId} className="sr-only">
                {t("nameLabel")}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  id={inputId}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
                  autoComplete="name"
                  maxLength={60}
                  disabled={pending}
                  {...fieldA11y(inputId, error ?? undefined)}
                  className={cn(inputClass, "h-11 min-w-0 flex-1 pl-3 text-[17px] font-semibold")}
                />
                <button
                  type="submit"
                  disabled={pending}
                  aria-label={t("saveName")}
                  className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[#1766F2] text-white outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Check className="size-5" aria-hidden />}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditing(false)}
                  aria-label={t("cancelEdit")}
                  className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[#5B6475] outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              {error && (
                <p id={`${inputId}-error`} role="alert" className="text-sm text-destructive">
                  {text(error)}
                </p>
              )}
            </form>
          ) : (
            <div className="flex min-w-0 items-center gap-1">
              <p className={cn("truncate text-lg font-bold", shownName ? "text-[#0B1220]" : "text-[#8A93A3]")}>
                {shownName || t("noName")}
              </p>
              <button
                type="button"
                onClick={startEdit}
                aria-label={t("editName")}
                className="grid size-11 shrink-0 place-items-center rounded-full text-[#5B6475] outline-none hover:bg-[#F1F4F9] hover:text-[#0B1220] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
              >
                <Pencil className="size-4.5" aria-hidden />
              </button>
            </div>
          )}
          <p className="truncate text-[15px] text-[#5B6475]">{email}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPasswordOpen(true)}
        className={cn(outlineButtonClass, "mt-6 w-full sm:w-auto")}
      >
        <KeyRound className="size-5" aria-hidden />
        {t("changePassword")}
      </button>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </section>
  )
}

type PasswordField = "currentPassword" | "password" | "confirmPassword"
const EMPTY = { currentPassword: "", password: "", confirmPassword: "" }

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("settings.password")
  const tc = useTranslations("common")
  const ids = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({})
  const [pending, startTransition] = useTransition()

  const change = (open: boolean) => {
    if (pending) return
    if (open) {
      setValues(EMPTY)
      setErrors({})
    }
    onOpenChange(open)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = changePasswordSchema.safeParse(values)
    if (!parsed.success) {
      const next: Partial<Record<PasswordField, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as PasswordField
        next[key] ??= issue.message
      }
      return setErrors(next)
    }
    startTransition(async () => {
      const res = await changePassword(parsed.data)
      if (!res.ok) {
        const fe = res.fieldErrors ?? {}
        return setErrors({
          currentPassword: fe.currentPassword?.[0],
          password: fe.password?.[0],
          confirmPassword: fe.confirmPassword?.[0],
          ...(res.fieldErrors ? {} : { currentPassword: res.message }),
        })
      }
      onOpenChange(false)
      toast.success(t("changed"))
    })
  }

  const field = (name: PasswordField, label: string, autoComplete: string, hint?: string) => {
    const id = `${ids}-${name}`
    return (
      <Field id={id} label={label} icon={Lock} error={errors[name]} hint={hint}>
        <input
          id={id}
          type="password"
          value={values[name]}
          onChange={(e) => {
            setValues((v) => ({ ...v, [name]: e.target.value }))
            setErrors((er) => ({ ...er, [name]: undefined }))
          }}
          autoComplete={autoComplete}
          disabled={pending}
          {...fieldA11y(id, errors[name], Boolean(hint))}
          className={inputClass}
        />
      </Field>
    )
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">{t("title")}</DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">{t("description")}</DialogDescription>
          </DialogHeader>
          {field("currentPassword", t("current"), "current-password")}
          {field("password", t("new"), "new-password", t("hint"))}
          {field("confirmPassword", t("confirm"), "new-password")}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => change(false)}
              className="h-11 rounded-[12px] px-5 text-[15px] font-semibold"
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-11 gap-2 rounded-[12px] bg-[#1766F2] px-5 text-[15px] font-semibold text-white hover:bg-[#0F55D6]"
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
