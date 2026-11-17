"use client"

import { Loader2, LogOut, Trash2, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { signOut } from "@/app/(auth)/actions"
import { deleteAccount } from "@/app/(app)/settings/actions"
import { inputClass } from "@/components/forms/field"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useMessageText } from "@/i18n/use-message"
import { settingsCardClass, settingsTitleClass } from "./styles"

const CONFIRM_WORD = "DELETE"

/** Обліковий запис: вихід і «небезпечна зона» з видаленням акаунта. */
export function AccountCard() {
  const t = useTranslations("settings.account")
  const tc = useTranslations("common")
  const text = useMessageText()
  const inputId = useId()
  const [signingOut, startSignOut] = useTransition()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [deleting, startDelete] = useTransition()

  const remove = () =>
    startDelete(async () => {
      // Успіх завершується редіректом на /login?deleted=1
      const res = await deleteAccount(confirm.trim())
      if (res && !res.ok) toast.error(text(res.message))
    })

  return (
    <section aria-labelledby="account-title" className={cn(settingsCardClass, "lg:col-span-2")}>
      <h2 id="account-title" className={settingsTitleClass}>
        {t("title")}
      </h2>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="flex flex-col gap-3 lg:flex-1">
          <p className="text-sm text-[#5B6475]">{t("signOutText")}</p>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => startSignOut(() => signOut())}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#EEF1F6] px-5 text-base font-semibold text-[#0B1220] transition-colors outline-none hover:bg-[#E3E8F0] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 disabled:opacity-60 sm:w-auto sm:self-start"
          >
            {signingOut ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LogOut className="size-5" aria-hidden />}
            {t("signOut")}
          </button>
        </div>

        <div aria-hidden className="h-px bg-[#E5E9F0] lg:h-auto lg:w-px" />

        <div className="flex flex-col gap-3 lg:flex-[1.4]">
          <p className="flex items-center gap-2 font-bold text-[#DC2626]">
            <TriangleAlert className="size-5" aria-hidden />
            {t("danger")}
          </p>
          <p className="text-sm text-[#5B6475]">{t("dangerText")}</p>
          <button
            type="button"
            onClick={() => {
              setConfirm("")
              setOpen(true)
            }}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-[#F3B4B4] bg-white px-5 text-base font-semibold text-[#DC2626] transition-colors outline-none hover:bg-[#FEF2F2] focus-visible:ring-3 focus-visible:ring-[#DC2626]/30 sm:w-auto sm:self-start"
          >
            <Trash2 className="size-5" aria-hidden />
            {t("delete")}
          </button>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
        <AlertDialogContent className="rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold text-[#0B1220]">
              <TriangleAlert className="size-5 text-[#DC2626]" aria-hidden />
              {t("deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] text-[#5B6475]">{t("deleteText")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <label htmlFor={inputId} className="text-[15px] font-semibold text-[#0B1220]">
              {t("typeDelete")}
            </label>
            <input
              id={inputId}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={deleting}
              placeholder={CONFIRM_WORD}
              className={cn(inputClass, "pl-4 font-semibold tracking-wider")}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
            <Button
              onClick={remove}
              disabled={deleting || confirm.trim() !== CONFIRM_WORD}
              className="gap-2 bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
              {deleting ? t("deleting") : t("deleteConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
