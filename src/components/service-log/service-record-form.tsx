"use client"

import { Autocomplete } from "@base-ui/react/autocomplete"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Gauge, Hammer, Loader2, Package, Save, Store } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { cn } from "cn"

import { saveServiceRecord } from "@/app/(app)/service-log/actions"
import { PageTitle } from "@/components/app-shell/page-title"
import { Field, fieldA11y, inputClass, textareaClass } from "@/components/forms/field"
import { Button } from "@/components/ui/button"
import { todayInKyiv } from "@/lib/dates"
import { formatKm, formatMoney } from "@/lib/format"
import type { MutationResult } from "@/lib/server/auth"
import { createClient } from "@/lib/supabase/client"
import {
  serviceRecordFormSchema,
  type ServiceRecordData,
  type ServiceRecordFormValues,
} from "@/lib/validation/service"
import { ReceiptDropzone, type ReceiptValue } from "./receipt-dropzone"
import { WorkTypesSelect, type WorkTypeOption } from "./work-types-select"

const RECEIPTS = "receipts"

export type EditableServiceRecord = {
  id: string
  performed_at: string
  mileage: number
  type_ids: string[]
  labor_cost: number
  parts_cost: number
  service_station: string | null
  comment: string | null
  receipt_path: string | null
  receiptUrl: string | null
}

type Props = {
  userId: string
  car: { id: string; label: string; current_mileage: number }
  workTypes: WorkTypeOption[]
  stations: string[]
  record?: EditableServiceRecord
  /** Попередньо вибрана робота (?type=… з планувальника) */
  presetTypeId?: string
}

const money = (n: number) => (n ? String(n) : "")

export function ServiceRecordForm({ userId, car, workTypes, stations, record, presetTypeId }: Props) {
  const router = useRouter()
  const ids = useId()
  const fid = (name: string) => `${ids}-${name}`
  const isEdit = Boolean(record)
  const today = todayInKyiv()

  const [receipt, setReceipt] = useState<ReceiptValue | null>(
    record?.receipt_path
      ? {
          kind: "existing",
          path: record.receipt_path,
          url: record.receiptUrl,
          isPdf: record.receipt_path.toLowerCase().endsWith(".pdf"),
        }
      : null
  )
  const [done, setDone] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceRecordFormValues, unknown, ServiceRecordData>({
    resolver: zodResolver(serviceRecordFormSchema),
    defaultValues: {
      performed_at: record?.performed_at ?? today,
      mileage: String(record?.mileage ?? car.current_mileage),
      type_ids: record?.type_ids ?? (presetTypeId ? [presetTypeId] : []),
      labor_cost: money(record?.labor_cost ?? 0),
      parts_cost: money(record?.parts_cost ?? 0),
      service_station: record?.service_station ?? "",
      comment: record?.comment ?? "",
    },
  })
  const busy = isSubmitting || done

  const [mileageValue, laborValue, partsValue] = useWatch({
    control,
    name: ["mileage", "labor_cost", "parts_cost"],
  })
  const mileageNum = Number(mileageValue)
  const willUpdateMileage = /^\d+$/.test(String(mileageValue).trim()) && mileageNum > car.current_mileage
  const totalPreview =
    (Number(String(laborValue).replace(",", ".")) || 0) + (Number(String(partsValue).replace(",", ".")) || 0)

  const onSubmit = async (data: ServiceRecordData) => {
    const supabase = createClient()

    // 1) новий чек — у Storage до збереження запису: <user_id>/<car_id>/<uuid>.<ext>
    let receiptPath = receipt?.kind === "existing" ? receipt.path : null
    let uploaded: string | null = null
    if (receipt?.kind === "new") {
      const path = `${userId}/${car.id}/${crypto.randomUUID()}.${receipt.extension}`
      const { error } = await supabase.storage
        .from(RECEIPTS)
        .upload(path, receipt.blob, { contentType: receipt.contentType, cacheControl: "31536000" })
      if (error) {
        toast.error("Couldn't upload the receipt. Please try again.")
        return
      }
      receiptPath = uploaded = path
    }

    // 2) запис і роботи
    let result: MutationResult
    try {
      result = await saveServiceRecord({
        id: record?.id,
        carId: car.id,
        data: { ...data, service_station: data.service_station ?? "", comment: data.comment ?? "" },
        receiptPath,
      })
    } catch {
      result = { ok: false, message: "Something went wrong. Please try again." }
    }

    // 3) не вдалося — прибираємо щойно завантажений файл
    if (!result.ok) {
      if (uploaded) await supabase.storage.from(RECEIPTS).remove([uploaded])
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof ServiceRecordFormValues, { message: messages[0] })
      }
      toast.error(result.message)
      return
    }

    if (uploaded && receipt?.kind === "new") {
      if (receipt.previewUrl) URL.revokeObjectURL(receipt.previewUrl)
      setReceipt({ kind: "existing", path: uploaded, url: null, isPdf: receipt.isPdf })
    }
    setDone(true)
    toast.success(isEdit ? "Changes saved" : "Service record added")
    router.push("/service-log")
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-[20px] border border-[rgba(15,23,42,0.04)] bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] md:p-8"
    >
      <PageTitle>{isEdit ? "Edit service record" : "Add service record"}</PageTitle>
      <p className="mt-1 text-[15px] text-[#5B6475]">{car.label}</p>

      <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
        <Field id={fid("date")} label="Date" icon={CalendarDays} error={errors.performed_at?.message}>
          <input
            id={fid("date")}
            type="date"
            max={today}
            disabled={busy}
            className={inputClass}
            {...fieldA11y(fid("date"), errors.performed_at?.message)}
            {...register("performed_at")}
          />
        </Field>

        <Field
          id={fid("mileage")}
          label="Mileage"
          icon={Gauge}
          error={errors.mileage?.message}
          hint={willUpdateMileage ? `Car mileage will be updated to ${formatKm(mileageNum)}` : undefined}
        >
          <div className="relative">
            <input
              id={fid("mileage")}
              inputMode="numeric"
              autoComplete="off"
              disabled={busy}
              className={cn(inputClass, "pr-14")}
              {...fieldA11y(fid("mileage"), errors.mileage?.message, willUpdateMileage)}
              {...register("mileage")}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
              km
            </span>
          </div>
        </Field>

        <Field
          id={fid("types")}
          label="Work types"
          error={errors.type_ids?.message ?? errors.type_ids?.root?.message}
          className="md:col-span-2"
        >
          <Controller
            control={control}
            name="type_ids"
            render={({ field }) => (
              <WorkTypesSelect
                id={fid("types")}
                options={workTypes}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={busy}
                invalid={Boolean(errors.type_ids)}
                describedBy={errors.type_ids ? `${fid("types")}-error` : undefined}
              />
            )}
          />
        </Field>

        <Field id={fid("labor")} label="Labor cost" icon={Hammer} error={errors.labor_cost?.message}>
          <MoneyInput id={fid("labor")} disabled={busy} error={errors.labor_cost?.message} {...register("labor_cost")} />
        </Field>

        <Field id={fid("parts")} label="Parts cost" icon={Package} error={errors.parts_cost?.message}>
          <MoneyInput id={fid("parts")} disabled={busy} error={errors.parts_cost?.message} {...register("parts_cost")} />
        </Field>

        <Field
          id={fid("station")}
          label="Service station"
          icon={Store}
          optional
          error={errors.service_station?.message}
        >
          <Controller
            control={control}
            name="service_station"
            render={({ field }) => (
              <Autocomplete.Root
                items={stations}
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v)}
                openOnInputClick
              >
                <Autocomplete.Input
                  id={fid("station")}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  placeholder="e.g. AutoExpert"
                  autoComplete="off"
                  disabled={busy}
                  className={inputClass}
                  {...fieldA11y(fid("station"), errors.service_station?.message)}
                />
                <Autocomplete.Portal>
                  <Autocomplete.Positioner sideOffset={6} className="isolate z-50 outline-none">
                    <Autocomplete.Popup className="w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-xl bg-white text-[#0B1220] shadow-lg ring-1 ring-[#0F172A]/10 data-empty:hidden">
                      <Autocomplete.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5">
                        {(s: string) => (
                          <Autocomplete.Item
                            key={s}
                            value={s}
                            className="flex h-10 cursor-default items-center rounded-lg px-3 text-[15px] outline-none select-none data-highlighted:bg-[#EEF4FF] data-highlighted:text-[#1766F2]"
                          >
                            {s}
                          </Autocomplete.Item>
                        )}
                      </Autocomplete.List>
                    </Autocomplete.Popup>
                  </Autocomplete.Positioner>
                </Autocomplete.Portal>
              </Autocomplete.Root>
            )}
          />
        </Field>

        <div className="flex items-end md:pb-1">
          <p className="text-[15px] text-[#5B6475]">
            Total: <span className="text-lg font-bold text-[#0B1220]">{formatMoney(totalPreview)}</span>
          </p>
        </div>

        <Field id={fid("comment")} label="Comment" optional error={errors.comment?.message} className="md:col-span-2">
          <textarea
            id={fid("comment")}
            rows={3}
            placeholder="e.g. Regular service, front axle"
            disabled={busy}
            className={textareaClass}
            {...fieldA11y(fid("comment"), errors.comment?.message)}
            {...register("comment")}
          />
        </Field>

        <div className="grid gap-2 md:col-span-2">
          <span className="text-[15px] font-semibold text-[#0B1220]">
            Receipt <span className="font-normal text-[#5B6475]">(optional)</span>
          </span>
          <ReceiptDropzone value={receipt} onChange={setReceipt} disabled={busy} />
        </div>
      </div>

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 -mx-5 mt-6 bg-linear-to-t from-white from-70% to-white/0 px-5 pt-4 pb-4 lg:static lg:mx-0 lg:mt-8 lg:bg-none lg:p-0">
        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full gap-2.5 rounded-[12px] bg-[#1766F2] text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(23,102,242,0.25)] hover:bg-[#0F55D6] lg:text-lg lg:shadow-none"
        >
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Save className="size-5" aria-hidden />}
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  )
}

/** Поле суми з символом ₴ праворуч. */
function MoneyInput({
  id,
  error,
  ...props
}: React.ComponentProps<"input"> & { id: string; error?: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        className={cn(inputClass, "pr-10")}
        {...fieldA11y(id, error)}
        {...props}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
        ₴
      </span>
    </div>
  )
}
