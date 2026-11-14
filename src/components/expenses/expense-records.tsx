"use client"

import { CalendarDays, Gauge, Loader2, Plus, Receipt, Wallet } from "lucide-react"
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
import { formatDate, todayInKyiv } from "@/lib/dates"
import type { ExpenseRow } from "@/lib/expenses/queries"
import { formatKm, formatMoney } from "@/lib/format"
import { CATEGORY_LABELS, EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/stats/categories"
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
  const [dialog, setDialog] = useState<{ key: number; record: ExpenseRow | null } | null>(null)
  const open = (record: ExpenseRow | null) => setDialog({ key: Date.now(), record })

  const addButton = (
    <button type="button" onClick={() => open(null)} className={primaryButtonClass}>
      <Plus className="size-5" aria-hidden />
      Add expense
    </button>
  )
  const actions = (r: ExpenseRow) => (
    <RowActions
      label={`Actions for ${CATEGORY_LABELS[r.category]} expense on ${formatDate(r.spent_at)}`}
      onEdit={() => open(r)}
      onDelete={() => deleteExpense(r.id)}
      deleteTitle={`Delete ${CATEGORY_LABELS[r.category].toLowerCase()} expense?`}
      deleteDescription={`${formatMoney(r.amount)} from ${formatDate(r.spent_at)} will be permanently deleted.`}
      deletedMessage="Expense deleted"
    />
  )

  const th = "px-3 py-3 text-left text-[13px] font-semibold text-[#5B6475] first:pl-6 last:pr-4"
  const td = "px-3 py-3.5 align-middle first:pl-6 last:pr-4"

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-[#5B6475]">
          Insurance, car wash, parking, taxes, fines and other costs. Fuel and services are logged in their own sections.
        </p>
        {addButton}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Add insurance, car wash, parking and other costs to see the full picture"
          action={addButton}
        />
      ) : (
        <>
          <div className={cn(cardClass, "hidden overflow-x-auto lg:block")}>
            <table className="w-full min-w-[760px] text-[15px] text-[#0B1220]">
              <thead className="border-b border-[#E5E9F0]">
                <tr>
                  <th scope="col" className={th}>Date</th>
                  <th scope="col" className={th}>Category</th>
                  <th scope="col" className={`${th} text-right`}>Amount</th>
                  <th scope="col" className={th}>Mileage</th>
                  <th scope="col" className={th}>Comment</th>
                  <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F6]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAFBFD]">
                    <td className={`${td} whitespace-nowrap`}>{formatDate(r.spent_at)}</td>
                    <td className={td}>
                      <span className="flex items-center gap-2.5">
                        <CategoryIcon category={r.category} size="sm" />
                        {CATEGORY_LABELS[r.category]}
                      </span>
                    </td>
                    <td className={`${td} text-right font-semibold whitespace-nowrap`}>{formatMoney(r.amount)}</td>
                    <td className={`${td} whitespace-nowrap`}>{r.mileage != null ? formatKm(r.mileage) : <span className="text-[#8A93A3]">—</span>}</td>
                    <td className={`${td} max-w-[280px] truncate text-[#5B6475]`} title={r.comment ?? undefined}>{r.comment ?? "—"}</td>
                    <td className={`${td} w-12`}>{actions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 lg:hidden">
            {rows.map((r) => (
              <li key={r.id} className={cn(cardClass, "flex items-start gap-3 p-4")}>
                <CategoryIcon category={r.category} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0B1220]">{CATEGORY_LABELS[r.category]}</p>
                  <p className="text-sm text-[#5B6475]">
                    {formatDate(r.spent_at)}
                    {r.mileage != null && <> · {formatKm(r.mileage)}</>}
                  </p>
                  {r.comment && <p className="mt-1 truncate text-sm text-[#5B6475]">{r.comment}</p>}
                </div>
                <p className="shrink-0 font-bold text-[#0B1220]">{formatMoney(r.amount)}</p>
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
        return void toast.error(res.message)
      }
      toast.success(record ? "Changes saved" : "Expense added")
      onClose()
    })
  }

  const items = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[calc(100svh-32px)] overflow-y-auto rounded-[20px] sm:max-w-lg">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B1220]">{record ? "Edit expense" : "Add expense"}</DialogTitle>
            <DialogDescription className="text-[15px] text-[#5B6475]">
              Fuel and services are added in their own logs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={fid("date")} label="Date" icon={CalendarDays} error={errors.spent_at}>
              <input id={fid("date")} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} disabled={pending} className={inputClass} {...fieldA11y(fid("date"), errors.spent_at)} />
            </Field>
            <Field id={fid("category")} label="Category" error={errors.category}>
              <Select items={items} value={category} onValueChange={(v) => setCategory(v as ExpenseCategory | null)} disabled={pending}>
                <SelectTrigger
                  id={fid("category")}
                  aria-invalid={errors.category ? true : undefined}
                  className={cn(inputClass, "pl-4 pr-3 data-placeholder:text-[#8A93A3] data-[size=default]:h-12 w-full")}
                >
                  <SelectValue placeholder="Choose a category" />
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
            <Field id={fid("amount")} label="Amount" icon={Wallet} error={errors.amount}>
              <div className="relative">
                <input id={fid("amount")} inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0.00" disabled={pending} className={cn(inputClass, "pr-10")} {...fieldA11y(fid("amount"), errors.amount)} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">₴</span>
              </div>
            </Field>
            <Field id={fid("mileage")} label="Mileage" icon={Gauge} optional error={errors.mileage}>
              <div className="relative">
                <input id={fid("mileage")} inputMode="numeric" autoComplete="off" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))} disabled={pending} className={cn(inputClass, "pr-14")} {...fieldA11y(fid("mileage"), errors.mileage)} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">km</span>
              </div>
            </Field>
          </div>
          <Field id={fid("comment")} label="Comment" optional error={errors.comment}>
            <textarea id={fid("comment")} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Motor insurance for a year" disabled={pending} className={textareaClass} {...fieldA11y(fid("comment"), errors.comment)} />
          </Field>
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
