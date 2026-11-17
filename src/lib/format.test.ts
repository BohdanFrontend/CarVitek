import { describe, expect, it } from "vitest"

import { createFormatter } from "./format"

const NB = " "
const en = createFormatter({ locale: "en", currency: "UAH" })
const uk = createFormatter({ locale: "uk", currency: "UAH" })

describe("форматування за мовою", () => {
  it("пробіг і числа", () => {
    expect(en.km(93_000)).toBe(`93${NB}000${NB}km`)
    expect(uk.km(93_000)).toBe(`93${NB}000${NB}км`)
    expect(en.number(6.2, 1)).toBe("6.2")
    expect(uk.number(6.2, 1)).toBe("6,2")
  })
  it("гроші з валютою з налаштувань", () => {
    expect(en.money(1248.5)).toBe(`₴${NB}1${NB}248.50`)
    expect(uk.money(1248.5)).toBe(`₴${NB}1${NB}248,50`)
    expect(createFormatter({ locale: "en", currency: "EUR" }).moneyShort(10_000)).toBe(`€${NB}10${NB}000`)
  })
  it("дати", () => {
    expect(en.date("2026-09-14")).toBe("14 Sep 2026")
    expect(uk.date("2026-09-14")).toBe("14 вер. 2026")
    expect(uk.monthYearLong("2026-03")).toBe("березень 2026")
    expect(en.monthShort("2026-03", true)).toBe("Mar '26")
  })
  it("дні з множиною", () => {
    expect(en.days(1)).toBe(`1${NB}day`)
    expect(uk.days(2)).toBe(`2${NB}дні`)
    expect(uk.days(40)).toBe(`40${NB}днів`)
    expect(uk.days(21)).toBe(`21${NB}день`)
  })
})

describe("перерахунок валюти", () => {
  it("гривні → долари за курсом; форми лишаються в гривнях", () => {
    const usd = createFormatter({ locale: "en", currency: "USD", rate: 45.3918 })
    expect(usd.money(29_010)).toBe(`$${NB}639.10`)
    expect(usd.convert(45.3918)).toBeCloseTo(1)
    expect(usd.inputSymbol).toBe("₴")
    expect(createFormatter({ locale: "uk", currency: "EUR", rate: 50 }).moneyShort(1_000)).toBe(`€${NB}20`)
  })
  it("без курсу або для гривні — без перерахунку", () => {
    expect(createFormatter({ locale: "en", currency: "UAH", rate: 45 }).money(100)).toBe(`₴${NB}100.00`)
  })
})
