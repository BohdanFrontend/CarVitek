import type { Formatter } from "@/lib/format"

/**
 * Перекладні повідомлення для zod-схем і Server Actions.
 * Схеми спільні для клієнта й сервера і не знають мови, тож повертають ключ
 * ("validation.enterMake") або ключ з параметрами ("validation.mileageTooLow|{"km":93000}"),
 * а перекладає вже той, хто показує помилку (Field на клієнті або дія на сервері).
 */
export type MessageParams = Record<string, string | number>

export const msg = (key: string, params?: MessageParams) =>
  params ? `${key}|${JSON.stringify(params)}` : key

export function parseMessage(value: string): { key: string; params?: MessageParams } {
  const i = value.indexOf("|")
  if (i < 0) return { key: value }
  try {
    return { key: value.slice(0, i), params: JSON.parse(value.slice(i + 1)) }
  } catch {
    return { key: value.slice(0, i) }
  }
}

/** Чи це ключ словника (а не вже готовий текст). */
export const isMessageKey = (value: string) => /^(validation|errors|auth)\.[\w.]+(\|.*)?$/.test(value)

/** Параметри з числами форматуються за мовою: km → «93 000 km», amount → гроші. */
export function formatParams(params: MessageParams | undefined, f: Formatter) {
  if (!params) return undefined
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) => [
      k,
      typeof v === "number" ? (k === "km" ? f.km(v) : k === "amount" ? f.money(v) : f.number(v)) : v,
    ])
  )
}
