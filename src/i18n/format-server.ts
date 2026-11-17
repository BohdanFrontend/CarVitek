import { getLocale } from "next-intl/server"
import { cache } from "react"

import { getExchangeRates, rateFor } from "@/lib/exchange-rates"
import { createFormatter } from "@/lib/format"
import { getUserSettings } from "@/lib/settings"

/** Валюта відображення з налаштувань і курс НБУ до неї (без курсу — гривні). */
export const getDisplayCurrency = cache(async () => {
  const [settings, rates] = await Promise.all([getUserSettings(), getExchangeRates()])
  return rateFor(settings.currency, rates)
})

/** Форматування на сервері: мова інтерфейсу, валюта з налаштувань, суми перераховані за курсом НБУ. */
export const getFormat = cache(async () => {
  const [locale, { currency, rate }] = await Promise.all([getLocale(), getDisplayCurrency()])
  return createFormatter({ locale, currency, rate })
})
