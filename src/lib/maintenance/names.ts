/**
 * Англійські назви системних робіт ТО. У довіднику (міграція) назви українською,
 * тож для інтерфейсу зіставляємо їх за стабільним `code`.
 * Власні типи користувача (без code) показуються як є.
 */
const NAMES: Record<string, string> = {
  engine_oil: "Oil change",
  air_filter: "Air filter",
  cabin_filter: "Cabin filter",
  fuel_filter: "Fuel filter",
  lpg_filters: "LPG filters",
  spark_plugs: "Spark plugs",
  brake_pads: "Brake pads",
  brake_fluid: "Brake fluid",
  coolant: "Coolant",
  timing_belt: "Timing belt",
  gearbox_oil: "Gearbox oil",
  tire_rotation: "Seasonal tire change",
  wheel_alignment: "Wheel alignment",
  battery: "12V battery check",
}

export const maintenanceName = (code: string | null, fallback: string) =>
  (code && NAMES[code]) || fallback
