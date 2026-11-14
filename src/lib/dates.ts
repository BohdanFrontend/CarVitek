import { format, parseISO } from "date-fns"

/** Дата без часу у форматі "YYYY-MM-DD". */
export type ISODate = string

export const toISODate = (date: Date): ISODate => format(date, "yyyy-MM-dd")
export const fromISODate = (value: ISODate): Date => parseISO(value)

/** Сьогоднішня дата в часовому поясі Києва (а не UTC сервера). */
export function todayInKyiv(now: Date = new Date()): ISODate {
  // en-CA форматує дату як YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}
