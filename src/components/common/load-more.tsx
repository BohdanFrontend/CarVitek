import Link from "next/link"

import { secondaryButtonClass } from "./buttons"

export const PAGE_SIZE = 20

/** Скільки записів показати: ?limit=40 → 40 (кратне 20, не більше 1000). */
export function parseLimit(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(n) && n > 0 ? Math.min(Math.ceil(n / PAGE_SIZE) * PAGE_SIZE, 1000) : PAGE_SIZE
}

/** «Load more» — посилання на ту саму сторінку з більшим limit (без скролу вгору). */
export function LoadMore({
  hasMore,
  limit,
  params,
}: {
  hasMore: boolean
  limit: number
  params: Record<string, string | undefined>
}) {
  if (!hasMore) return null
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) query.set(k, v)
  query.set("limit", String(limit + PAGE_SIZE))
  return (
    <div className="mt-5 flex justify-center">
      <Link href={`?${query}`} scroll={false} className={secondaryButtonClass}>
        Load more
      </Link>
    </div>
  )
}
