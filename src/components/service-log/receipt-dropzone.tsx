"use client"

import { FileText, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { useId, useRef, useState, type DragEvent } from "react"
import { cn } from "cn"

import { compressImage } from "@/lib/cars/compress-image"

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_BYTES = 10 * 1024 * 1024

/** Чек у формі: уже збережений (шлях у Storage) або щойно вибраний. */
export type ReceiptValue =
  | { kind: "existing"; path: string; url: string | null; isPdf: boolean }
  | { kind: "new"; blob: Blob; extension: string; contentType: string; name: string; isPdf: boolean; previewUrl: string | null }

/** Завантаження чека: фото стискаються (як фото авто), PDF — без змін, до 10 МБ. */
export function ReceiptDropzone({
  value,
  onChange,
  disabled,
}: {
  value: ReceiptValue | null
  onChange: (value: ReceiptValue | null) => void
  disabled?: boolean
}) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (next: ReceiptValue | null) => {
    if (value?.kind === "new" && value.previewUrl) URL.revokeObjectURL(value.previewUrl)
    onChange(next)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (!ACCEPT.includes(file.type)) return setError("Choose a JPG, PNG, WebP image or a PDF.")
    if (file.size > MAX_BYTES) return setError("The file is larger than 10 MB.")

    if (file.type === "application/pdf") {
      set({ kind: "new", blob: file, extension: "pdf", contentType: file.type, name: file.name, isPdf: true, previewUrl: null })
      return
    }
    setProcessing(true)
    try {
      const { blob, extension } = await compressImage(file)
      set({
        kind: "new",
        blob,
        extension,
        contentType: blob.type,
        name: file.name,
        isPdf: false,
        previewUrl: URL.createObjectURL(blob),
      })
    } catch {
      setError("Couldn't read this image. Try another file.")
    } finally {
      setProcessing(false)
    }
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={ACCEPT.join(",")}
      aria-describedby={hintId}
      disabled={disabled || processing}
      className="sr-only"
      onChange={(e) => {
        void handleFile(e.target.files?.[0])
        e.target.value = ""
      }}
    />
  )

  if (value) {
    const previewUrl = value.kind === "new" ? value.previewUrl : value.url
    const name = value.kind === "new" ? value.name : value.path.split("/").pop()
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[#D9DEE7] bg-[#FAFBFD] p-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[#E5E9F0] bg-white text-[#5B6475]">
          {value.isPdf || !previewUrl ? (
            <FileText className="size-6" aria-hidden />
          ) : (
            // blob: і signed URL — next/image тут не потрібен
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Receipt preview" className="size-full object-cover" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[#0B1220]">{name}</p>
          <p className="text-[13px] text-[#5B6475]">{value.isPdf ? "PDF document" : "Receipt photo"}</p>
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
            onClick={() => set(null)}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-destructive/25 bg-white px-4 text-[15px] font-semibold text-destructive outline-none hover:bg-destructive/5 focus-visible:ring-3 focus-visible:ring-destructive/25 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
            Remove
          </button>
        </div>
        {hiddenInput}
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) void handleFile(e.dataTransfer.files[0])
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
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed px-4 py-5 text-center transition-colors has-focus-visible:border-[#1766F2] has-focus-visible:ring-3 has-focus-visible:ring-[#1766F2]/20",
          dragging ? "border-[#1766F2] bg-[#EEF4FF]" : "border-[#C9D3E3] bg-[#FAFBFD] hover:bg-[#F3F6FC]",
          (disabled || processing) && "pointer-events-none opacity-60"
        )}
      >
        {processing ? (
          <Loader2 className="size-6 animate-spin text-[#1766F2]" aria-hidden />
        ) : (
          <ImagePlus className="size-6 text-[#5B6475]" strokeWidth={1.8} aria-hidden />
        )}
        <span className="text-[15px] text-[#5B6475]">
          {processing ? "Optimizing photo…" : (
            <>Upload receipt photo or <span className="font-semibold text-[#1766F2]">choose file</span></>
          )}
        </span>
        <span id={hintId} className="text-[13px] text-[#8A93A3]">
          JPG, PNG, WebP or PDF, up to 10 MB
        </span>
        {hiddenInput}
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
