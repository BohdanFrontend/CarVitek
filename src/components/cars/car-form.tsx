"use client"

import { Autocomplete } from "@base-ui/react/autocomplete"
import { Radio } from "@base-ui/react/radio"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarDays,
  CarFront,
  Gauge,
  Hash,
  Loader2,
  RectangleHorizontal,
  Save,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useMemo, useState, type ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { cn } from "cn"

import { createCar, updateCar, type CarActionResult } from "@/app/(app)/garage/actions"
import { PageTitle } from "@/components/app-shell/page-title"
import { Button } from "@/components/ui/button"
import { RadioGroup } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ENGINE_LABELS, ENGINE_TYPES, type EngineType } from "@/lib/cars/format"
import { CAR_MAKES } from "@/lib/cars/makes"
import { createClient } from "@/lib/supabase/client"
import {
  MIN_YEAR,
  carFormSchema,
  maxCarYear,
  mileageTooLowMessage,
  type CarData,
  type CarFormValues,
} from "@/lib/validation/car"
import { ENGINE_ICONS } from "./engine-badge"
import { PhotoDropzone, type PhotoValue } from "./photo-dropzone"

const BUCKET = "car-photos"

export type EditableCar = {
  id: string
  make: string
  model: string
  year: number | null
  engine_type: EngineType
  current_mileage: number
  plate_number: string | null
  vin: string | null
  photo_path: string | null
  photoUrl: string | null
}

type CarFormProps = {
  userId: string
  /** Авто для редагування; без нього — форма додавання */
  car?: EditableCar
}

const inputClass =
  "h-12 w-full rounded-[12px] border border-[#D9DEE7] bg-white pr-4 pl-12 text-base text-[#0B1220] transition-colors outline-none placeholder:text-[#8A93A3] focus-visible:border-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/20 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20"

const yearItems = Array.from({ length: maxCarYear() - MIN_YEAR + 1 }, (_, i) => {
  const year = String(maxCarYear() - i)
  return { value: year, label: year }
})

export function CarForm({ userId, car }: CarFormProps) {
  const router = useRouter()
  const ids = useId()
  const fieldId = (name: string) => `${ids}-${name}`
  const isEdit = Boolean(car)

  // id нового авто генеруємо на клієнті один раз: від нього залежить тека фото в Storage
  const [carId] = useState(() => car?.id ?? crypto.randomUUID())
  const [photo, setPhoto] = useState<PhotoValue | null>(
    car?.photo_path && car.photoUrl
      ? { kind: "existing", path: car.photo_path, url: car.photoUrl }
      : null
  )
  const [done, setDone] = useState(false)

  // На редагуванні пробіг не можна зменшити
  const minMileage = car?.current_mileage
  const schema = useMemo(
    () =>
      minMileage === undefined
        ? carFormSchema
        : carFormSchema.refine((d) => d.current_mileage >= minMileage, {
            path: ["current_mileage"],
            message: mileageTooLowMessage(minMileage),
          }),
    [minMileage]
  )

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CarFormValues, unknown, CarData>({
    resolver: zodResolver(schema),
    defaultValues: {
      make: car?.make ?? "",
      model: car?.model ?? "",
      year: car?.year ? String(car.year) : "",
      engine_type: car?.engine_type,
      current_mileage: car ? String(car.current_mileage) : "",
      plate_number: car?.plate_number ?? "",
      vin: car?.vin ?? "",
    },
  })

  const busy = isSubmitting || done

  const onSubmit = async (data: CarData) => {
    const supabase = createClient()

    // 1) нове фото — у Storage до збереження авто: <user_id>/<car_id>/<uuid>.webp
    let photoPath = photo?.kind === "existing" ? photo.path : null
    let uploadedPath: string | null = null
    if (photo?.kind === "new") {
      const path = `${userId}/${carId}/${crypto.randomUUID()}.${photo.extension}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, photo.blob, {
        contentType: photo.blob.type,
        cacheControl: "31536000",
      })
      if (error) {
        toast.error("Couldn't upload the photo. Please try again.")
        return
      }
      photoPath = uploadedPath = path
    }

    // 2) саме авто
    const input = { ...data, plate_number: data.plate_number ?? "", vin: data.vin ?? "" }
    let result: CarActionResult
    try {
      result = isEdit
        ? await updateCar(carId, input, photoPath)
        : await createCar(carId, input, photoPath)
    } catch {
      result = { ok: false, message: "Something went wrong. Please try again." }
    }

    // 3) не вдалося — прибираємо щойно завантажений файл
    if (!result.ok) {
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof CarFormValues, { message: messages[0] })
      }
      toast.error(result.message)
      return
    }

    if (photo?.kind === "new") URL.revokeObjectURL(photo.url)
    // Після успіху фото вже «збережене» — повторне натискання не завантажить його вдруге
    if (uploadedPath) setPhoto({ kind: "existing", path: uploadedPath, url: photo!.url })
    setDone(true)
    toast.success(isEdit ? "Changes saved" : "Car added to your garage")
    router.push("/garage")
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-[20px] border border-[rgba(15,23,42,0.04)] bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] md:p-8"
    >
      <PageTitle>{isEdit ? "Edit car" : "Add a car"}</PageTitle>

      <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
        {/* Make — підказки популярних марок, але можна ввести будь-яку */}
        <Field id={fieldId("make")} label="Make" icon={CarFront} error={errors.make?.message}>
          <Controller
            control={control}
            name="make"
            render={({ field }) => (
              <Autocomplete.Root
                items={CAR_MAKES}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                openOnInputClick
              >
                <Autocomplete.Input
                  id={fieldId("make")}
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  placeholder="e.g. Volkswagen"
                  autoComplete="off"
                  disabled={busy}
                  aria-invalid={errors.make ? true : undefined}
                  aria-describedby={errors.make ? `${fieldId("make")}-error` : undefined}
                  className={inputClass}
                />
                <Autocomplete.Portal>
                  <Autocomplete.Positioner sideOffset={6} className="isolate z-50 outline-none">
                    <Autocomplete.Popup className="w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-xl bg-white text-[#0B1220] shadow-lg ring-1 ring-[#0F172A]/10 data-empty:hidden">
                      <Autocomplete.List className="max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1.5">
                        {(make: string) => (
                          <Autocomplete.Item
                            key={make}
                            value={make}
                            className="flex h-10 cursor-default items-center rounded-lg px-3 text-[15px] outline-none select-none data-highlighted:bg-[#EEF4FF] data-highlighted:text-[#1766F2]"
                          >
                            {make}
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

        <Field id={fieldId("model")} label="Model" icon={CarFront} error={errors.model?.message}>
          <input
            id={fieldId("model")}
            placeholder="e.g. Golf"
            autoComplete="off"
            disabled={busy}
            aria-invalid={errors.model ? true : undefined}
            aria-describedby={errors.model ? `${fieldId("model")}-error` : undefined}
            className={inputClass}
            {...register("model")}
          />
        </Field>

        <Field id={fieldId("year")} label="Year" icon={CalendarDays} error={errors.year?.message}>
          <Controller
            control={control}
            name="year"
            render={({ field }) => (
              <Select
                items={yearItems}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
                disabled={busy}
              >
                <SelectTrigger
                  id={fieldId("year")}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={errors.year ? true : undefined}
                  aria-describedby={errors.year ? `${fieldId("year")}-error` : undefined}
                  className={cn(inputClass, "pr-3 data-placeholder:text-[#8A93A3] data-[size=default]:h-12")}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="max-h-72">
                  {yearItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="h-9 text-[15px]">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          id={fieldId("mileage")}
          label="Current mileage"
          icon={Gauge}
          error={errors.current_mileage?.message}
        >
          <div className="relative">
            <input
              id={fieldId("mileage")}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 130000"
              autoComplete="off"
              disabled={busy}
              aria-invalid={errors.current_mileage ? true : undefined}
              aria-describedby={errors.current_mileage ? `${fieldId("mileage")}-error` : undefined}
              className={cn(inputClass, "pr-14")}
              {...register("current_mileage")}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-medium text-[#5B6475]">
              km
            </span>
          </div>
        </Field>

        {/* Engine type — сегментований вибір; стрілки клавіатури перемикають варіанти */}
        <Field
          id={fieldId("engine")}
          label="Engine type"
          error={errors.engine_type?.message}
          asGroup
          className="md:col-span-2"
        >
          <Controller
            control={control}
            name="engine_type"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={busy}
                aria-labelledby={`${fieldId("engine")}-label`}
                aria-describedby={errors.engine_type ? `${fieldId("engine")}-error` : undefined}
                aria-invalid={errors.engine_type ? true : undefined}
                className="grid grid-cols-3 gap-2 md:flex md:flex-wrap"
              >
                {ENGINE_TYPES.map((type, i) => (
                  <Radio.Root
                    key={type}
                    value={type}
                    ref={i === 0 ? field.ref : undefined}
                    onBlur={field.onBlur}
                    className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-[14px] border border-[#E1E7F0] bg-[#F1F4F9] px-2 text-[14px] font-semibold whitespace-nowrap md:gap-2 md:rounded-full md:px-4.5 md:text-[15px] data-checked:shadow-[0_6px_16px_rgba(23,102,242,0.3)] text-[#0B1220] transition-colors outline-none select-none not-data-checked:hover:bg-[#E7ECF4] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 data-checked:border-[#1766F2] data-checked:bg-[#1766F2] data-checked:text-white data-disabled:opacity-60"
                  >
                    <EngineIcon type={type} />
                    {ENGINE_LABELS[type]}
                  </Radio.Root>
                ))}
              </RadioGroup>
            )}
          />
        </Field>

        <Field
          id={fieldId("plate")}
          label="Plate number"
          icon={RectangleHorizontal}
          optional
          error={errors.plate_number?.message}
        >
          <input
            id={fieldId("plate")}
            placeholder="e.g. AA 1234 BB"
            autoComplete="off"
            maxLength={15}
            disabled={busy}
            aria-invalid={errors.plate_number ? true : undefined}
            aria-describedby={errors.plate_number ? `${fieldId("plate")}-error` : undefined}
            className={inputClass}
            {...register("plate_number")}
          />
        </Field>

        <Field
          id={fieldId("vin")}
          label="VIN"
          icon={Hash}
          optional
          error={errors.vin?.message}
          hint="17 characters: digits and letters except I, O and Q"
        >
          <Controller
            control={control}
            name="vin"
            render={({ field }) => (
              <input
                id={fieldId("vin")}
                ref={field.ref}
                name={field.name}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
                onBlur={field.onBlur}
                placeholder="e.g. WVWZZZ1KZBW000001"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={17}
                disabled={busy}
                aria-invalid={errors.vin ? true : undefined}
                aria-describedby={`${fieldId("vin")}-${errors.vin ? "error" : "hint"}`}
                className={cn(inputClass, "font-mono tracking-wide uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case")}
              />
            )}
          />
        </Field>

        <div className="grid gap-2 md:col-span-2">
          <span className="text-[15px] font-semibold text-[#0B1220]">
            Upload photo <span className="font-normal text-[#5B6475]">(optional)</span>
          </span>
          <PhotoDropzone value={photo} onChange={setPhoto} disabled={busy} />
        </div>
      </div>

      {/* На мобільному кнопка липне до низу над таб-панеллю */}
      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 -mx-5 mt-6 bg-linear-to-t from-white from-70% to-white/0 px-5 pt-4 pb-4 lg:static lg:mx-0 lg:mt-8 lg:bg-none lg:p-0">
        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full gap-2.5 rounded-[12px] bg-[#1766F2] text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(23,102,242,0.25)] hover:bg-[#0F55D6] lg:text-lg lg:shadow-none"
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Save className="size-5" aria-hidden />
          )}
          {busy ? "Saving…" : "Save car"}
        </Button>
      </div>
    </form>
  )
}

function EngineIcon({ type }: { type: EngineType }) {
  const Icon = ENGINE_ICONS[type]
  return <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
}

/** Підпис, поле (з іконкою зліва, якщо передано icon), підказка або помилка. */
function Field({
  id,
  label,
  icon: Icon,
  optional,
  hint,
  error,
  asGroup,
  className,
  children,
}: {
  className?: string
  icon?: LucideIcon
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  /** Для групи (radiogroup): підпис — не <label>, а заголовок, на який посилається aria-labelledby */
  asGroup?: boolean
  children: ReactNode
}) {
  const labelContent = (
    <>
      {label}
      {optional && <span className="font-normal text-[#5B6475]"> (optional)</span>}
    </>
  )
  return (
    <div className={cn("grid content-start gap-2", className)}>
      {asGroup ? (
        <span id={`${id}-label`} className="text-[15px] font-semibold text-[#0B1220]">
          {labelContent}
        </span>
      ) : (
        <label htmlFor={id} className="text-[15px] font-semibold text-[#0B1220]">
          {labelContent}
        </label>
      )}
      {Icon ? (
        // Іконка поверх поля, але не перехоплює кліки (pointer-events-none)
        <div className="relative">
          {children}
          <Icon
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#5B6475]"
            strokeWidth={1.9}
            aria-hidden
          />
        </div>
      ) : (
        children
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[13px] text-[#5B6475]">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
