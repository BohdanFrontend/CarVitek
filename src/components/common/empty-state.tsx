import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "cn"

import { cardClass } from "./buttons"

/** Порожній стан у картці: іконка в синьому колі, заголовок, опис, дія. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn(cardClass, "flex flex-col items-center px-6 py-14 text-center lg:py-16", className)}>
      <span className="grid size-16 place-items-center rounded-full bg-[#E8F0FE] text-[#1766F2]">
        <Icon className="size-7" strokeWidth={1.9} aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-bold text-[#0B1220]">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[15px] text-[#5B6475]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Сторінка модуля, коли в користувача ще немає авто. */
