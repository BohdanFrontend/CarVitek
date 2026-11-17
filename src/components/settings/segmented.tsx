"use client"

import { cn } from "cn"

/**
 * Сегментований вибір («пігулки»): активна — синя, неактивні — #EEF1F6.
 * Семантика radiogroup; стрілки ←/→ перемикають варіант.
 */
export function Segmented<T extends string>({
  labelledBy,
  value,
  options,
  onChange,
  disabled,
}: {
  labelledBy: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  disabled?: boolean
}) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value)
    const next = options[(i + dir + options.length) % options.length]
    onChange(next.value)
    // фокус переходить на вибраний варіант
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`[data-seg="${labelledBy}"][data-value="${next.value}"]`)?.focus()
    )
  }

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-seg={labelledBy}
            data-value={o.value}
            disabled={disabled}
            onClick={() => !active && onChange(o.value)}
            onKeyDown={(e) => {
              const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
              if (!dir) return
              e.preventDefault()
              move(dir)
            }}
            className={cn(
              // мобільний — 36px заввишки, але зона натиску 44px (псевдоелемент)
              "relative inline-flex h-9 min-w-0 items-center justify-center rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 disabled:opacity-60 lg:h-11 lg:px-5",
              active ? "bg-[#1766F2] text-white" : "bg-[#EEF1F6] text-[#0B1220] hover:bg-[#E3E8F0]"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
