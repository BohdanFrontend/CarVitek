import type { ReactNode } from "react"
import { cn } from "cn"

/** Заголовок сторінки застосунку: 28px, weight 800. */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        "text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220]",
        className
      )}
    >
      {children}
    </h1>
  )
}
