import { format as formatDateFns } from "date-fns"
import { enGB } from "date-fns/locale"

import {
  CURRENCY_SYMBOLS,
  INTL_LOCALE,
  type AppCurrency,
  type AppLocale,
} from "@/i18n/config"
import { fromISODate, type ISODate } from "@/lib/dates"

const NBSP = " "

/** Одиниці виміру (технічні позначення, тому тут, а не в словниках). */
const UNITS: Record<AppLocale, { km: string; L: string; kWh: string }> = {
  en: { km: "km", L: "L", kWh: "kWh" },
  uk: { km: "км", L: "л", kWh: "кВт·год" },
}

const DAY_WORDS: Record<AppLocale, Partial<Record<Intl.LDMLPluralRule, string>>> = {
  en: { one: "day", other: "days" },
  uk: { one: "день", few: "дні", many: "днів", other: "дня" },
}

export type FormatOptions = {
  locale: AppLocale
  currency: AppCurrency
  /** Курс НБУ: гривень за 1 одиницю валюти відображення (для UAH — 1). Суми в базі — у гривнях. */
  rate?: number
}

/**
 * Форматування з мовою і валютою користувача:
 * «93 000 km» / «93 000 км», «6.2» / «6,2», «₴ 1 248.50» / «₴ 1 248,50», «14 Sep 2026» / «14 вер. 2026».
 * Тисячі завжди відокремлюються нерозривним пробілом (і в англійській), десятковий знак — за мовою.
 * Гроші: суми в базі в гривнях, у валюту відображення перераховуються за курсом (rate).
 */
export function createFormatter({ locale, currency, rate = 1 }: FormatOptions) {
  /** Гривні → валюта відображення */
  const convert = (uah: number) => (currency === "UAH" || !(rate > 0) ? uah : uah / rate)
  const intl = INTL_LOCALE[locale]
  const plural = new Intl.PluralRules(intl)

  // Англійська — date-fns («Sep», бо en-GB у Intl дає «Sept»);
  // українська — Intl («вер.», як заведено), без хвоста « р.»
  const dateText = (d: Date, enPattern: string, ukOptions: Intl.DateTimeFormatOptions) =>
    locale === "uk"
      ? new Intl.DateTimeFormat(intl, ukOptions).format(d).replace(/\s?р\.$/, "")
      : formatDateFns(d, enPattern, { locale: enGB })

  const number = (value: number, decimals = 0) =>
    new Intl.NumberFormat(intl, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    })
      .formatToParts(value)
      .map((p) => (p.type === "group" ? NBSP : p.value))
      .join("")
      .replace(/^-/, "−")

  /** Сума в гривнях → «$ 640.12» у валюті відображення */
  const money = (amount: number, { decimals = 2 }: { decimals?: number } = {}) => {
    amount = convert(amount)
    const value = number(Math.abs(amount), decimals)
    return `${amount < 0 ? "−" : ""}${CURRENCY_SYMBOLS[currency]}${NBSP}${value}`
  }

  return {
    locale,
    currency,
    currencySymbol: CURRENCY_SYMBOLS[currency],
    /** Символ валюти введення: суми у формах завжди в гривнях */
    inputSymbol: CURRENCY_SYMBOLS.UAH,
    rate,
    convert,
    /** Сума у валюті введення (гривні, без перерахунку) — для підсумків у формах */
    moneyInput: (amount: number) =>
      `${amount < 0 ? "−" : ""}${CURRENCY_SYMBOLS.UAH}${NBSP}${number(Math.abs(amount), 2)}`,
    units: UNITS[locale],
    number,
    money,
    /** Копійки лише якщо вони є: «₴ 10 000», «₴ 1 250.50». */
    moneyShort: (amount: number) =>
      money(amount, { decimals: Number.isInteger(Math.round(convert(amount) * 100) / 100) ? 0 : 2 }),
    /** 93000 → «93 000 km» */
    km: (value: number) => `${number(Math.round(value))}${NBSP}${UNITS[locale].km}`,
    /** 40 → «40 days» / «40 днів» */
    days: (count: number) => {
      const words = DAY_WORDS[locale]
      return `${count}${NBSP}${words[plural.select(Math.abs(count))] ?? words.other}`
    },
    /** "2026-09-14" → «14 Sep 2026» / «14 вер. 2026» */
    date: (value: ISODate) => dateText(fromISODate(value), "d MMM yyyy", { day: "numeric", month: "short", year: "numeric" }),
    /** "2026-09-14" → «14 Sep» / «14 вер.» */
    dayMonth: (value: ISODate) => dateText(fromISODate(value), "d MMM", { day: "numeric", month: "short" }),
    /** "2026-03" → «Mar 2026» / «бер. 2026» */
    monthYear: (month: string) => dateText(fromISODate(`${month}-01`), "MMM yyyy", { month: "short", year: "numeric" }),
    /** "2026-03" → «March 2026» / «березень 2026» */
    monthYearLong: (month: string) => dateText(fromISODate(`${month}-01`), "MMMM yyyy", { month: "long", year: "numeric" }),
    /** "2026-03" → «Mar» / «бер.» або з роком: «Mar '26» / «бер. '26» */
    monthShort: (month: string, withYear = false) => {
      const d = fromISODate(`${month}-01`)
      const m = dateText(d, "MMM", { month: "short" })
      return withYear ? `${m} '${month.slice(2, 4)}` : m
    },
  }
}

export type Formatter = ReturnType<typeof createFormatter>
