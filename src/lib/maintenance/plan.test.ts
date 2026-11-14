import { describe, expect, it } from "vitest"

import {
  averageKmPerDay,
  buildMaintenancePlan,
  computeNextDue,
  type NextDueInput,
  type PlanType,
} from "./plan"

const TODAY = "2026-11-11"

/** Еталонний приклад із записки: олива, інтервал 10 000 км / 12 міс. */
const base: NextDueInput = {
  last: { date: "2026-05-10", mileage: 85_000 },
  intervalKm: 10_000,
  intervalMonths: 12,
  currentMileage: 93_000,
  avgKmPerDay: 50,
  today: TODAY,
}

describe("computeNextDue — еталонні приклади", () => {
  it("1. M = 93 000 → «скоро», 2 000 км, 21.12.2026, 40 днів", () => {
    const r = computeNextDue(base)
    expect(r.dueMileage).toBe(95_000)
    expect(r.remainingKm).toBe(2_000)
    expect(r.forecastDateByKm).toBe("2026-12-21")
    expect(r.dueDateByTime).toBe("2027-05-10")
    expect(r.nextDate).toBe("2026-12-21")
    expect(r.daysLeft).toBe(40)
    expect(r.status).toBe("soon")
  })

  it("2. M = 96 000 → перепробіг 1 000 км, «прострочено»", () => {
    const r = computeNextDue({ ...base, currentMileage: 96_000 })
    expect(r.remainingKm).toBe(-1_000)
    expect(r.forecastDateByKm).toBe(TODAY)
    expect(r.status).toBe("overdue")
  })

  it("3. M = 87 000 → лишилось 8 000 км, «в нормі»", () => {
    const r = computeNextDue({ ...base, currentMileage: 87_000 })
    expect(r.remainingKm).toBe(8_000)
    expect(r.status).toBe("ok")
  })

  it("4. лише інтервал за часом 24 міс → до 01.12.2026, «скоро»", () => {
    const r = computeNextDue({
      ...base,
      last: { date: "2024-12-01", mileage: 60_000 },
      intervalKm: null,
      intervalMonths: 24,
    })
    expect(r.dueDateByTime).toBe("2026-12-01")
    expect(r.remainingKm).toBeNull()
    expect(r.nextDate).toBe("2026-12-01")
    expect(r.daysLeft).toBe(20)
    expect(r.status).toBe("soon")
  })

  it("5. історія пробігу коротша за 14 днів → v = null, прогнозу за км немає", () => {
    const v = averageKmPerDay(
      [
        { date: "2026-11-01", mileage: 92_500 },
        { date: "2026-11-10", mileage: 93_000 },
      ],
      TODAY
    )
    expect(v).toBeNull()
    const r = computeNextDue({ ...base, avgKmPerDay: v })
    expect(r.forecastDateByKm).toBeNull()
    expect(r.nextDate).toBe("2027-05-10") // лишається строк за часом
  })

  it("8. немає попереднього виконання → «немає даних»", () => {
    const r = computeNextDue({ ...base, last: null })
    expect(r.status).toBe("no_data")
    expect(r.nextDate).toBeNull()
  })

  it("прострочено за часом, навіть якщо пробіг ще не досягнуто", () => {
    const r = computeNextDue({ ...base, last: { date: "2025-10-01", mileage: 90_000 } })
    expect(r.dueDateByTime).toBe("2026-10-01")
    expect(r.status).toBe("overdue")
  })
})

describe("averageKmPerDay", () => {
  it("рахує за останні 90 днів, ігноруючи старішу історію", () => {
    const v = averageKmPerDay(
      [
        { date: "2025-01-01", mileage: 10_000 }, // поза вікном (інший темп)
        { date: "2026-08-13", mileage: 90_000 }, // 90 днів до today
        { date: "2026-11-11", mileage: 94_500 },
      ],
      TODAY
    )
    expect(v).toBe(50)
  })

  it("якщо у вікні один запис — бере всю історію", () => {
    const v = averageKmPerDay(
      [
        { date: "2026-01-01", mileage: 80_000 },
        { date: "2026-11-01", mileage: 95_200 }, // 304 дні
      ],
      TODAY
    )
    expect(v).toBe(50)
  })

  it("якщо у вікні проміжок < 14 днів — теж уся історія", () => {
    const v = averageKmPerDay(
      [
        { date: "2026-07-14", mileage: 85_000 },
        { date: "2026-11-01", mileage: 90_000 },
        { date: "2026-11-11", mileage: 90_500 }, // 120 днів від першого
      ],
      TODAY
    )
    expect(v).toBeCloseTo(5_500 / 120, 10)
  })

  it("пробіг не зріс по всій історії → null", () => {
    expect(
      averageKmPerDay(
        [
          { date: "2026-01-01", mileage: 50_000 },
          { date: "2026-03-01", mileage: 50_000 },
        ],
        TODAY
      )
    ).toBeNull()
  })
})

describe("buildMaintenancePlan", () => {
  const type = (id: string, over: Partial<PlanType> = {}): PlanType => ({
    id,
    code: id,
    name: id,
    interval_km: 10_000,
    interval_months: 12,
    engine_types: null,
    sort_order: 10,
    ...over,
  })

  it("фільтрує за двигуном і правилами, сортує overdue → soon → ok → no_data", () => {
    const plan = buildMaintenancePlan({
      car: { engine_type: "diesel", current_mileage: 93_000 },
      types: [
        type("ok", { interval_km: 30_000, interval_months: null }),
        type("plugs", { engine_types: ["petrol"] }), // не для дизеля
        type("disabled"),
        type("nodata_b", { sort_order: 20 }),
        type("nodata_a", { sort_order: 5 }),
        type("overdue"),
        type("soon"),
        type("custom", { interval_km: 10_000 }),
      ],
      rules: [
        { maintenance_type_id: "disabled", interval_km: null, interval_months: null, is_enabled: false },
        // індивідуальний інтервал: 20 000 замість 10 000 → «в нормі»
        { maintenance_type_id: "custom", interval_km: 20_000, interval_months: null, is_enabled: true },
      ],
      lastByType: new Map([
        ["ok", { date: "2026-05-10", mileage: 85_000 }],
        ["overdue", { date: "2026-05-10", mileage: 80_000 }],
        ["soon", { date: "2026-05-10", mileage: 85_000 }],
        ["custom", { date: "2026-05-10", mileage: 85_000 }],
      ]),
      mileageEntries: [
        { date: "2026-08-13", mileage: 88_500 },
        { date: "2026-11-11", mileage: 93_000 },
      ],
      today: TODAY,
    })
    expect(plan.map((i) => [i.typeId, i.status])).toEqual([
      ["overdue", "overdue"],
      ["soon", "soon"],
      ["custom", "ok"],
      ["ok", "ok"],
      ["nodata_a", "no_data"],
      ["nodata_b", "no_data"],
    ])
    expect(plan.find((i) => i.typeId === "custom")?.intervalKm).toBe(20_000)
  })
})
