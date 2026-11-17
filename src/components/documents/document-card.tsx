"use client"

import { Paperclip } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "cn"

import { deleteDocument } from "@/app/(app)/documents/actions"
import { RowActions } from "@/components/common/row-actions"
import { useFormat } from "@/i18n/format-client"
import { daysBadge, documentTitle } from "@/lib/documents/describe"
import type { CarDocument } from "@/lib/documents/queries"
import type { DocumentStatus, DocumentType } from "@/lib/documents/status"
import { DocumentTypeIcon } from "./document-type-icon"

const BADGE: Record<DocumentStatus, string> = {
  valid: "bg-[#DCFCE7] text-[#15803D]",
  expiring: "bg-[#FEF3C7] text-[#B45309]",
  expired: "bg-[#FEE2E2] text-[#B91C1C]",
  no_expiry: "bg-[#EEF1F6] text-[#5B6475]",
}

const INSURANCE: readonly DocumentType[] = ["osago", "casco", "green_card"]

/** Бейдж днів: «207 days», «Expires today», «Expired 5 days ago», «No expiry». */
export function DaysBadge({ doc, className }: { doc: Pick<CarDocument, "status" | "daysLeft">; className?: string }) {
  const t = useTranslations("documents")
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap", BADGE[doc.status], className)}>
      {daysBadge(doc, t)}
    </span>
  )
}

/** Картка документа: іконка типу, бейдж днів і меню ⋮, назва, номер, «Valid until», файл. */
export function DocumentCard({
  doc,
  fileUrl,
  onEdit,
  editing,
}: {
  doc: CarDocument
  fileUrl: string | null
  onEdit: () => void
  editing?: boolean
}) {
  const t = useTranslations("documents")
  const f = useFormat()
  const title = documentTitle(doc, t)

  return (
    <article
      aria-label={title}
      className={cn(
        "relative flex min-w-0 flex-col rounded-[20px] border border-[#E5E9F0] bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] lg:p-5",
        // Ліва смуга статусу: 3px усередині картки (не зсуває вміст)
        doc.status === "expiring" && "shadow-[inset_3px_0_0_#F59E0B,0_10px_40px_rgba(15,23,42,0.06)]",
        doc.status === "expired" && "shadow-[inset_3px_0_0_#EF4444,0_10px_40px_rgba(15,23,42,0.06)]",
        editing && "ring-2 ring-[#1766F2]/40"
      )}
    >
      <div className="flex items-start gap-3">
        <DocumentTypeIcon type={doc.type} />
        <div className="min-w-0 flex-1 lg:hidden">
          <h3 className="truncate text-[17px] font-bold text-[#0B1220]">{title}</h3>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <DaysBadge doc={doc} className="max-lg:hidden" />
          <RowActions
            label={t("actionsFor", { title })}
            onEdit={onEdit}
            view={fileUrl ? { href: fileUrl, label: t("viewFile") } : undefined}
            onDelete={() => deleteDocument(doc.id)}
            deleteTitle={t("deleteTitle", { title })}
            deleteDescription={t("deleteText")}
            deletedMessage={t("deleted")}
            className="-mr-1.5"
          />
        </div>
      </div>

      <h3 className="mt-3 truncate text-lg font-bold text-[#0B1220] max-lg:hidden">{title}</h3>
      <div className="mt-1 text-[15px] text-[#5B6475] max-lg:mt-0 max-lg:pl-14">
        {doc.number && (
          <p className="truncate">{INSURANCE.includes(doc.type) ? t("policy", { number: doc.number }) : t("number", { number: doc.number })}</p>
        )}
        <p>{doc.expiry_date ? t("validUntil", { date: f.date(doc.expiry_date) }) : t("noExpiry")}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("openFile", { title })}
            className="-ml-1 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-1 text-sm font-medium text-[#5B6475] outline-none hover:text-[#1766F2] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
          >
            <Paperclip className="size-4" aria-hidden />
            {t("files", { count: 1 })}
          </a>
        ) : (
          <span className="inline-flex h-9 items-center gap-1.5 text-sm text-[#8A93A3]">
            <Paperclip className="size-4" aria-hidden />
            {t("noFile")}
          </span>
        )}
        <DaysBadge doc={doc} className="lg:hidden" />
      </div>
    </article>
  )
}
