"use client"

import { FileText, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState, useSyncExternalStore } from "react"
import { cn } from "cn"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { CarDocument } from "@/lib/documents/queries"
import type { DocumentStatus } from "@/lib/documents/status"
import { DocumentCard } from "./document-card"
import { DocumentForm } from "./document-form"

type Filter = Exclude<DocumentStatus, "no_expiry">

const SUMMARY = [
  { status: "valid", dot: "bg-[#22C55E]", label: "valid", short: "valid" },
  { status: "expiring", dot: "bg-[#F59E0B]", label: "expiring", short: "expiringShort" },
  { status: "expired", dot: "bg-[#EF4444]", label: "expired", short: "expired" },
] as const satisfies readonly { status: Filter; dot: string; label: string; short: string }[]

/** Ширина вікна ≥ breakpoint (на сервері — false: мобільна розмітка без форми збоку). */
function useMinWidth(px: number) {
  const query = `(min-width: ${px}px)`
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/**
 * Документи активного авто.
 * xl+: сітка карток і sticky-форма 360px праворуч; lg: форма у Sheet справа;
 * мобільний: картки одна під одною, плаваюча «+» відкриває форму на весь екран.
 */
export function DocumentsView({
  carId,
  userId,
  docs,
  fileUrls,
}: {
  carId: string
  userId: string
  docs: CarDocument[]
  fileUrls: Record<string, string>
}) {
  const t = useTranslations("documents")
  const tc = useTranslations("common")
  const router = useRouter()
  const xl = useMinWidth(1280)
  const lg = useMinWidth(1024)
  const [filter, setFilter] = useState<Filter | null>(null)
  const [editing, setEditing] = useState<CarDocument | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Новий ключ — свіжа (порожня) форма після збереження
  const [formKey, setFormKey] = useState(0)

  const counts = Object.fromEntries(SUMMARY.map((s) => [s.status, docs.filter((d) => d.status === s.status).length])) as Record<Filter, number>
  const visible = filter ? docs.filter((d) => d.status === filter) : docs
  const urlOf = (d: CarDocument) => (d.file_path ? (fileUrls[d.file_path] ?? null) : null)

  const openAdd = () => {
    setEditing(null)
    setFormKey((k) => k + 1)
    if (xl) requestAnimationFrame(() => document.querySelector<HTMLElement>("#document-panel button, #document-panel input")?.focus())
    else setSheetOpen(true)
  }
  const openEdit = (doc: CarDocument) => {
    setEditing(doc)
    setFormKey((k) => k + 1)
    if (xl) document.getElementById("document-panel")?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    else setSheetOpen(true)
  }
  const done = () => {
    setEditing(null)
    setSheetOpen(false)
    setFormKey((k) => k + 1)
    router.refresh()
  }

  const formTitle = editing ? t("form.editTitle") : t("form.addTitle")
  const form = (sticky: boolean) => (
    <DocumentForm
      key={`${editing?.id ?? "new"}-${formKey}`}
      carId={carId}
      userId={userId}
      doc={editing}
      fileUrl={editing ? urlOf(editing) : null}
      onDone={done}
      stickyFooter={sticky}
    />
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-5">
      {/* Заголовок (на мобільному — у верхній панелі) */}
      <div className="flex items-center justify-between gap-4 max-lg:sr-only">
        <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220]">{t("title")}</h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[14px] bg-[#1766F2] px-5 text-base font-semibold text-white transition-colors outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
        >
          <Plus className="size-5" aria-hidden />
          {t("add")}
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:gap-5">
          {/* Підсумки — фільтр */}
          <div role="group" aria-label={t("summary.label")} className="grid grid-cols-3 gap-2.5 lg:gap-4">
            {SUMMARY.map((s) => {
              const active = filter === s.status
              return (
                <button
                  key={s.status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(active ? null : s.status)}
                  className={cn(
                    "min-w-0 rounded-[16px] border bg-white p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 lg:rounded-[20px] lg:p-5",
                    active ? "border-[#1766F2] bg-[#F3F7FF]" : "border-[#E5E9F0] hover:border-[#C9D3E3]"
                  )}
                >
                  {/* Мобільний: підпис на всю ширину, крапка — біля числа (інакше «Прострочені» не влазить) */}
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-[#5B6475] lg:text-[15px]">
                    <span className={cn("size-2.5 shrink-0 rounded-full max-lg:hidden", s.dot)} aria-hidden />
                    <span className="truncate lg:hidden">{t(`summary.${s.short}`)}</span>
                    <span className="truncate max-lg:hidden">{t(`summary.${s.label}`)}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xl font-extrabold text-[#0B1220] lg:mt-2 lg:text-2xl">
                    <span className={cn("size-2.5 shrink-0 rounded-full lg:hidden", s.dot)} aria-hidden />
                    {counts[s.status]}
                  </span>
                </button>
              )
            })}
          </div>

          {docs.length === 0 ? (
            <EmptyDocuments onAdd={openAdd} />
          ) : visible.length === 0 ? (
            <div className="rounded-[20px] border border-[#E5E9F0] bg-white px-6 py-12 text-center">
              <p className="font-bold text-[#0B1220]">{t("nothingTitle")}</p>
              <p className="mt-1 text-sm text-[#5B6475]">{t("nothingText")}</p>
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="mt-4 h-10 rounded-[10px] px-4 text-[15px] font-semibold text-[#1766F2] outline-none hover:bg-[#EEF4FF] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
              >
                {t("clearFilter")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-5 2xl:grid-cols-3">
              {visible.map((d) => (
                <DocumentCard key={d.id} doc={d} fileUrl={urlOf(d)} onEdit={() => openEdit(d)} editing={xl && editing?.id === d.id} />
              ))}
            </div>
          )}
        </div>

        {/* xl+: форма збоку */}
        {xl && (
          <aside
            id="document-panel"
            aria-labelledby="document-panel-title"
            className="sticky top-[96px] max-h-[calc(100vh-120px)] overflow-y-auto rounded-[20px] border border-[#E5E9F0] bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="document-panel-title" className="text-lg font-bold text-[#0B1220]">
                {formTitle}
              </h2>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setFormKey((k) => k + 1)
                  }}
                  className="h-9 rounded-[10px] px-3 text-sm font-semibold text-[#5B6475] outline-none hover:bg-[#F1F4F9] hover:text-[#0B1220] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
                >
                  {tc("cancel")}
                </button>
              )}
            </div>
            {form(false)}
          </aside>
        )}
      </div>

      {/* Мобільний: плаваюча кнопка над таб-панеллю */}
      {!lg && (
        <button
          type="button"
          onClick={openAdd}
          aria-label={t("add")}
          className="fixed right-4 bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] z-30 grid size-14 place-items-center rounded-full bg-[#1766F2] text-white shadow-[0_10px_24px_rgba(23,102,242,0.4)] outline-none hover:bg-[#0F55D6] focus-visible:ring-4 focus-visible:ring-[#1766F2]/40"
        >
          <Plus className="size-6" strokeWidth={2.4} aria-hidden />
        </button>
      )}

      {/* < xl: форма в шторці (lg — справа, мобільний — знизу на весь екран) */}
      {!xl && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side={lg ? "right" : "bottom"}
            showCloseButton={false}
            className={cn(
              "gap-0 bg-white p-0",
              lg ? "w-[420px] sm:max-w-[420px]" : "h-[100dvh] rounded-none pt-[env(safe-area-inset-top)]"
            )}
          >
            <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-[#E5E9F0] px-4 py-3">
              <SheetTitle className="text-lg font-bold text-[#0B1220]">{formTitle}</SheetTitle>
              <SheetDescription className="sr-only">{t("form.uploadHint")}</SheetDescription>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t("form.close")}
                className="grid size-11 place-items-center rounded-full text-[#0B1220] outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
              >
                <X className="size-5" aria-hidden />
              </button>
            </SheetHeader>
            <div className="min-h-0 flex-1 pt-4">{form(true)}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

function EmptyDocuments({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("documents")
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-[#E5E9F0] bg-white px-6 py-14 text-center shadow-[0_10px_40px_rgba(15,23,42,0.06)] lg:py-20">
      <span className="grid size-16 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
        <FileText className="size-7" strokeWidth={1.8} aria-hidden />
      </span>
      <h2 className="mt-4 text-xl font-bold text-[#0B1220]">{t("emptyTitle")}</h2>
      <p className="mt-1.5 max-w-sm text-[15px] text-[#5B6475]">{t("emptyText")}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#1766F2] px-6 text-base font-semibold text-white transition-colors outline-none hover:bg-[#0F55D6] focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
      >
        <Plus className="size-5" aria-hidden />
        {t("add")}
      </button>
    </div>
  )
}
