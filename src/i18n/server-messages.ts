import { getTranslations } from "next-intl/server"

import { getFormat } from "./format-server"
import { formatParams, isMessageKey, parseMessage } from "./messages"

/** Серверний відповідник useMessageText: ключ повідомлення → текст мовою користувача. */
export async function getMessageText() {
  const [t, f] = await Promise.all([getTranslations(), getFormat()])
  return (value: string) => {
    if (!isMessageKey(value)) return value
    const { key, params } = parseMessage(value)
    return t(key as Parameters<typeof t>[0], formatParams(params, f) as never)
  }
}

/** Перекладає fieldErrors з Server Action (масиви ключів) — щоб клієнт отримав готовий текст. */
export async function translateFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  const text = await getMessageText()
  return Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.map(text)]))
}
