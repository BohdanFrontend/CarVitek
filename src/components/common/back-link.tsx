import { ArrowLeft } from "lucide-react"
import Link from "next/link"

/** «← Back to …» — світла «пігулка» над формою. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#E8EEF8] px-4 text-[15px] font-medium text-[#0B1220] transition-colors outline-none hover:bg-[#DCE5F4] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
    >
      <ArrowLeft className="size-[18px]" aria-hidden />
      {label}
    </Link>
  )
}
