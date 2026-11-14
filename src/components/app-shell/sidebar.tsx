"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import { Logo } from "@/components/brand/logo"
import { NAV_ITEMS, isActivePath } from "./nav-items"

/** Бічне меню десктопа (lg+): темне, на всю висоту, sticky. */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-svh w-[288px] shrink-0 flex-col overflow-y-auto bg-[#0F172A] px-5 pt-9 pb-6 lg:flex">
      <Link
        href="/dashboard"
        className="mx-2 self-start rounded-md outline-none focus-visible:ring-3 focus-visible:ring-[#3B82F6]/60"
        aria-label="CarVitex — Dashboard"
      >
        <Logo variant="light" className="text-[38px]" />
      </Link>

      <nav aria-label="Main" className="mt-10">
        <ul className="grid gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center gap-3.5 rounded-[12px] px-4 text-base font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[#3B82F6]/60",
                    active
                      ? "bg-[#1766F2] text-white"
                      : "text-[#CBD5E1] hover:bg-white/6 hover:text-white"
                  )}
                >
                  <Icon className="size-[22px] shrink-0" strokeWidth={1.9} aria-hidden />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
