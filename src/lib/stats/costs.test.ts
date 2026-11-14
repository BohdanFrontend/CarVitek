import { describe, expect, it } from "vitest"

import { costPerKm, lastMonths, monthlyCosts, monthlyDistance } from "./costs"

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
