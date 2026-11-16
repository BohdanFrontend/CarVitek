import Link from "next/link"
import { cn } from "cn"

/**
 * Фільтр-чіпи як посилання (?param=value); активний — синій.
 * Мобільний: один рядок із власним горизонтальним скролом до країв екрана
 * (-mx-4 px-4, прихований скролбар, snap). Обгортка має min-w-0/w-full, щоб
 * у flex-батьку рядок не розтягував сторінку на ширину всіх чипів.
 */
export function FilterChips({
  options,
  active,
  param,
  label,
}: {
  options: { value: string | null; label: string; count?: number }[]
  active: string | null
  param: string
  label: string
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-4 w-[calc(100%+2rem)] min-w-0 snap-x scroll-px-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:w-auto lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-2">
        {options.map((o) => {
          const selected = o.value === active
          return (
            <li key={o.value ?? "all"} className="shrink-0 snap-start">
              <Link
                href={o.value ? `?${param}=${o.value}` : "?"}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 lg:px-4 lg:text-[15px]",
                  selected
                    ? "bg-[#1766F2] text-white"
                    : "border border-[#E1E7F0] bg-white text-[#0B1220] hover:bg-[#EEF3FE]"
                )}
              >
                {o.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
