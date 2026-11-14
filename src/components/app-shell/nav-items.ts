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

export type NavItem = { href: string; label: string; icon: LucideIcon }

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/garage", label: "Garage", icon: Car },
  { href: "/service-log", label: "Service Log", icon: Wrench },
  { href: "/fuel", label: "Fuel Log", icon: Fuel },
  { href: "/planner", label: "Maintenance Planner", icon: ChartColumn },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

/** Активний пункт: точний збіг або вкладений шлях (/garage/new → /garage). */
export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)
