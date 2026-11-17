import { ChevronRight, TriangleAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { cn } from "cn"

import { expiryNotice } from "@/lib/documents/describe"
import type { CarDocument } from "@/lib/documents/queries"

const MAX_LINES = 2

/** Компактне попередження над stat-картками: «Technical inspection expires in 16 days». */
export async function DocumentsAlert({ docs }: { docs: CarDocument[] }) {
  const t = await getTranslations("documents")
  const expired = docs.some((d) => d.status === "expired")
  const shown = docs.slice(0, MAX_LINES)

  return (
    <Link
      href="/documents"
      aria-label={`${docs.map((d) => expiryNotice(d, t)).join(". ")}. ${t("openDocuments")}`}
      className={cn(
        "flex items-center gap-3.5 rounded-[20px] border bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 lg:px-5",
        expired ? "border-[#FECACA] hover:bg-[#FFF8F8]" : "border-[#FDE68A] hover:bg-[#FFFCF2]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-[12px]",
          expired ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#FEF3C7] text-[#B45309]"
        )}
      >
        <TriangleAlert className="size-5.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        {shown.map((d) => (
          <span key={d.id} className="block truncate font-semibold text-[#0B1220]">
            {expiryNotice(d, t)}
          </span>
        ))}
        {docs.length > MAX_LINES && (
          <span className="block text-sm text-[#5B6475]">{t("attention", { count: docs.length })}</span>
        )}
      </span>
      <span className="hidden shrink-0 text-sm font-semibold text-[#1766F2] sm:inline">{t("openDocuments")}</span>
      <ChevronRight className="size-5 shrink-0 text-[#1766F2]" aria-hidden />
    </Link>
  )
}
