"use client"

import { Popover } from "@base-ui/react/popover"
import { Bell, CheckCircle2, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { cn } from "cn"

import { DocumentTypeIcon } from "@/components/documents/document-type-icon"
import { WorkTypeIcon } from "@/components/maintenance/work-type-icon"
import type { DocumentType } from "@/lib/documents/status"
import type { BellItem } from "@/lib/notifications"

/** Дзвіночок з червоним бейджем; відкриває список робіт ТО й документів, що потребують уваги. */
export function NotificationsBell({ items }: { items: BellItem[] }) {
  const t = useTranslations("nav")
  const [open, setOpen] = useState(false)
  const count = items.length

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={count > 0 ? t("notificationsCount", { count }) : t("notifications")}
        className="relative grid size-11 place-items-center rounded-full text-[#0B1220] transition-colors outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 data-popup-open:bg-[#F1F4F9]"
      >
        <Bell className="size-5.5" strokeWidth={1.9} aria-hidden />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#EF4444] px-1 text-[11px] leading-none font-bold text-white ring-2 ring-white"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="isolate z-50 outline-none">
          <Popover.Popup className="w-[min(360px,calc(100vw-24px))] origin-(--transform-origin) rounded-[16px] bg-white p-2 text-[#0B1220] shadow-[0_16px_48px_rgba(15,23,42,0.18)] ring-1 ring-[#0F172A]/8 outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Popover.Title className="px-2.5 pt-1.5 pb-2 text-[15px] font-bold">{t("alertsTitle")}</Popover.Title>
            {count === 0 ? (
              <p className="flex items-center gap-2.5 px-2.5 pb-3 text-sm text-[#5B6475]">
                <CheckCircle2 className="size-5 shrink-0 text-[#22C55E]" aria-hidden />
                {t("noAlerts")}
              </p>
            ) : (
              <ul className="grid max-h-[min(420px,60vh)] gap-0.5 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-14 items-center gap-3 rounded-[12px] px-2.5 py-2 outline-none hover:bg-[#F5F7FB] focus-visible:bg-[#F5F7FB] focus-visible:ring-2 focus-visible:ring-[#1766F2]/30"
                    >
                      {item.kind === "document" ? (
                        <DocumentTypeIcon type={item.code as DocumentType} className="size-9 rounded-[10px]" />
                      ) : (
                        <WorkTypeIcon code={item.code} size="sm" className="size-9 rounded-[10px]" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                        <span className={cn("block truncate text-[13px] font-medium", item.urgent ? "text-[#B91C1C]" : "text-[#B45309]")}>
                          {item.detail}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-[#8A93A3]" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
