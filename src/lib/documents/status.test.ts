import { createTranslator } from "next-intl"
import { describe, expect, it } from "vitest"

import en from "@/i18n/messages/en.json"
import uk from "@/i18n/messages/uk.json"
import { daysBadge } from "./describe"
import { documentStatus, sortDocuments } from "./status"

const today = "2026-11-17"
const tEn = createTranslator({ locale: "en", messages: en, namespace: "documents" })
const tUk = createTranslator({ locale: "uk", messages: uk, namespace: "documents" })

describe("documentStatus", () => {
  it("прострочений", () => {
    expect(documentStatus({ expiryDate: "2026-11-12", remindDays: 30, today })).toEqual({ status: "expired", daysLeft: -5 })
    expect(daysBadge({ status: "expired", daysLeft: -5 }, tEn)).toBe("Expired 5 days ago")
    expect(daysBadge({ status: "expired", daysLeft: -1 }, tEn)).toBe("Expired 1 day ago")
  })

  it("закінчується сьогодні → expiring, «Expires today»", () => {
    const s = documentStatus({ expiryDate: today, remindDays: 30, today })
    expect(s).toEqual({ status: "expiring", daysLeft: 0 })
    expect(daysBadge(s, tEn)).toBe("Expires today")
    expect(daysBadge(s, tUk)).toBe("Закінчується сьогодні")
  })

  it("рівно 30 днів → expiring, 31 → valid", () => {
    expect(documentStatus({ expiryDate: "2026-12-17", remindDays: null, today }).status).toBe("expiring")
    const valid = documentStatus({ expiryDate: "2026-12-18", remindDays: null, today })
    expect(valid).toEqual({ status: "valid", daysLeft: 31 })
    expect(daysBadge(valid, tEn)).toBe("31 days")
    expect(daysBadge(valid, tUk)).toBe("31 день")
  })

  it("без дати → no_expiry", () => {
    const s = documentStatus({ expiryDate: null, remindDays: 30, today })
    expect(s).toEqual({ status: "no_expiry", daysLeft: null })
    expect(daysBadge(s, tEn)).toBe("No expiry")
  })

  it("remindDays = 60", () => {
    expect(documentStatus({ expiryDate: "2027-01-16", remindDays: 60, today }).status).toBe("expiring")
    expect(documentStatus({ expiryDate: "2027-01-17", remindDays: 60, today }).status).toBe("valid")
  })

  it("сортування: expired → expiring → valid → no_expiry", () => {
    const docs = [
      { id: "a", type: "registration" as const, expiry_date: null, status: "no_expiry" as const },
      { id: "b", type: "osago" as const, expiry_date: "2027-06-12", status: "valid" as const },
      { id: "c", type: "casco" as const, expiry_date: "2027-01-01", status: "valid" as const },
      { id: "d", type: "tech_inspection" as const, expiry_date: "2026-12-03", status: "expiring" as const },
      { id: "e", type: "warranty" as const, expiry_date: "2026-10-01", status: "expired" as const },
    ]
    expect(sortDocuments(docs).map((d) => d.id)).toEqual(["e", "d", "c", "b", "a"])
  })
})
