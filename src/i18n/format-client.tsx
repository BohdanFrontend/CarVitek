"use client"

import { useLocale } from "next-intl"
import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { AppCurrency } from "@/i18n/config"
import { createFormatter } from "@/lib/format"

type CurrencyValue = { currency: AppCurrency; rate: number }
const CurrencyContext = createContext<CurrencyValue>({ currency: "UAH", rate: 1 })

/** Валюта відображення і курс НБУ для клієнтських компонентів (мову дає next-intl). */
export function FormatProvider({ currency, rate, children }: CurrencyValue & { children: ReactNode }) {
  const value = useMemo(() => ({ currency, rate }), [currency, rate])
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

/** Форматування в клієнтських компонентах. */
export function useFormat() {
  const locale = useLocale()
  const { currency, rate } = useContext(CurrencyContext)
  return useMemo(() => createFormatter({ locale, currency, rate }), [locale, currency, rate])
}
