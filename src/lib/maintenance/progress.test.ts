import { createTranslator } from "next-intl"
import { describe, expect, it } from "vitest"

import en from "@/i18n/messages/en.json"
import uk from "@/i18n/messages/uk.json"
import { createFormatter } from "@/lib/format"

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

const tEn = createTranslator({ locale: "en", messages: en, namespace: "planner" })
const tUk = createTranslator({ locale: "uk", messages: uk, namespace: "planner" })
const fEn = createFormatter({ locale: "en", currency: "UAH" })
const fUk = createFormatter({ locale: "uk", currency: "UAH" })

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

describe("тексти плану (обидві мови)", () => {
  it("еталонний приклад: «in 2 000 km (~40 days)», «Next: 95 000 km or 10 May 2027»", () => {
    const oil = item({})
    expect(describeDue(oil, TODAY, tEn, fEn)).toBe("in 2 000 km (~40 days)")
    expect(describeNext(oil, tEn, fEn)).toBe("95 000 km or 10 May 2027")
    expect(describeDue(oil, TODAY, tUk, fUk)).toBe("через 2 000 км (~40 днів)")
    expect(describeNext(oil, tUk, fUk)).toBe("95 000 км або 10 трав. 2027")
  })
  it("перепробіг і інтервали", () => {
    expect(describeDue(item({ last: { date: "2026-05-10", mileage: 80_000 } }), TODAY, tEn, fEn)).toBe("3 000 km overdue")
    expect(describeInterval(10_000, 12, tEn, fEn)).toBe("10 000 km / 12 months")
    expect(describeInterval(30_000, null, tEn, fEn)).toBe("30 000 km")
    expect(describeInterval(null, 6, tEn, fEn)).toBe("Every 6 months")
    expect(describeInterval(null, 6, tUk, fUk)).toBe("Кожні 6 місяців")
    expect(describeInterval(10_000, 12, tUk, fUk)).toBe("10 000 км / 12 місяців")
  })
})
