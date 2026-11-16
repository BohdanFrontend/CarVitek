import { describe, expect, it } from "vitest"

import { averageConsumption, consumptionForPeriod, fuelSegments, monthlyConsumption } from "./consumption"

describe("витрата пального «від повного до повного»", () => {
  it("6. повна 45 л → неповна 20 л → повна 25 л = 6.43 л/100 км", () => {
    const segments = fuelSegments([
      { mileage: 10_350, liters: 20, isFullTank: false },
      { mileage: 10_000, liters: 45, isFullTank: true },
      { mileage: 10_700, liters: 25, isFullTank: true },
    ])
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({ fromMileage: 10_000, toMileage: 10_700, liters: 45, distance: 700 })
    expect(Number(averageConsumption(segments)!.toFixed(2))).toBe(6.43)
  })

  it("7. неповна заправка після останньої повної не входить у середнє", () => {
    const segments = fuelSegments([
      { mileage: 10_000, liters: 45, isFullTank: true },
      { mileage: 10_350, liters: 20, isFullTank: false },
      { mileage: 10_700, liters: 25, isFullTank: true },
      { mileage: 11_000, liters: 30, isFullTank: false },
    ])
    expect(segments).toHaveLength(1)
    expect(Number(averageConsumption(segments)!.toFixed(2))).toBe(6.43)
  })

  it("середнє зважене за пробігом, а не середнє сегментів", () => {
    const segments = fuelSegments([
      { mileage: 0, liters: 40, isFullTank: true },
      { mileage: 100, liters: 10, isFullTank: true }, // 10 л/100
      { mileage: 1_100, liters: 50, isFullTank: true }, // 5 л/100
    ])
    expect(averageConsumption(segments)).toBeCloseTo((100 * 60) / 1_100, 10)
  })

  it("без пари повних заправок даних немає", () => {
    expect(averageConsumption(fuelSegments([{ mileage: 1_000, liters: 40, isFullTank: true }]))).toBeNull()
    expect(averageConsumption([])).toBeNull()
  })
})

describe("прив'язка сегментів до заправок", () => {
  it("сегмент знає, яка заправка його закриває (для колонки L/100 km і графіка)", () => {
    const segments = fuelSegments([
      { id: "a", date: "2026-09-02", mileage: 10_000, liters: 45, isFullTank: true },
      { id: "b", date: "2026-09-10", mileage: 10_350, liters: 20, isFullTank: false },
      { id: "c", date: "2026-09-19", mileage: 10_700, liters: 25, isFullTank: true },
    ])
    expect(segments.map((s) => [s.toId, s.toDate])).toEqual([["c", "2026-09-19"]])
  })
})

describe("monthlyConsumption і період", () => {
  const seg = (toDate: string, distance: number, liters: number) => ({
    fromMileage: 0,
    toMileage: distance,
    distance,
    liters,
    lPer100km: (100 * liters) / distance,
    toDate,
  })

  it("два сегменти в одному місяці зважуються за відстанню, місяць без сегментів пропускається", () => {
    const points = monthlyConsumption([
      seg("2026-03-05", 200, 20), // 10 л/100
      seg("2026-03-25", 800, 40), // 5 л/100
      seg("2026-05-10", 500, 30), // квітня немає
    ])
    expect(points.map((p) => p.key)).toEqual(["2026-03", "2026-05"])
    // 100 · 60 / 1000 = 6, а не (10 + 5) / 2 = 7.5
    expect(points[0]).toEqual({ key: "2026-03", value: 6, distance: 1000, liters: 60 })
    expect(points[1].value).toBe(6)
  })

  it("6M: останні 6 календарних місяців і зміна до попередніх 6", () => {
    const r = consumptionForPeriod(
      [
        seg("2025-12-10", 1000, 80), // попередній період: 2025-12 … 2026-05
        seg("2026-04-10", 1000, 70), // попередній період: 2025-12 … 2026-05
        seg("2026-06-10", 1000, 60), // поточний: 2026-06 … 2026-11
        seg("2026-11-02", 1000, 62),
      ],
      "6m",
      "2026-11-14"
    )
    expect(r.points.map((p) => p.key)).toEqual(["2026-06", "2026-11"])
    expect(r.granularity).toBe("month")
    expect(r.average).toBeCloseTo(6.1, 10)
    expect(r.previousAverage).toBeCloseTo(7.5, 10)
    expect(r.change).toBeCloseTo(-1.4, 10)
    expect([r.min, r.max]).toEqual([6, 6.2])
  })

  it("All — без порівняння", () => {
    const r = consumptionForPeriod([seg("2024-01-10", 1000, 70)], "all", "2026-11-14")
    expect(r.points).toHaveLength(1)
    expect(r.change).toBeNull()
  })
})

describe("деталізація графіка", () => {
  const seg = (toDate: string, distance: number, liters: number) => ({
    fromMileage: 0, toMileage: distance, distance, liters, lPer100km: (100 * liters) / distance, toDate,
  })

  it("якщо всі сегменти в одному місяці — точка на кожну заправку, а не одна на місяць", () => {
    const r = consumptionForPeriod(
      [seg("2026-11-14", 300, 50), seg("2026-11-16", 100, 40)],
      "1y",
      "2026-11-16"
    )
    expect(r.granularity).toBe("day")
    expect(r.points.map((p) => [p.key, Number(p.value.toFixed(1))])).toEqual([
      ["2026-11-14", 16.7],
      ["2026-11-16", 40],
    ])
    expect(r.average).toBeCloseTo(22.5, 10) // середнє лишається зваженим за пробігом
  })

  it("одна заправка за період — одна точка", () => {
    const r = consumptionForPeriod([seg("2026-11-14", 300, 50)], "6m", "2026-11-16")
    expect(r.points).toHaveLength(1)
    expect(r.granularity).toBe("month")
  })
})
