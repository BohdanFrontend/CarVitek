"use client"

import { CalendarDays, Droplets, Gauge, Loader2, Store, Tag, TriangleAlert, Wallet, Zap } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { saveFuelRecord } from "@/app/(app)/fuel/actions"
import { primaryButtonClass } from "@/components/common/buttons"
import { Field, fieldA11y, inputClass } from "@/components/forms/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { todayInKyiv } from "@/lib/dates"
import { useFormat } from "@/i18n/format-client"
import { useMessageText } from "@/i18n/use-message"
import {
  decimalFromString,
  fuelRecordSchema,
  priceFromTotal,
  totalFromPrice,
} from "@/lib/validation/fuel"

export type EditableFuelRecord = {
  id: string
  filled_at: string
  mileage: number
  liters: number
  price_per_liter: number
  is_full_tank: boolean
  station: string | null
}

type Errors = Partial<Record<"filled_at" | "mileage" | "liters" | "price_per_liter" | "station", string>>

const num = (n: number) => String(n)

/** Додавання / редагування заправки. Ціну або суму можна ввести — інше порахується. */
export function FuelRecordDialog({
  open,
  onOpenChange,
  carId,
  unit,
  currentMileage,
  history,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  carId: string
  /** "L" або "kWh" (електромобіль) */
  unit: "L" | "kWh"
  currentMileage: number
  history: { id: string; date: string; mileage: number }[]
  record: EditableFuelRecord | null
}) {
  const ids = useId()
  const fid = (n: string) => `${ids}-${n}`
  const t = useTranslations("fuel.form")
  const tc = useTranslations("common")
  const f = useFormat()
  const text = useMessageText()
  const today = todayInKyiv()
  const electric = unit === "kWh"

  const [date, setDate] = useState(record?.filled_at ?? today)
  const [mileage, setMileage] = useState(String(record?.mileage ?? currentMileage))
  const [amount, setAmount] = useState(record ? num(record.liters) : "")
  const [price, setPrice] = useState(record ? num(record.price_per_liter) : "")
  const [total, setTotal] = useState(record ? num(totalFromPrice(record.price_per_liter, record.liters)) : "")
  const [full, setFull] = useState(record?.is_full_tank ?? true)
  const [station, setStation] = useState(record?.station ?? "")
  const [errors, setErrors] = useState<Errors>({})
  const [pending, startTransition] = useTransition()

  // Ціна ↔ сума: що редагують, з того й рахуємо інше
  const onAmount = (v: string) => {
    setAmount(v)
    const a = decimalFromString(v)
    const p = decimalFromString(price)
    if (!Number.isNaN(a) && !Number.isNaN(p)) setTotal(num(totalFromPrice(p, a)))
  }
  const onPrice = (v: string) => {
    setPrice(v)
    const a = decimalFromString(amount)
    const p = decimalFromString(v)
    setTotal(!Number.isNaN(a) && !Number.isNaN(p) ? num(totalFromPrice(p, a)) : "")
  }
  const onTotal = (v: string) => {
    setTotal(v)
    const a = decimalFromString(amount)
    const t = decimalFromString(v)
    setPrice(!Number.isNaN(a) && !Number.isNaN(t) ? num(priceFromTotal(t, a)) : "")
  }

  // Попередження (не блок): пробіг менший, ніж на попередній за датою заправці
  const mileageNum = Number(mileage)
  const previous = history
    .filter((h) => h.id !== record?.id && h.date <= date)
    .reduce<number | null>((max, h) => (max == null || h.mileage > max ? h.mileage : max), null)
  const lowerThanPrevious = /^\d+$/.test(mileage) && previous != null && mileageNum < previous

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = fuelRecordSchema.safeParse({
      filled_at: date,
      mileage: /^\d+$/.test(mileage.trim()) ? Number(mileage) : Number.NaN,
      liters: decimalFromString(amount),
      price_per_liter: decimalFromString(price),
      is_full_tank: full,
      station,
    })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
      return
    }
    setErrors({})
    startTransition(async () => {
      const res = await saveFuelRecord({
        id: record?.id,
        carId,
        data: { ...parsed.data, station: parsed.data.station ?? "" },
      })
      if (!res.ok) {
        setErrors(Object.fromEntries(Object.entries(res.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0] ?? ""])))
        toast.error(text(res.message))
        return
      }
      toast.success(record ? tc("changesSaved") : electric ? t("addedElectric") : t("added"))
      onOpenChange(false)
    })
  }

  const unitInput = (id: string, value: string, onChange: (v: string) => void, suffix: string, error?: string, placeholder?: string) => (
    <div className="relative">
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
        placeholder={placeholder}
        disabled={pending}
        className={cn(inputClass, "pr-16")}
        {...fieldA11y(id, error)}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
        {suffix}
      </span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[calc(100svh-32px)] overflow-y-auto rounded-[20px] sm:max-w-xl">
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">
              {record ? t(electric ? "editTitleElectric" : "editTitle") : t(electric ? "addTitleElectric" : "addTitle")}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id={fid("date")} label={t("date")} icon={CalendarDays} error={errors.filled_at}>
              <input
                id={fid("date")}
                type="date"
                max={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={pending}
                className={inputClass}
                {...fieldA11y(fid("date"), errors.filled_at)}
              />
            </Field>
            <Field
              id={fid("mileage")}
              label={t("mileage")}
              icon={Gauge}
              error={errors.mileage}
              hint={
                lowerThanPrevious ? (
                  <span className="inline-flex items-start gap-1.5 text-[#B45309]">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {t(electric ? "lowerMileageElectric" : "lowerMileage", { km: f.km(previous!) })}
                  </span>
                ) : undefined
              }
            >
              <div className="relative">
                <input
                  id={fid("mileage")}
                  inputMode="numeric"
                  autoComplete="off"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
                  disabled={pending}
                  className={cn(inputClass, "pr-14")}
                  {...fieldA11y(fid("mileage"), errors.mileage, lowerThanPrevious)}
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
                  {f.units.km}
                </span>
              </div>
            </Field>

            <Field id={fid("amount")} label={electric ? t("energy") : t("liters")} icon={electric ? Zap : Droplets} error={errors.liters}>
              {unitInput(fid("amount"), amount, onAmount, f.units[unit], errors.liters, electric ? t("amountPlaceholderElectric") : t("amountPlaceholder"))}
            </Field>
            <Field id={fid("price")} label={electric ? t("pricePerKwh") : t("pricePerLiter")} icon={Tag} error={errors.price_per_liter}>
              {unitInput(fid("price"), price, onPrice, `${f.inputSymbol}/${f.units[unit]}`, errors.price_per_liter, t("pricePlaceholder"))}
            </Field>
            <Field id={fid("total")} label={t("total")} icon={Wallet} hint={t("totalHint")}>
              {unitInput(fid("total"), total, onTotal, f.inputSymbol, undefined, "0.00")}
            </Field>
            <Field id={fid("station")} label={t("station")} icon={Store} optional error={errors.station}>
              <input
                id={fid("station")}
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder={t("stationPlaceholder")}
                autoComplete="off"
                disabled={pending}
                className={inputClass}
                {...fieldA11y(fid("station"), errors.station)}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-[15px] font-semibold text-[#0B1220]">
            <input
              type="checkbox"
              checked={full}
              onChange={(e) => setFull(e.target.checked)}
              disabled={pending}
              className="size-5 rounded accent-[#1766F2]"
            />
            {electric ? t("fullCharge") : t("fullTank")}
            <span className="font-normal text-[#5B6475]">{t("fullHint")}</span>
          </label>

          <DialogFooter>
            <button type="submit" disabled={pending} className={cn(primaryButtonClass, "w-full sm:w-auto")}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {tc("save")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
