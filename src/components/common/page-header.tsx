import type { ReactNode } from "react"

import { PageTitle } from "@/components/app-shell/page-title"

/** Заголовок сторінки з дією праворуч (кнопка «+ Add …»). */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 lg:mb-6">
      <div className="min-w-0">
        <PageTitle>{title}</PageTitle>
        {description && <p className="mt-1 text-[15px] text-[#5B6475]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
