import "server-only"

import { cache } from "react"

import type { AppCurrency } from "@/i18n/config"

/** Курс НБУ: скільки гривень за 1 одиницю валюти, і дата курсу (ISO). */
export type ExchangeRate = { rate: number; date: string }
export type ExchangeRates = Partial<Record<Exclude<AppCurrency, "UAH">, ExchangeRate>>

const NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"
const TTL_MS = 6 * 60 * 60 * 1000

// Запасний кеш у пам'яті процесу — на випадок, якщо НБУ тимчасово недоступний
let memory: { at: number; rates: ExchangeRates } | null = null

/**
 * Офіційні курси НБУ для USD і EUR. Кешується на 6 год (Data Cache + пам'ять).
 * Якщо курсу немає — {} (тоді суми показуються в гривнях, без вигаданого перерахунку).
 */
export const getExchangeRates = cache(async (): Promise<ExchangeRates> => {
  if (memory && Date.now() - memory.at < TTL_MS) return memory.rates
  try {
    const res = await fetch(NBU_URL, { next: { revalidate: TTL_MS / 1000 }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { cc: string; rate: number; exchangedate: string }[]
    const rates: ExchangeRates = {}
    for (const row of data) {
      if ((row.cc === "USD" || row.cc === "EUR") && row.rate > 0) {
        const [d, m, y] = row.exchangedate.split(".")
        rates[row.cc] = { rate: row.rate, date: `${y}-${m}-${d}` }
      }
    }
    memory = { at: Date.now(), rates }
    return rates
  } catch (e) {
    console.error("NBU exchange rates:", e instanceof Error ? e.message : e)
    return memory?.rates ?? {}
  }
})

/** Курс для валюти відображення; для UAH або без курсу — 1 (і валюта фактично UAH). */
export function rateFor(currency: AppCurrency, rates: ExchangeRates): { currency: AppCurrency; rate: number } {
  if (currency === "UAH") return { currency, rate: 1 }
  const r = rates[currency]
  return r ? { currency, rate: r.rate } : { currency: "UAH", rate: 1 }
}
