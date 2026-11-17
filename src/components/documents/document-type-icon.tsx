import { BadgeCheck, ClipboardCheck, FileText, IdCard, ShieldCheck, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import type { DocumentType } from "@/lib/documents/status"

const ICONS: Record<DocumentType, LucideIcon> = {
  osago: ShieldCheck,
  casco: ShieldCheck,
  green_card: ShieldCheck,
  tech_inspection: ClipboardCheck,
  registration: IdCard,
  warranty: BadgeCheck,
  other: FileText,
}

/** Іконка типу документа в світло-блакитному квадраті (44px; sm — 28px). */
export function DocumentTypeIcon({ type, size = "md", className }: { type: DocumentType; size?: "sm" | "md"; className?: string }) {
  const Icon = ICONS[type]
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-[#E8F0FE] text-[#1766F2]",
        size === "md" ? "size-11 rounded-[12px]" : "size-7 rounded-[8px]",
        className
      )}
    >
      <Icon className={size === "md" ? "size-5.5" : "size-4"} strokeWidth={1.9} />
    </span>
  )
}
