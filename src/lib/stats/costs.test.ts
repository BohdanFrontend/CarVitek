import { describe, expect, it } from "vitest"

import {
  categoryTotals,
  costPerKm,
  distanceInRange,
  lastMonths,
  monthlyCosts,
  monthlyDistance,
  percentChange,
  periodRange,
  shiftPeriod,
  sumInRange,
} from "./costs"

const TODAY = "2026-11-11"

describe("monthlyCosts", () => {
  it("сумує ТО, пальне й витрати по останніх 8 місяцях", () => {
    const result = monthlyCosts(
      [{ date: "2026-11-02", amount: 2_500 }, { date: "2026-03-31", amount: 999 }], // березень — поза вікном
      [{ date: "2026-11-05", amount: 1_800.5 }, { date: "2026-10-20", amount: 1_700 }],
      [{ date: "2026-04-01", amount: 300 }, { date: "2026-11-30", amount: 50 }], // 30.11 — у майбутньому
      TODAY
    )
    expect(result.map((r) => r.month)).toEqual(lastMonths(TODAY))
    expect(result[0]).toEqual({ month: "2026-04", total: 300 })
    expect(result.at(-2)).toEqual({ month: "2026-10", total: 1_700 })
    expect(result.at(-1)).toEqual({ month: "2026-11", total: 4_300.5 })
  })

  it("переходить через рік", () => {
    expect(lastMonths("2026-02-15", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"])
  })
})

describe("monthlyDistance і costPerKm", () => {
  it("рахує пробіг від останнього запису до початку місяця", () => {
    const d = monthlyDistance(
      [
        { date: "2026-09-25", mileage: 90_000 },
        { date: "2026-10-10", mileage: 91_000 },
        { date: "2026-10-28", mileage: 91_600 },
        { date: "2026-11-05", mileage: 92_000 },
      ],
      TODAY,
      3
    )
    expect(d).toEqual([
      { month: "2026-09", distance: 0 }, // лише один запис, раніших немає
      { month: "2026-10", distance: 1_600 },
      { month: "2026-11", distance: 400 },
    ])
  })

  it("вартість 1 км", () => {
    expect(costPerKm(1_000, 400)).toBe(2.5)
    expect(costPerKm(1_000, 0)).toBeNull()
  })
})

describe("періоди і категорії", () => {
  it("межі місяця й попереднього місяця", () => {
    expect(periodRange({ kind: "month", month: "2026-03" })).toEqual({
      current: { from: "2026-03-01", to: "2026-03-31" },
      previous: { from: "2026-02-01", to: "2026-02-28" },
      label: "March 2026",
    })
    expect(periodRange({ kind: "year", year: 2026 }).previous).toEqual({ from: "2025-01-01", to: "2025-12-31" })
    expect(shiftPeriod({ kind: "month", month: "2026-01" }, -1)).toEqual({ kind: "month", month: "2025-12" })
  })

  it("суми за категоріями в межах періоду, від найбільшої", () => {
    const entries = [
      { date: "2026-11-02", amount: 2_500, category: "maintenance" },
      { date: "2026-11-05", amount: 1_800, category: "fuel" },
      { date: "2026-11-20", amount: 1_000, category: "fuel" },
      { date: "2026-10-31", amount: 9_999, category: "insurance" }, // інший місяць
      { date: "2026-11-07", amount: 0, category: "wash" }, // нуль не показуємо
    ]
    expect(categoryTotals(entries, { from: "2026-11-01", to: "2026-11-30" })).toEqual([
      { category: "fuel", total: 2_800 },
      { category: "maintenance", total: 2_500 },
    ])
    expect(sumInRange(entries, { from: "2026-11-01", to: "2026-11-30" })).toBe(5_300)
  })

  it("пробіг за довільний період і зміна у відсотках", () => {
    const entries = [
      { date: "2025-12-20", mileage: 60_000 },
      { date: "2026-03-10", mileage: 63_000 },
      { date: "2026-12-01", mileage: 72_000 },
    ]
    expect(distanceInRange(entries, "2026-01-01", "2026-12-31")).toBe(12_000)
    expect(distanceInRange(entries, "2026-04-01", "2026-11-30")).toBe(0)
    expect(percentChange(110, 100)).toBe(10)
    expect(percentChange(5, 0)).toBeNull()
  })
})
