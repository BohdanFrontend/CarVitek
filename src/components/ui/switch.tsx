"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

/** Перемикач 44×26: синій — увімкнено, сірий — вимкнено. */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full bg-[#D9DEE7] p-[3px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30 data-checked:bg-[#1766F2] data-disabled:cursor-not-allowed data-disabled:opacity-60",
        // зона натиску ≥ 44px
        "before:absolute before:-inset-2.5 before:content-['']",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.25)] transition-transform data-checked:translate-x-[18px] motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
