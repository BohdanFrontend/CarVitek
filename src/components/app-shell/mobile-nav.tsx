"use client"

import { CalendarClock, Car, Ellipsis, House, LogOut, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { cn } from "cn"

import { signOut } from "@/app/(auth)/actions"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NAV_ITEMS, isActivePath } from "./nav-items"

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/garage", label: "Garage", icon: Car },
  { href: "/service-log", label: "Service Log", icon: Wrench },
  { href: "/planner", label: "Planner", icon: CalendarClock },
] as const

/** Розділи, що не помістилися в таб-панель, — у шторці «More». */
const MORE_ITEMS = NAV_ITEMS.filter((item) => !TABS.some((t) => t.href === item.href))

/** Таб: біла іконка й підпис; активний — у світлішій «пігулці». */
const tabClass = (active: boolean) =>
  cn(
    "my-1.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] text-[11px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70",
    active ? "bg-white/20 text-white" : "text-white/80 hover:text-white"
  )

/** Нижня таб-панель мобільного (< lg). */
export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [signingOut, startTransition] = useTransition()
  const moreActive = MORE_ITEMS.some((item) => isActivePath(pathname, item.href))

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-[24px] bg-linear-to-b from-[#1766F2] to-[#0A45C2] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(11,69,194,0.25)] lg:hidden"
      >
        <div className="flex h-16 gap-1 px-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={tabClass(active)}
              >
                <Icon className="size-6" strokeWidth={active ? 2.2 : 1.9} aria-hidden />
                {label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={tabClass(moreActive || moreOpen)}
          >
            <Ellipsis className="size-6" strokeWidth={moreActive ? 2.2 : 1.9} aria-hidden />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="gap-2 rounded-t-[24px] bg-white px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-[#D9DEE7]" aria-hidden />
          <SheetHeader className="px-1 pb-1">
            <SheetTitle className="text-lg font-bold text-[#0B1220]">More</SheetTitle>
          </SheetHeader>
          <ul className="grid gap-1">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-[12px] px-3 text-base font-medium outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
                      active ? "bg-[#EEF4FF] text-[#1766F2]" : "text-[#0B1220] hover:bg-[#F5F7FB]"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.9} aria-hidden />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="my-1 h-px bg-[#E5E9F0]" />
          <button
            type="button"
            disabled={signingOut}
            onClick={() => startTransition(() => signOut())}
            className="flex h-12 items-center gap-3 rounded-[12px] px-3 text-base font-medium text-destructive outline-none hover:bg-destructive/5 focus-visible:ring-3 focus-visible:ring-destructive/30 disabled:opacity-60"
          >
            <LogOut className="size-5" strokeWidth={1.9} aria-hidden />
            Sign out
          </button>
        </SheetContent>
      </Sheet>
    </>
  )
}
