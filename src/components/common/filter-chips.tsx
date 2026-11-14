import Link from "next/link"
import { cn } from "cn"

/** Фільтр-чіпи як посилання (?param=value); активний — синій. */
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
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
      <ul className="flex w-max gap-2">
        {options.map((o) => {
          const selected = o.value === active
          return (
            <li key={o.value ?? "all"}>
              <Link
                href={o.value ? `?${param}=${o.value}` : "?"}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
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
