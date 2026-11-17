"use client"

import { Loader2, Plus, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { createCustomTask, resetIntervalRule, saveIntervalRule } from "@/app/(app)/planner/actions"
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/common/buttons"
import { Field, fieldA11y, inputClass } from "@/components/forms/field"
import { WorkTypeIcon } from "@/components/maintenance/work-type-icon"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFormat } from "@/i18n/format-client"
import { useMessageText } from "@/i18n/use-message"
import type { Formatter } from "@/lib/format"
import { describeInterval, type PlannerT } from "@/lib/maintenance/describe"
import { customTaskSchema, intervalRuleSchema, optionalIntFromString } from "@/lib/validation/maintenance"

export type IntervalRow = {
  typeId: string
  code: string | null
  name: string
  isCustom: boolean
  defaultKm: number | null
  defaultMonths: number | null
  /** Значення з правила авто (NULL — як у довіднику) */
  ruleKm: number | null
  ruleMonths: number | null
  enabled: boolean
  hasRule: boolean
}

type Errors = Partial<Record<"interval_km" | "interval_months" | "name", string>>

const errorsFrom = (issues: { path: PropertyKey[]; message: string }[]): Errors =>
  Object.fromEntries(issues.map((i) => [String(i.path[0] ?? "interval_km"), i.message]))

/** Що показати в колонці «My car». */
function myCarLabel(r: IntervalRow, t: PlannerT & ((key: "intervals.notTracked" | "intervals.default") => string), f: Formatter) {
  if (!r.enabled) return { text: t("intervals.notTracked"), muted: true }
  if (r.ruleKm == null && r.ruleMonths == null) return { text: t("intervals.default"), muted: true }
  return { text: describeInterval(r.ruleKm ?? r.defaultKm, r.ruleMonths ?? r.defaultMonths, t, f), muted: false }
}

export function IntervalsManager({ carId, rows }: { carId: string; rows: IntervalRow[] }) {
  const ids = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [km, setKm] = useState("")
  const [months, setMonths] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [errors, setErrors] = useState<Errors>({})
  const [pending, startTransition] = useTransition()
  const [customOpen, setCustomOpen] = useState(false)
  const t = useTranslations("planner")
  const tc = useTranslations("common")
  const f = useFormat()
  const text = useMessageText()

  const editing = rows.find((r) => r.typeId === editingId) ?? null

  const startEdit = (r: IntervalRow) => {
    setEditingId(r.typeId)
    setKm(r.ruleKm != null ? String(r.ruleKm) : "")
    setMonths(r.ruleMonths != null ? String(r.ruleMonths) : "")
    setEnabled(r.enabled)
    setErrors({})
    // панель під таблицею — прокручуємо до неї (особливо на мобільному)
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }))
  }

  const save = () => {
    if (!editing) return
    const parsed = intervalRuleSchema.safeParse({
      interval_km: optionalIntFromString(km),
      interval_months: optionalIntFromString(months),
      is_enabled: enabled,
    })
    if (!parsed.success) return setErrors(errorsFrom(parsed.error.issues))
    startTransition(async () => {
      const res = await saveIntervalRule(carId, editing.typeId, parsed.data)
      if (!res.ok) {
        setErrors(errorsFrom(Object.entries(res.fieldErrors ?? {}).map(([k, v]) => ({ path: [k], message: v?.[0] ?? res.message }))))
        toast.error(text(res.message))
        return
      }
      toast.success(t("intervals.saved", { name: editing.name }))
      setEditingId(null)
    })
  }

  const reset = () => {
    if (!editing) return
    startTransition(async () => {
      const res = await resetIntervalRule(carId, editing.typeId)
      if (!res.ok) return void toast.error(text(res.message))
      toast.success(t("intervals.resetDone", { name: editing.name }))
      setEditingId(null)
    })
  }

  const th = "px-3 py-3 text-left text-[13px] font-semibold text-[#5B6475] first:pl-6 last:pr-6"
  const td = "px-3 py-3.5 align-middle first:pl-6 last:pr-6"

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setCustomOpen(true)} className={secondaryButtonClass}>
          <Plus className="size-4.5" aria-hidden />
          {t("intervals.customTask")}
        </button>
      </div>

      {/* Десктоп: таблиця */}
      <div className={cn(cardClass, "hidden overflow-hidden lg:block")}>
        <table className="w-full text-[15px] text-[#0B1220]">
          <thead className="border-b border-[#E5E9F0]">
            <tr>
              <th scope="col" className={th}>{t("intervals.colType")}</th>
              <th scope="col" className={th}>{t("intervals.colRecommended")}</th>
              <th scope="col" className={th}>{t("intervals.colMyCar")}</th>
              <th scope="col" className={`${th} text-right`}>{tc("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F6]">
            {rows.map((r) => {
              const mine = myCarLabel(r, t, f)
              return (
                <tr key={r.typeId} className={cn(editingId === r.typeId && "bg-[#F5F8FF]")}>
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <WorkTypeIcon code={r.code} size="sm" />
                      <span className="font-medium">{r.name}</span>
                      {r.isCustom && (
                        <span className="rounded-full bg-[#EEF3FE] px-2 py-0.5 text-xs font-semibold text-[#1766F2]">{t("intervals.custom")}</span>
                      )}
                    </span>
                  </td>
                  <td className={`${td} text-[#5B6475]`}>{describeInterval(r.defaultKm, r.defaultMonths, t, f)}</td>
                  <td className={cn(td, mine.muted ? "text-[#8A93A3]" : "font-semibold")}>{mine.text}</td>
                  <td className={`${td} text-right`}>
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      aria-label={t("intervals.editFor", { name: r.name })}
                      className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-[#1766F2] outline-none hover:bg-[#EEF3FE] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
                    >
                      <SlidersHorizontal className="size-4" aria-hidden />
                      {t("intervals.editForMyCar")}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Мобільний: картки */}
      <ul className="grid grid-cols-1 gap-3 lg:hidden">
        {rows.map((r) => {
          const mine = myCarLabel(r, t, f)
          return (
            <li key={r.typeId} className={cn(cardClass, "flex items-center gap-3 p-4", editingId === r.typeId && "ring-2 ring-[#1766F2]")}>
              <WorkTypeIcon code={r.code} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#0B1220]">{r.name}</p>
                <p className="text-sm text-[#5B6475]">{describeInterval(r.defaultKm, r.defaultMonths, t, f)}</p>
                <p className={cn("text-sm", mine.muted ? "text-[#8A93A3]" : "font-semibold text-[#0B1220]")}>
                  {t("intervals.myCar", { value: mine.text })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(r)}
                aria-label={t("intervals.editFor", { name: r.name })}
                className="grid size-10 shrink-0 place-items-center rounded-full text-[#1766F2] outline-none hover:bg-[#EEF3FE] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
              >
                <SlidersHorizontal className="size-5" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Панель редагування під таблицею */}
      <div ref={panelRef} className="scroll-mt-24">
        {editing && (
          <section
            aria-labelledby={`${ids}-panel`}
            className="mt-4 rounded-[20px] border border-[#D6E4FD] bg-[#F3F7FF] p-5 lg:p-6"
          >
            <h2 id={`${ids}-panel`} className="flex items-center gap-2.5 text-lg font-bold text-[#0B1220]">
              <WorkTypeIcon code={editing.code} size="sm" />
              {editing.name} <span className="font-normal text-[#5B6475]">{t("intervals.customInterval")}</span>
            </h2>
            <p className="mt-1 text-sm text-[#5B6475]">
              {t("intervals.leaveEmpty", { interval: describeInterval(editing.defaultKm, editing.defaultMonths, t, f) })}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <Field id={`${ids}-km`} label={t("intervals.distance")} error={errors.interval_km}>
                <UnitInput
                  id={`${ids}-km`}
                  unit="km"
                  value={km}
                  onChange={setKm}
                  placeholder={editing.defaultKm ? t("intervals.defaultValue", { value: f.km(editing.defaultKm) }) : t("intervals.notSet")}
                  error={errors.interval_km}
                  disabled={pending}
                />
              </Field>
              <Field id={`${ids}-months`} label={t("intervals.time")} error={errors.interval_months}>
                <UnitInput
                  id={`${ids}-months`}
                  unit="months"
                  value={months}
                  onChange={setMonths}
                  placeholder={editing.defaultMonths ? t("intervals.defaultValue", { value: editing.defaultMonths }) : t("intervals.notSet")}
                  error={errors.interval_months}
                  disabled={pending}
                />
              </Field>
              <label className="flex h-12 cursor-pointer items-center gap-3 text-[15px] font-semibold text-[#0B1220]">
                <input
                  type="checkbox"
                  role="switch"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  disabled={pending}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-7 w-12 shrink-0 rounded-full bg-[#CBD5E1] transition-colors peer-checked:bg-[#1766F2] peer-focus-visible:ring-3 peer-focus-visible:ring-[#1766F2]/30 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                />
                {t("intervals.track")}
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {editing.hasRule && (
                <button type="button" onClick={reset} disabled={pending} className={cn(secondaryButtonClass, "mr-auto")}>
                  <RotateCcw className="size-4" aria-hidden />
                  {t("intervals.reset")}
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => setEditingId(null)} disabled={pending} className={secondaryButtonClass}>
                  {tc("cancel")}
                </button>
                <button type="button" onClick={save} disabled={pending} className={primaryButtonClass}>
                  {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {tc("save")}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <CustomTaskDialog open={customOpen} onOpenChange={setCustomOpen} />
    </>
  )
}

function UnitInput({
  id,
  unit,
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: {
  id: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  disabled?: boolean
}) {
  const t = useTranslations("planner")
  const f = useFormat()
  return (
    <div className="relative">
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(inputClass, "pl-4", unit === "km" ? "pr-12" : "pr-20")}
        {...fieldA11y(id, error)}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
        {unit === "km" ? f.units.km : t("intervals.monthsUnit")}
      </span>
    </div>
  )
}

/** «+ Custom task»: власна робота з назвою й інтервалами. */
function CustomTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("planner")
  const text = useMessageText()
  const ids = useId()
  const [name, setName] = useState("")
  const [km, setKm] = useState("")
  const [months, setMonths] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [pending, startTransition] = useTransition()

  const change = (next: boolean) => {
    if (pending) return
    onOpenChange(next)
    if (next) {
      setName("")
      setKm("")
      setMonths("")
      setErrors({})
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = customTaskSchema.safeParse({
      name,
      interval_km: optionalIntFromString(km),
      interval_months: optionalIntFromString(months),
    })
    if (!parsed.success) return setErrors(errorsFrom(parsed.error.issues))
    startTransition(async () => {
      const res = await createCustomTask(parsed.data)
      if (!res.ok) return void toast.error(text(res.message))
      toast.success(t("intervals.added", { name: parsed.data.name }))
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="rounded-[20px] sm:max-w-lg">
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">{t("intervals.dialogTitle")}</DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">
              {t("intervals.dialogText")}
            </DialogDescription>
          </DialogHeader>
          <Field id={`${ids}-name`} label={t("intervals.name")} error={errors.name}>
            <input
              id={`${ids}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("intervals.namePlaceholder")}
              autoFocus
              disabled={pending}
              className={cn(inputClass, "pl-4")}
              {...fieldA11y(`${ids}-name`, errors.name)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id={`${ids}-km`} label={t("intervals.distance")} optional error={errors.interval_km}>
              <UnitInput id={`${ids}-km`} unit="km" value={km} onChange={setKm} placeholder={t("intervals.kmPlaceholder")} error={errors.interval_km} disabled={pending} />
            </Field>
            <Field id={`${ids}-months`} label={t("intervals.time")} optional error={errors.interval_months}>
              <UnitInput id={`${ids}-months`} unit="months" value={months} onChange={setMonths} placeholder={t("intervals.monthsPlaceholder")} error={errors.interval_months} disabled={pending} />
            </Field>
          </div>
          <DialogFooter>
            <button type="submit" disabled={pending} className={cn(primaryButtonClass, "w-full sm:w-auto")}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("intervals.addTask")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
