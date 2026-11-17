"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, CalendarDays, Hash, Loader2, Type } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { cn } from "cn"

import { createDocument, updateDocument } from "@/app/(app)/documents/actions"
import { Field, fieldA11y, inputClass, textareaClass } from "@/components/forms/field"
import { ReceiptDropzone, type ReceiptValue } from "@/components/service-log/receipt-dropzone"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFormat } from "@/i18n/format-client"
import { useMessageText } from "@/i18n/use-message"
import type { CarDocument } from "@/lib/documents/queries"
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/documents/status"
import { createClient } from "@/lib/supabase/client"
import { REMIND_OPTIONS, documentSchema, type DocumentData, type DocumentFormValues } from "@/lib/validation/document"
import { DocumentTypeIcon } from "./document-type-icon"

const BUCKET = "documents"

const defaults = (doc: CarDocument | null): DocumentFormValues => ({
  type: doc?.type ?? ("" as DocumentType),
  title: doc?.title ?? "",
  number: doc?.number ?? "",
  issued_by: doc?.issued_by ?? "",
  start_date: doc?.start_date ?? "",
  expiry_date: doc?.expiry_date ?? "",
  cost: doc?.cost != null ? String(doc.cost) : "",
  remind: doc ? doc.remind_days != null : true,
  remind_days: String(doc?.remind_days && REMIND_OPTIONS.includes(doc.remind_days as never) ? doc.remind_days : 30) as DocumentFormValues["remind_days"],
  note: doc?.note ?? "",
})

/**
 * Форма документа (додавання/редагування). Файл спершу завантажується в Storage
 * (documents/<user_id>/<car_id>/<uuid>.<ext>), потім зберігається запис; при помилці файл прибирається.
 */
export function DocumentForm({
  carId,
  userId,
  doc,
  fileUrl,
  onDone,
  stickyFooter,
}: {
  carId: string
  userId: string
  /** null — новий документ */
  doc: CarDocument | null
  fileUrl: string | null
  onDone: () => void
  /** Кнопка Save закріплена внизу (мобільна шторка) */
  stickyFooter?: boolean
}) {
  const t = useTranslations("documents")
  const tf = useTranslations("documents.form")
  const tc = useTranslations("common")
  const f = useFormat()
  const text = useMessageText()
  const ids = useId()
  const fid = (n: string) => `${ids}-${n}`

  const [file, setFile] = useState<ReceiptValue | null>(
    doc?.file_path ? { kind: "existing", path: doc.file_path, url: fileUrl, isPdf: doc.file_path.toLowerCase().endsWith(".pdf") } : null
  )

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues, unknown, DocumentData>({
    resolver: zodResolver(documentSchema),
    defaultValues: defaults(doc),
  })
  const [type, remind] = useWatch({ control, name: ["type", "remind"] })
  const busy = isSubmitting

  const onSubmit = async (data: DocumentData) => {
    const supabase = createClient()
    let filePath = file?.kind === "existing" ? file.path : null
    let uploaded: string | null = null
    if (file?.kind === "new") {
      const path = `${userId}/${carId}/${crypto.randomUUID()}.${file.extension}`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file.blob, { contentType: file.contentType, cacheControl: "31536000" })
      if (error) return void toast.error(text("errors.uploadFileFailed"))
      filePath = uploaded = path
    }

    // Server Action повторно перевіряє дані тією ж схемою — передаємо сирі значення форми
    const values: DocumentFormValues = {
      type: data.type,
      title: data.title ?? "",
      number: data.number ?? "",
      issued_by: data.issued_by ?? "",
      start_date: data.start_date ?? "",
      expiry_date: data.expiry_date ?? "",
      cost: data.cost != null ? String(data.cost) : "",
      remind: data.remind_days != null,
      remind_days: String(data.remind_days ?? 30) as DocumentFormValues["remind_days"],
      note: data.note ?? "",
    }
    let res
    try {
      res = doc ? await updateDocument({ id: doc.id, values, filePath }) : await createDocument({ carId, values, filePath })
    } catch {
      res = { ok: false as const, message: "errors.generic" }
    }
    if (!res.ok) {
      if (uploaded) await supabase.storage.from(BUCKET).remove([uploaded])
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof DocumentFormValues, { message: messages[0] })
      }
      return void toast.error(text(res.message))
    }
    if (file?.kind === "new" && file.previewUrl) URL.revokeObjectURL(file.previewUrl)
    toast.success(doc ? tf("saved") : tf("added"))
    onDone()
  }

  const typeItems = DOCUMENT_TYPES.map((v) => ({ value: v, label: t(`types.${v}`) }))
  const remindItems = REMIND_OPTIONS.map((n) => ({ value: String(n), label: tf("remindOption", { count: n }) }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={cn("flex min-h-0 flex-col", stickyFooter && "h-full")}>
      <div className={cn("grid grid-cols-1 gap-4", stickyFooter && "min-h-0 flex-1 overflow-y-auto px-4 pb-4")}>
        <Field id={fid("type")} label={tf("type")} error={errors.type?.message}>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select items={typeItems} value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")} disabled={busy}>
                <SelectTrigger
                  id={fid("type")}
                  onBlur={field.onBlur}
                  aria-invalid={errors.type ? true : undefined}
                  className={cn(inputClass, "w-full pr-3 pl-4 data-placeholder:text-[#8A93A3] data-[size=default]:h-12")}
                >
                  <SelectValue placeholder={tf("typePlaceholder")} />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {typeItems.map((i) => (
                    <SelectItem key={i.value} value={i.value} className="h-11 text-[15px]">
                      <DocumentTypeIcon type={i.value} size="sm" />
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {type === "other" && (
          <Field id={fid("title")} label={tf("title")} icon={Type} error={errors.title?.message}>
            <input
              id={fid("title")}
              maxLength={100}
              placeholder={tf("titlePlaceholder")}
              disabled={busy}
              {...fieldA11y(fid("title"), errors.title?.message)}
              {...register("title")}
              className={inputClass}
            />
          </Field>
        )}

        <Field id={fid("number")} label={tf("number")} icon={Hash} optional error={errors.number?.message}>
          <input
            id={fid("number")}
            maxLength={50}
            placeholder={tf("numberPlaceholder")}
            autoComplete="off"
            disabled={busy}
            {...fieldA11y(fid("number"), errors.number?.message)}
            {...register("number")}
            className={inputClass}
          />
        </Field>

        <Field id={fid("issued")} label={tf("issuedBy")} icon={Building2} optional error={errors.issued_by?.message}>
          <input
            id={fid("issued")}
            maxLength={100}
            placeholder={tf("issuedByPlaceholder")}
            disabled={busy}
            {...fieldA11y(fid("issued"), errors.issued_by?.message)}
            {...register("issued_by")}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 items-end gap-3">
          <Field id={fid("start")} label={tf("startDate")} icon={CalendarDays} optional error={errors.start_date?.message}>
            <input
              id={fid("start")}
              type="date"
              disabled={busy}
              {...fieldA11y(fid("start"), errors.start_date?.message)}
              {...register("start_date")}
              className={cn(inputClass, "pr-2 pl-10 text-[15px]")}
            />
          </Field>
          <Field
            id={fid("expiry")}
            label={tf("expiryDate")}
            icon={CalendarDays}
            optional={type === "registration"}
            error={errors.expiry_date?.message}
          >
            <input
              id={fid("expiry")}
              type="date"
              disabled={busy}
              {...fieldA11y(fid("expiry"), errors.expiry_date?.message)}
              {...register("expiry_date")}
              className={cn(inputClass, "pr-2 pl-10 text-[15px]")}
            />
          </Field>
        </div>

        <Field id={fid("cost")} label={tf("cost")} optional hint={tf("costHint")} error={errors.cost?.message}>
          <div className="relative">
            {/* Суми вводяться в гривнях (див. налаштування валюти) */}
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
              {f.inputSymbol}
            </span>
            <input
              id={fid("cost")}
              inputMode="decimal"
              placeholder={tf("costPlaceholder")}
              autoComplete="off"
              disabled={busy}
              {...fieldA11y(fid("cost"), errors.cost?.message, true)}
              {...register("cost")}
              className={cn(inputClass, "pl-10")}
            />
          </div>
        </Field>

        <div className="grid gap-2">
          <span className="text-[15px] font-semibold text-[#0B1220]">
            {tf("upload")} <span className="font-normal text-[#5B6475]">({tc("optional")})</span>
          </span>
          <ReceiptDropzone
            value={file}
            onChange={setFile}
            disabled={busy}
            uploadLabel={<span className="font-semibold text-[#1766F2]">{tf("upload")}</span>}
            formatsLabel={tf("uploadHint")}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#F5F7FB] px-4 py-3">
          <label htmlFor={fid("remind")} className="text-[15px] font-semibold text-[#0B1220]">
            {tf("remind")}
          </label>
          <div className="flex items-center gap-3">
            {remind && (
              <Controller
                control={control}
                name="remind_days"
                render={({ field }) => (
                  <Select items={remindItems} value={field.value} onValueChange={(v) => v && field.onChange(v)} disabled={busy}>
                    <SelectTrigger
                      aria-label={tf("remindDays")}
                      className="h-9 rounded-[10px] border-[#D9DEE7] bg-white px-3 text-sm font-semibold text-[#0B1220]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {remindItems.map((i) => (
                        <SelectItem key={i.value} value={i.value} className="h-10 text-[15px]">
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <Controller
              control={control}
              name="remind"
              render={({ field }) => (
                <Switch id={fid("remind")} checked={field.value} onCheckedChange={field.onChange} disabled={busy} />
              )}
            />
          </div>
        </div>

        <Field id={fid("note")} label={tf("note")} optional error={errors.note?.message}>
          <textarea
            id={fid("note")}
            rows={3}
            maxLength={1000}
            placeholder={tf("notePlaceholder")}
            disabled={busy}
            {...fieldA11y(fid("note"), errors.note?.message)}
            {...register("note")}
            className={textareaClass}
          />
        </Field>
      </div>

      <div
        className={cn(
          "pt-5",
          stickyFooter && "shrink-0 border-t border-[#E5E9F0] bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
        )}
      >
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#1766F2] text-base font-semibold text-white transition-colors outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {busy ? tc("saving") : tc("save")}
        </button>
      </div>
    </form>
  )
}

