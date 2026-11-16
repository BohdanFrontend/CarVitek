import type { ReactNode } from "react"

import { PageTitle } from "@/components/app-shell/page-title"

/**
 * Заголовок сторінки з дією.
 * Мобільний (< lg): назва авто 14px під заголовком, кнопка на всю ширину (48px, radius 14px) під ними.
 * Десктоп: кнопка праворуч від заголовка, як раніше.
 */
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
    <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-3">
      <div className="min-w-0">
        <PageTitle className="break-words">{title}</PageTitle>
        {description && (
          <p className="mt-1 text-sm break-words text-[#5B6475] lg:text-[15px]">{description}</p>
        )}
      </div>
      {action && (
        <div className="max-lg:*:h-12 max-lg:*:w-full max-lg:*:rounded-[14px]">{action}</div>
      )}
    </div>
  )
}
