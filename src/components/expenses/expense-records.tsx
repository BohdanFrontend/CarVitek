"use client"

import { CalendarDays, Gauge, Loader2, Plus, Receipt, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { deleteExpense, saveExpense } from "@/app/(app)/expenses/actions"
import { cardClass, primaryButtonClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { RowActions } from "@/components/common/row-actions"
import { Field, fieldA11y, inputClass, textareaClass } from "@/components/forms/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormat } from "@/i18n/format-client"
import { useMessageText } from "@/i18n/use-message"
import { todayInKyiv } from "@/lib/dates"
import type { ExpenseRow } from "@/lib/expenses/queries"
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/stats/categories"
import { expenseSchema } from "@/lib/validation/expense"
import { decimalFromString } from "@/lib/validation/fuel"
import { CategoryIcon } from "./category-icon"

/** Вкладка Records: список «інших витрат» і діалог додавання / редагування. */
export function ExpenseRecords({
  carId,
  rows,
  total,
  loadMore,
}: {
  carId: string
  rows: ExpenseRow[]
  total: number
  loadMore: React.ReactNode
}) {
  const t = useTranslations("expenses")
  const tc = useTranslations("common")
  const f = useFormat()
  const [dialog, setDialog] = useState<{ key: number; record: ExpenseRow | null } | null>(null)
  const open = (record: ExpenseRow | null) => setDialog({ key: Date.now(), record })

  const addButton = (
    <button type="button" onClick={() => open(null)} className={primaryButtonClass}>
      <Plus className="size-5" aria-hidden />
      {t("add")}
    </button>
  )
  const actions = (r: ExpenseRow) => (
    <RowActions
      label={t("actionsFor", { category: t(`categories.${r.category}`), date: f.date(r.spent_at) })}
      onEdit={() => open(r)}
      onDelete={() => deleteExpense(r.id)}
      deleteTitle={t("deleteTitle", { category: t(`categories.${r.category}`).toLowerCase() })}
      deleteDescription={t("deleteText", { amount: f.money(r.amount), date: f.date(r.spent_at) })}
      deletedMessage={t("deleted")}
    />
  )

  const th = "px-3 py-3 text-left text-[13px] font-semibold text-[#5B6475] first:pl-6 last:pr-4"
  const td = "px-3 py-3.5 align-middle first:pl-6 last:pr-4"

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-[#5B6475]">
          {t("intro")}
        </p>
        {addButton}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("emptyTitle")}
          description={t("emptyText")}
          action={addButton}
        />
      ) : (
        <>
          <div className={cn(cardClass, "hidden overflow-x-auto lg:block")}>
            <table className="w-full min-w-[760px] text-[15px] text-[#0B1220]">
              <thead className="border-b border-[#E5E9F0]">
                <tr>
                  <th scope="col" className={th}>{t("col.date")}</th>
                  <th scope="col" className={th}>{t("col.category")}</th>
                  <th scope="col" className={`${th} text-right`}>{t("col.amount")}</th>
                  <th scope="col" className={th}>{t("col.mileage")}</th>
                  <th scope="col" className={th}>{t("col.comment")}</th>
                  <th scope="col" className={th}><span className="sr-only">{tc("actions")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F6]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAFBFD]">
                    <td className={`${td} whitespace-nowrap`}>{f.date(r.spent_at)}</td>
                    <td className={td}>
                      <span className="flex items-center gap-2.5">
                        <CategoryIcon category={r.category} size="sm" />
                        {t(`categories.${r.category}`)}
                      </span>
                    </td>
                    <td className={`${td} text-right font-semibold whitespace-nowrap`}>{f.money(r.amount)}</td>
                    <td className={`${td} whitespace-nowrap`}>{r.mileage != null ? f.km(r.mileage) : <span className="text-[#8A93A3]">—</span>}</td>
                    <td className={`${td} text-[#5B6475]`}><div className="max-w-[280px] truncate" title={r.comment ?? undefined}>{r.comment ?? "—"}</div></td>
                    <td className={`${td} w-12`}>{actions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid grid-cols-1 gap-3 lg:hidden">
            {rows.map((r) => (
              <li key={r.id} className={cn(cardClass, "flex items-start gap-3 p-4")}>
                <CategoryIcon category={r.category} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0B1220]">{t(`categories.${r.category}`)}</p>
                  <p className="text-sm text-[#5B6475]">
                    {f.date(r.spent_at)}
                    {r.mileage != null && <> · {f.km(r.mileage)}</>}
                  </p>
                  {r.comment && <p className="mt-1 truncate text-sm text-[#5B6475]">{r.comment}</p>}
                </div>
                <p className="shrink-0 font-bold text-[#0B1220]">{f.money(r.amount)}</p>
                <div className="-mt-1 -mr-1.5">{actions(r)}</div>
              </li>
            ))}
          </ul>
          {loadMore}
        </>
      )}

      {dialog && (
        <ExpenseDialog key={dialog.key} carId={carId} record={dialog.record} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}

type Errors = Partial<Record<"spent_at" | "category" | "amount" | "mileage" | "comment", string>>

function ExpenseDialog({ carId, record, onClose }: { carId: string; record: ExpenseRow | null; onClose: () => void }) {
  const ids = useId()
  const fid = (n: string) => `${ids}-${n}`
  const t = useTranslations("expenses")
  const tc = useTranslations("common")
  const f = useFormat()
  const text = useMessageText()
  const today = todayInKyiv()
  const [date, setDate] = useState(record?.spent_at ?? today)
  const [category, setCategory] = useState<ExpenseCategory | null>(record?.category ?? null)
  const [amount, setAmount] = useState(record ? String(record.amount) : "")
  const [mileage, setMileage] = useState(record?.mileage != null ? String(record.mileage) : "")
  const [comment, setComment] = useState(record?.comment ?? "")
  const [errors, setErrors] = useState<Errors>({})
  const [pending, startTransition] = useTransition()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = expenseSchema.safeParse({
      spent_at: date,
      category,
      amount: decimalFromString(amount),
      mileage: mileage.trim() === "" ? null : Number(mileage),
      comment,
    })
    if (!parsed.success) {
      return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
    }
    setErrors({})
    startTransition(async () => {
      const res = await saveExpense({ id: record?.id, carId, data: { ...parsed.data, comment: parsed.data.comment ?? "" } })
      if (!res.ok) {
        setErrors(Object.fromEntries(Object.entries(res.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0] ?? ""])))
        return void toast.error(text(res.message))
      }
      toast.success(record ? tc("changesSaved") : t("form.added"))
      onClose()
    })
  }

  const items = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) }))

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[calc(100svh-32px)] overflow-y-auto rounded-[20px] sm:max-w-lg">
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">{record ? t("form.editTitle") : t("form.addTitle")}</DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">
              {t("form.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id={fid("date")} label={t("form.date")} icon={CalendarDays} error={errors.spent_at}>
              <input id={fid("date")} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} disabled={pending} className={inputClass} {...fieldA11y(fid("date"), errors.spent_at)} />
            </Field>
            <Field id={fid("category")} label={t("form.category")} error={errors.category}>
              <Select items={items} value={category} onValueChange={(v) => setCategory(v as ExpenseCategory | null)} disabled={pending}>
                <SelectTrigger
                  id={fid("category")}
                  aria-invalid={errors.category ? true : undefined}
                  className={cn(inputClass, "pl-4 pr-3 data-placeholder:text-[#8A93A3] data-[size=default]:h-12 w-full")}
                >
                  <SelectValue placeholder={t("form.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {items.map((i) => (
                    <SelectItem key={i.value} value={i.value} className="h-10 text-[15px]">
                      <CategoryIcon category={i.value} size="sm" />
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={fid("amount")} label={t("form.amount")} icon={Wallet} error={errors.amount}>
              <div className="relative">
                <input id={fid("amount")} inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0.00" disabled={pending} className={cn(inputClass, "pr-10")} {...fieldA11y(fid("amount"), errors.amount)} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">{f.inputSymbol}</span>
              </div>
            </Field>
            <Field id={fid("mileage")} label={t("form.mileage")} icon={Gauge} optional error={errors.mileage}>
              <div className="relative">
                <input id={fid("mileage")} inputMode="numeric" autoComplete="off" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))} disabled={pending} className={cn(inputClass, "pr-14")} {...fieldA11y(fid("mileage"), errors.mileage)} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">{f.units.km}</span>
              </div>
            </Field>
          </div>
          <Field id={fid("comment")} label={t("form.comment")} optional error={errors.comment}>
            <textarea id={fid("comment")} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("form.commentPlaceholder")} disabled={pending} className={textareaClass} {...fieldA11y(fid("comment"), errors.comment)} />
          </Field>
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
