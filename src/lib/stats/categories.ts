import type { Enums } from "@/lib/supabase/database.types"

export type ExpenseCategory = Enums<"expense_category">

/** Категорії витрат для статистики: пальне й ТО з окремих журналів + категорії expenses. */
export const SPEND_CATEGORIES = [
  "fuel",
  "maintenance",
  "repair",
  "insurance",
  "wash",
  "parking",
  "tax",
  "fine",
  "other",
] as const
export type SpendCategory = (typeof SPEND_CATEGORIES)[number]

export const EXPENSE_CATEGORIES = [
  "repair",
  "insurance",
  "wash",
  "parking",
  "tax",
  "fine",
  "other",
] as const satisfies readonly ExpenseCategory[]

export const CATEGORY_LABELS: Record<SpendCategory, string> = {
  fuel: "Fuel",
  maintenance: "Maintenance",
  repair: "Repair",
  insurance: "Insurance",
  wash: "Car wash",
  parking: "Parking",
  tax: "Tax",
  fine: "Fines",
  other: "Other",
}

/** Сталі кольори категорій (діаграми й легенди). */
export const CATEGORY_COLORS: Record<SpendCategory, string> = {
  fuel: "#F97316",
  maintenance: "#10B981",
  repair: "#3B82F6",
  insurance: "#A855F7",
  wash: "#8B5CF6",
  parking: "#64748B",
  tax: "#0EA5E9",
  fine: "#475569",
  other: "#94A3B8",
}
