"use client"

import { CalendarDays, Droplets, Gauge, Loader2, Store, Tag, TriangleAlert, Wallet, Zap } from "lucide-react"
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
import { formatKm } from "@/lib/format"
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
        toast.error(res.message)
        return
      }
      toast.success(record ? "Changes saved" : electric ? "Charging added" : "Refueling added")
      onOpenChange(false)
    })
  }

  const what = electric ? "charging" : "refueling"
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
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">
              {record ? `Edit ${what}` : `Add ${what}`}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">
              Enter the price or the total — the other one is calculated.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={fid("date")} label="Date" icon={CalendarDays} error={errors.filled_at}>
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
              label="Mileage"
              icon={Gauge}
              error={errors.mileage}
              hint={
                lowerThanPrevious ? (
                  <span className="inline-flex items-start gap-1.5 text-[#B45309]">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    Lower than the previous {what} ({formatKm(previous!)}). Check the value.
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
                  km
                </span>
              </div>
            </Field>

            <Field id={fid("amount")} label={electric ? "Energy" : "Liters"} icon={electric ? Zap : Droplets} error={errors.liters}>
              {unitInput(fid("amount"), amount, onAmount, unit, errors.liters, electric ? "e.g. 42.5" : "e.g. 45.2")}
            </Field>
            <Field id={fid("price")} label={`Price per ${electric ? "kWh" : "liter"}`} icon={Tag} error={errors.price_per_liter}>
              {unitInput(fid("price"), price, onPrice, `₴/${unit}`, errors.price_per_liter, "e.g. 57.90")}
            </Field>
            <Field id={fid("total")} label="Total" icon={Wallet} hint="Calculated from the price, or enter it to calculate the price">
              {unitInput(fid("total"), total, onTotal, "₴", undefined, "0.00")}
            </Field>
            <Field id={fid("station")} label="Station" icon={Store} optional error={errors.station}>
              <input
                id={fid("station")}
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="e.g. OKKO"
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
            {electric ? "Charged to full" : "Full tank"}
            <span className="font-normal text-[#5B6475]">— needed to calculate consumption</span>
          </label>

          <DialogFooter>
            <button type="submit" disabled={pending} className={cn(primaryButtonClass, "w-full sm:w-auto")}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Save
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
