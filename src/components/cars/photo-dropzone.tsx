"use client"

import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { useId, useRef, useState, type DragEvent } from "react"
import { cn } from "cn"

import {
  PHOTO_ACCEPT,
  PHOTO_MAX_BYTES,
  compressImage,
  type CompressedImage,
} from "@/lib/cars/compress-image"

/** Фото у формі: уже збережене (шлях у Storage) або щойно вибране й стиснуте. */
export type PhotoValue =
  | { kind: "existing"; path: string; url: string }
  | ({ kind: "new"; url: string } & CompressedImage)

type PhotoDropzoneProps = {
  value: PhotoValue | null
  onChange: (value: PhotoValue | null) => void
  disabled?: boolean
}

export function PhotoDropzone({ value, onChange, disabled }: PhotoDropzoneProps) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPhoto = (next: PhotoValue | null) => {
    // Звільняємо пам'ять від попереднього превʼю
    if (value?.kind === "new") URL.revokeObjectURL(value.url)
    onChange(next)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (!(PHOTO_ACCEPT as readonly string[]).includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.")
      return
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError("The image is larger than 10 MB.")
      return
    }
    setProcessing(true)
    try {
      const compressed = await compressImage(file)
      setPhoto({ kind: "new", ...compressed, url: URL.createObjectURL(compressed.blob) })
    } catch {
      setError("Couldn't read this image. Try another file.")
    } finally {
      setProcessing(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) void handleFile(e.dataTransfer.files[0])
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={PHOTO_ACCEPT.join(",")}
      aria-describedby={hintId}
      disabled={disabled || processing}
      className="sr-only"
      onChange={(e) => {
        void handleFile(e.target.files?.[0])
        e.target.value = "" // щоб можна було вибрати той самий файл ще раз
      }}
    />
  )

  if (value) {
    return (
      <div className="grid gap-2">
        <div className="relative aspect-[16/10] max-h-80 overflow-hidden rounded-[14px] border border-[#D9DEE7] bg-[#EAF1FE] sm:max-w-md">
          {/* blob: і signed URL — next/image тут не потрібен */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt="Car photo preview" className="size-full object-cover" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="h-10 rounded-[10px] border border-[#D9DEE7] bg-white px-4 text-[15px] font-semibold text-[#0B1220] outline-none hover:bg-[#F5F7FB] focus-visible:ring-3 focus-visible:ring-[#1766F2]/25 disabled:opacity-50"
          >
            Replace
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPhoto(null)}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-destructive/25 bg-white px-4 text-[15px] font-semibold text-destructive outline-none hover:bg-destructive/5 focus-visible:ring-3 focus-visible:ring-destructive/25 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
            Remove
          </button>
        </div>
        {hiddenInput}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed px-4 py-6 text-center transition-colors has-focus-visible:border-[#1766F2] has-focus-visible:ring-3 has-focus-visible:ring-[#1766F2]/20",
          dragging ? "border-[#1766F2] bg-[#EEF4FF]" : "border-[#C9D3E3] bg-[#FAFBFD] hover:bg-[#F3F6FC]",
          (disabled || processing) && "pointer-events-none opacity-60"
        )}
      >
        {processing ? (
          <Loader2 className="size-7 animate-spin text-[#1766F2]" aria-hidden />
        ) : (
          <ImagePlus className="size-7 text-[#5B6475]" strokeWidth={1.8} aria-hidden />
        )}
        <span className="text-[15px] text-[#5B6475]">
          {processing ? (
            "Optimizing photo…"
          ) : (
            <>
              Drag &amp; drop or <span className="font-semibold text-[#1766F2]">choose file</span>
            </>
          )}
        </span>
        <span id={hintId} className="text-[13px] text-[#8A93A3]">
          JPG, PNG or WebP, up to 10 MB
        </span>
        {hiddenInput}
      </label>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )

}
