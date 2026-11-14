import { FileText } from "lucide-react"
import Image from "next/image"

export const isPdfPath = (path: string) => path.toLowerCase().endsWith(".pdf")

/** Мініатюра чека 32px; клік відкриває файл у новій вкладці (signed URL). PDF — іконка. */
export function ReceiptLink({ path, url }: { path: string | null; url: string | null }) {
  if (!path || !url) return <span className="text-[#8A93A3]">—</span>
  const pdf = isPdfPath(path)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={pdf ? "Open receipt (PDF) in a new tab" : "Open receipt photo in a new tab"}
      className="inline-grid size-8 place-items-center overflow-hidden rounded-[6px] border border-[#E5E9F0] bg-[#F5F7FB] text-[#5B6475] outline-none hover:border-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
    >
      {pdf ? (
        <FileText className="size-4.5" aria-hidden />
      ) : (
        <Image src={url} alt="" width={32} height={32} unoptimized className="size-8 object-cover" />
      )}
    </a>
  )
}
