import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import type { ReactNode } from "react"

// Сторінка — клієнтський компонент, тому metadata задаємо тут
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.forgot"))("metaTitle") }
}

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children
}
