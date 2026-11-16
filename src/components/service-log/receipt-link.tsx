import { FileText } from "lucide-react"
import Image from "next/image"
import { cn } from "cn"

export const isPdfPath = (path: string) => path.toLowerCase().endsWith(".pdf")

/**
 * Мініатюра чека (32px у таблиці, 48px у мобільній картці); клік відкриває файл
 * у новій вкладці (signed URL). PDF — іконка.
 */
export function ReceiptLink({
  path,
  url,
  size = "sm",
  className,
}: {
  path: string | null
  url: string | null
  size?: "sm" | "lg"
  className?: string
}) {
  if (!path || !url) return size === "sm" ? <span className="text-[#8A93A3]">—</span> : null
  const pdf = isPdfPath(path)
  const px = size === "lg" ? 48 : 32
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={pdf ? "Open receipt (PDF) in a new tab" : "Open receipt photo in a new tab"}
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden border border-[#E5E9F0] bg-[#F5F7FB] text-[#5B6475] outline-none hover:border-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
        size === "lg" ? "size-12 rounded-[10px]" : "size-8 rounded-[6px]",
        className
      )}
    >
      {pdf ? (
        <FileText className={size === "lg" ? "size-6" : "size-4.5"} aria-hidden />
      ) : (
        <Image src={url} alt="" width={px} height={px} unoptimized className="size-full object-cover" />
      )}
    </a>
  )
}
