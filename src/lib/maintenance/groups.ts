/** Групи робіт для фільтр-чіпів журналу ТО (за стабільним code системних типів). */
export const WORK_GROUPS = ["oil", "filters", "brakes", "tires", "other"] as const
export type WorkGroup = (typeof WORK_GROUPS)[number]

export const WORK_GROUP_LABELS: Record<WorkGroup, string> = {
  oil: "Oil",
  filters: "Filters",
  brakes: "Brakes",
  tires: "Tires",
  other: "Other",
}

const GROUP_BY_CODE: Record<string, WorkGroup> = {
  engine_oil: "oil",
  gearbox_oil: "oil",
  air_filter: "filters",
  cabin_filter: "filters",
  fuel_filter: "filters",
  lpg_filters: "filters",
  brake_pads: "brakes",
  brake_fluid: "brakes",
  tire_rotation: "tires",
  wheel_alignment: "tires",
}

/** Група роботи; власні типи (без code) і решта — «Other». */
export const workGroup = (code: string | null): WorkGroup => (code && GROUP_BY_CODE[code]) || "other"

export const isWorkGroup = (value: unknown): value is WorkGroup =>
  typeof value === "string" && (WORK_GROUPS as readonly string[]).includes(value)
