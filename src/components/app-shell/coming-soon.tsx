import { Hammer } from "lucide-react"

import { PageTitle } from "./page-title"

/** Заглушка для розділів, які ще в розробці. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <PageTitle>{title}</PageTitle>
      <div className="mt-6 flex flex-col items-center rounded-[20px] border border-[rgba(15,23,42,0.04)] bg-white px-6 py-16 text-center shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <span className="grid size-16 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
          <Hammer className="size-7" strokeWidth={1.9} aria-hidden />
        </span>
        <p className="mt-5 text-xl font-bold text-[#0B1220]">Coming soon</p>
        <p className="mt-1.5 max-w-sm text-[15px] text-[#5B6475]">
          We&apos;re still building this section. Check back later.
        </p>
      </div>
    </div>
  )
}
