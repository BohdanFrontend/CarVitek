"use client"

import { useTranslations } from "next-intl"
import { useCallback } from "react"

import { useFormat } from "./format-client"
import { formatParams, isMessageKey, parseMessage } from "./messages"

/** Перекладає ключ повідомлення (з zod-схеми або Server Action) у текст поточною мовою. */
export function useMessageText() {
  const t = useTranslations()
  const f = useFormat()
  return useCallback(
    (value: string | undefined | null) => {
      if (!value) return value ?? undefined
      if (!isMessageKey(value)) return value
      const { key, params } = parseMessage(value)
      // ключі приходять як рядки з даних — перевірити їх тип на етапі компіляції неможливо
      return t(key as Parameters<typeof t>[0], formatParams(params, f) as never)
    },
    [t, f]
  )
}
