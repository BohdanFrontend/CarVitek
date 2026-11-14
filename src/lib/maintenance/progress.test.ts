import { describe, expect, it } from "vitest"

import { describeDue, describeInterval, describeNext } from "./describe"
import {
  averageKmPerDayDetailed,
  computeNextDue,
  healthScore,
  intervalProgress,
  planSummary,
  type MaintenanceItem,
} from "./plan"

const TODAY = "2026-11-11"

const item = (over: Partial<MaintenanceItem>): MaintenanceItem => ({
  typeId: "t",
  code: "engine_oil",
  name: "Oil change",
  intervalKm: 10_000,
  intervalMonths: 12,
  last: { date: "2026-05-10", mileage: 85_000 },
  ...computeNextDue({
    last: over.last === undefined ? { date: "2026-05-10", mileage: 85_000 } : over.last,
    intervalKm: over.intervalKm === undefined ? 10_000 : over.intervalKm,
    intervalMonths: over.intervalMonths === undefined ? 12 : over.intervalMonths,
    currentMileage: 93_000,
    avgKmPerDay: 50,
    today: TODAY,
  }),
  ...over,
})

describe("intervalProgress", () => {
  it("бере більшу з часток за пробігом і часом", () => {
    // 8 000 / 10 000 км = 0.8; 185 / 365 днів ≈ 0.51
    expect(intervalProgress(item({}), 93_000, TODAY)).toBeCloseTo(0.8, 5)
  })
  it("лише за часом; обмежується 1", () => {
    expect(
      intervalProgress({ last: { date: "2024-12-01", mileage: 0 }, intervalKm: null, intervalMonths: 6 }, 0, TODAY)
    ).toBe(1)
  })
  it("без історії — null", () => {
    expect(intervalProgress({ last: null, intervalKm: 10_000, intervalMonths: 12 }, 93_000, TODAY)).toBeNull()
  })
})

describe("healthScore і planSummary", () => {
  const plan = [
    { status: "ok" as const },
    { status: "ok" as const },
    { status: "soon" as const },
    { status: "overdue" as const },
    { status: "no_data" as const },
  ]
  it("round(100 · (ok + 0.5·soon) / з історією)", () => {
    expect(healthScore(plan)).toBe(63) // (2 + 0.5) / 4 = 62.5 → 63
  })
  it("без історії — null", () => {
    expect(healthScore([{ status: "no_data" }])).toBeNull()
  })
  it("підсумок за статусами", () => {
    expect(planSummary(plan)).toEqual({ overdue: 1, soon: 1, ok: 2, noData: 1 })
  })
})

describe("averageKmPerDayDetailed", () => {
  it("позначає, що пораховано за 90 днів або за всю історію", () => {
    expect(
      averageKmPerDayDetailed(
        [
          { date: "2026-08-13", mileage: 90_000 },
          { date: "2026-11-11", mileage: 94_500 },
        ],
        TODAY
      )
    ).toEqual({ kmPerDay: 50, basis: "last90days" })
    expect(
      averageKmPerDayDetailed(
        [
          { date: "2026-01-01", mileage: 80_000 },
          { date: "2026-11-01", mileage: 95_200 },
        ],
        TODAY
      )
    ).toEqual({ kmPerDay: 50, basis: "allHistory" })
  })
})

describe("тексти плану", () => {
  it("еталонний приклад: «in 2 000 km (~40 days)», «Next: 95 000 km or 10 May 2027»", () => {
    const oil = item({})
    expect(describeDue(oil, TODAY)).toBe("in 2 000 km (~40 days)")
    expect(describeNext(oil)).toBe("95 000 km or 10 May 2027")
  })
  it("перепробіг і інтервали", () => {
    expect(describeDue(item({ last: { date: "2026-05-10", mileage: 80_000 } }), TODAY)).toBe("3 000 km overdue")
    expect(describeInterval(10_000, 12)).toBe("10 000 km / 12 months")
    expect(describeInterval(30_000, null)).toBe("30 000 km")
    expect(describeInterval(null, 6)).toBe("Every 6 months")
  })
})
