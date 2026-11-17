"use client"

import { Gauge, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { updateMileage } from "@/app/(app)/dashboard/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFormat } from "@/i18n/format-client"
import { msg } from "@/i18n/messages"
import { useMessageText } from "@/i18n/use-message"
import { MAX_MILEAGE } from "@/lib/validation/car"

/** Кнопка «Update mileage» з діалогом нового показника одометра. */
export function UpdateMileageDialog({ carId, currentMileage }: { carId: string; currentMileage: number }) {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")
  const f = useFormat()
  const text = useMessageText()

  const onOpenChange = (next: boolean) => {
    if (pending) return
    setOpen(next)
    if (next) {
      setValue(String(currentMileage))
      setError(null)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const mileage = Number(value)
    if (!/^\d+$/.test(value.trim())) return setError(text("validation.wholeKmMileage") ?? null)
    if (mileage < currentMileage) return setError(text(msg("validation.mileageBelowCurrent", { km: currentMileage })) ?? null)
    if (mileage > MAX_MILEAGE) return setError(text(msg("validation.mileageMax", { km: MAX_MILEAGE })) ?? null)

    startTransition(async () => {
      const res = await updateMileage(carId, mileage)
      if (!res.ok) {
        setError(text(res.message) ?? null)
        return
      }
      setOpen(false)
      toast.success(t("mileageUpdated", { km: f.km(mileage) }))
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#D9DEE7] bg-white px-3.5 text-sm font-semibold 2xl:h-11 2xl:px-5 2xl:text-[15px] 3xl:h-13 3xl:rounded-[12px] 3xl:px-6 3xl:text-lg 4xl:h-14 4xl:text-xl text-[#0B1220] transition-colors outline-none hover:bg-[#F5F7FB] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30">
        <Gauge className="size-4 3xl:size-5" aria-hidden />
        {t("updateMileage")}
      </DialogTrigger>
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">{t("updateMileage")}</DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">
              {t("currentReading", { km: f.km(currentMileage) })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor={inputId} className="text-[15px] font-semibold text-[#0B1220]">
              {t("newMileage")}
            </label>
            <div className="relative">
              <Gauge
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#5B6475]"
                aria-hidden
              />
              <input
                id={inputId}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.replace(/\D/g, ""))
                  setError(null)
                }}
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                disabled={pending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-error` : undefined}
                className="h-12 w-full rounded-[12px] border border-[#D9DEE7] bg-white pr-14 pl-12 text-base text-[#0B1220] outline-none focus-visible:border-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/20 aria-invalid:border-destructive"
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
                {f.units.km}
              </span>
            </div>
            {error && (
              <p id={`${inputId}-error`} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full gap-2 rounded-[12px] bg-[#1766F2] text-base font-semibold text-white hover:bg-[#0F55D6] sm:w-auto sm:px-6"
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
