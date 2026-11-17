import {
  Car,
  ChartColumn,
  FileText,
  Fuel,
  House,
  Settings,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"

/** label — ключ у розділі nav словника */
export type NavItem = {
  href: string
  label: "dashboard" | "garage" | "serviceLog" | "fuel" | "planner" | "expenses" | "documents" | "settings"
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "dashboard", icon: House },
  { href: "/garage", label: "garage", icon: Car },
  { href: "/service-log", label: "serviceLog", icon: Wrench },
  { href: "/fuel", label: "fuel", icon: Fuel },
  { href: "/planner", label: "planner", icon: ChartColumn },
  { href: "/expenses", label: "expenses", icon: Wallet },
  { href: "/documents", label: "documents", icon: FileText },
  { href: "/settings", label: "settings", icon: Settings },
]

/** Активний пункт: точний збіг або вкладений шлях (/garage/new → /garage). */
export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)
