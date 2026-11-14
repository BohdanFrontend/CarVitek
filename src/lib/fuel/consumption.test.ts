import { describe, expect, it } from "vitest"

import { averageConsumption, fuelSegments } from "./consumption"

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
