"use client"

import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { cn } from "cn"

/**
 * Коментар у мобільній картці: 2 рядки (line-clamp-2), довгі слова переносяться.
 * «Show more» з'являється, лише якщо текст справді обрізаний.
 */
export function ExpandableComment({ text, className }: { text: string; className?: string }) {
  const t = useTranslations("common")
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)

  // Вимірюємо після рендеру й при зміні ширини (поворот екрана)
  const measure = useCallback((el: HTMLParagraphElement | null) => {
    if (!el) return
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={cn("min-w-0", className)}>
      <p
        ref={expanded ? undefined : measure}
        className={cn("text-sm break-words whitespace-pre-line text-[#374151] [overflow-wrap:anywhere]", !expanded && "line-clamp-2")}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="pointer-events-auto relative z-10 mt-1 rounded text-sm font-semibold text-[#1766F2] outline-none hover:underline focus-visible:ring-3 focus-visible:ring-[#1766F2]/30"
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  )
}
