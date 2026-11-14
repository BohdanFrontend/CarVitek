import type { Metadata } from "next"
import type { ReactNode } from "react"

// Сторінка — клієнтський компонент, тому metadata задаємо тут
export const metadata: Metadata = { title: "New password" }

export default function UpdatePasswordLayout({ children }: { children: ReactNode }) {
  return children
}
