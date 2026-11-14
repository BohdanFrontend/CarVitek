import { formatMileage } from "@/lib/cars/format"

/** Валюта застосунку. Символ — у formatMoney. */
export const CURRENCY = "UAH"
const CURRENCY_SYMBOL = "₴"

const NBSP = " "

/** 1248.5 → "₴ 1 248.50" (тисячі через нерозривний пробіл, як у пробігу). */
export function formatMoney(amount: number, { decimals = 2 }: { decimals?: number } = {}) {
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(Math.abs(amount))
    .replace(/,/g, NBSP)
  return `${amount < 0 ? "−" : ""}${CURRENCY_SYMBOL}${NBSP}${value}`
}

/** 93000 → "93 000 km" */
export const formatKm = (km: number) => formatMileage(km)

/** 1 → "1 day", 40 → "40 days" */
export const formatDays = (days: number) => `${days}${NBSP}${Math.abs(days) === 1 ? "day" : "days"}`
